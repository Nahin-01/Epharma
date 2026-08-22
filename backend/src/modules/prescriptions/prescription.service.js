'use strict';

const prescriptionRepository = require('./prescription.repository');
const ApiError = require('../../utils/apiError');
const { recordAudit } = require('../../utils/audit');
const { getStorageProvider } = require('../../config/storage');
const { PRESCRIPTION_STATUS, PRESCRIPTION_STATUS_TRANSITIONS } = require('../../constants/orderStatus');

async function uploadPrescription({ customerId, files, source = 'UPLOAD' }) {
  if (!files || files.length === 0) {
    throw ApiError.badRequest('At least one prescription file is required');
  }

  const storage = getStorageProvider();
  const storedFiles = [];
  for (const file of files) {
    const { key } = await storage.save(file.buffer, {
      folder: `prescriptions/${customerId}`,
      filename: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
      contentType: file.mimetype,
    });
    storedFiles.push({
      storageKey: key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  const prescription = await prescriptionRepository.create({
    customer: customerId,
    source,
    files: storedFiles,
    status: PRESCRIPTION_STATUS.UPLOADED,
  });

  await recordAudit({
    actorId: customerId,
    actorRole: 'CUSTOMER',
    action: 'PRESCRIPTION_UPLOADED',
    entityType: 'Prescription',
    entityId: prescription._id,
    changes: { fileCount: storedFiles.length },
  });

  // Enqueue OCR extraction for every uploaded file.
  const { enqueueOcrJob } = require('../../jobs/prescriptionOCR.job');
  for (const file of prescription.files) {
    await enqueueOcrJob({ prescriptionId: String(prescription._id), fileId: String(file._id) });
  }

  return prescription;
}

async function getRawById(id) {
  return prescriptionRepository.findRawById(id);
}

async function getById(id, requester) {
  const prescription = await prescriptionRepository.findById(id, {
    populate: [
      { path: 'customer', select: 'name email phone' },
      { path: 'reviewedBy', select: 'name role' },
    ],
  });
  if (!prescription) throw ApiError.notFound('Prescription not found');
  assertCanAccess(prescription, requester);
  return prescription;
}

function assertCanAccess(prescription, requester) {
  if (!requester) return;
  const isOwner = String(prescription.customer._id || prescription.customer) === String(requester.id);
  const isStaff = requester.role !== 'CUSTOMER';
  if (!isOwner && !isStaff) {
    throw ApiError.forbidden('You do not have access to this prescription');
  }
}

async function listMine(customerId, query) {
  return prescriptionRepository.listForCustomer(customerId, query);
}

async function listForReview(query) {
  return prescriptionRepository.listForReview(query);
}

/**
 * Normalizes free-form prescription text for matching: lowercases, collapses
 * a number followed by a unit ("500 mg" / "500-mg") down to "500mg" so
 * dosage strings compare equal regardless of OCR spacing, then strips
 * remaining punctuation.
 */
function normalizeText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/(\d+)\s*-?\s*(mg|mcg|ml|g|iu)\b/g, '$1$2')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein edit distance, used to tolerate 1-2 character OCR misreads
 * (e.g. "Amoxicilin" vs "Amoxicillin") without matching unrelated words. */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j - 1], prev[j], row[j - 1]);
    }
    prev = row;
  }
  return prev[b.length];
}

// Dosage-form words are almost never spelled out in full on a real
// prescription ("Tab." / "Cap." / "Inj." instead of "Tablet" / "Capsule" /
// "Injection"), so they must not be required to appear verbatim - only the
// brand/generic name and strength are reliable signals.
const DOSAGE_FORM_STOPWORDS = new Set([
  'tablet', 'tablets', 'tab', 'capsule', 'capsules', 'cap',
  'injection', 'inj', 'syrup', 'syp', 'suspension', 'susp',
  'cream', 'ointment', 'oint', 'drops', 'drop', 'inhaler', 'device',
]);

// Real prescriptions are mostly letterhead/metadata, not drug lines: doctor
// name & credentials, clinic address, phone, timing, patient info, dates,
// "advice given", follow-up, signature. Left unfiltered, every one of those
// OCR lines was being shown to the customer as a "detected medicine" that's
// "not in database" - noisy and misleading. Lines matching this are almost
// never a drug entry, so they're dropped outright before matching.
const NON_MEDICINE_LINE_PATTERN =
  /\b(dr\.?|prof\.?|m\.?b\.?b\.?s\.?|m\.?d\.?|m\.?s\.?|d\.?g\.?o\.?|reg\.?\s*no\.?|mob\.?\s*no\.?|ph\s*:|phone|tel\.?\s*:|fax|address|near\b|pin\s*:|pincode|timing|closed|clinic|hospital|opd|patient|signature|follow[\s-]?up|advice|chart|age\s*:|sex\s*:|weight|height|\bbp\s*:|temp\.?\s*:|vitals?)\b/i;
const DATE_TIME_LINE_PATTERN =
  /\b\d{1,2}[:.]\d{2}\s*(am|pm)?\b|\b\d{1,2}[-/][a-z]{3,9}[-/]\d{2,4}\b|\b(am|pm)\s*-\s*\d{1,2}[:.]\d{2}/i;

// The inverse signal: a strength, dosage form, or frequency abbreviation is
// what actually distinguishes a drug line from prose, so a line carrying one
// of these is kept even when it doesn't match anything in the catalogue -
// that's a real medicine we just don't stock, not noise.
const DRUG_SIGNAL_PATTERN =
  /\b(tab|cap|syp|inj|susp|oint|drop|gel|cream|lotion|tablet|capsule|syrup|injection|suspension|ointment)\b|\d+\s?(mg|mcg|ml|g|iu)\b|\b(od|bd|bid|tds|tid|qid|hs|sos|prn|stat)\b/i;

function fuzzyTokenPresent(lineTokens, token) {
  if (token.length < 4) return lineTokens.includes(token);
  const maxDistance = token.length > 7 ? 2 : 1;
  return lineTokens.some((t) => t === token || levenshtein(t, token) <= maxDistance);
}

/**
 * Scores how well a catalogue key (a product's name / genericName / enName,
 * already normalized) matches one OCR line. Exact substring match after
 * normalization wins outright; otherwise falls back to requiring every
 * significant word of the key to appear somewhere in the line (in any
 * order, tolerant of small OCR typos), which survives word-order changes
 * and formatting differences that break plain substring matching.
 */
function scoreKeyAgainstLine(key, lineNormalized, lineTokens) {
  if (!key) return 0;
  if (lineNormalized.includes(key)) return 1;

  const keyTokens = key.split(' ').filter((t) => t.length > 2 && !DOSAGE_FORM_STOPWORDS.has(t));
  if (!keyTokens.length) return 0;
  const allPresent = keyTokens.every((kt) => fuzzyTokenPresent(lineTokens, kt));
  return allPresent ? 0.8 : 0;
}

/**
 * Medicine-matching against the product/generic catalogue: splits OCR raw
 * text into lines and, for every line, finds the catalogue product whose
 * name/generic name best matches it (normalized + fuzzy, not a brittle exact
 * substring check), so OCR spacing/typo noise and word-order differences
 * don't silently produce "medicine not recognised" results. Swappable for a
 * real NLP/entity-extraction service later without changing the surrounding
 * workflow.
 */
async function matchMedicinesFromText(rawText) {
  if (!rawText) return [];
  const Product = require('../products/product.model');

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates = await Product.find({ status: 'ACTIVE' })
    .select('name genericName enName')
    .limit(2000)
    .lean();

  const keyedCandidates = candidates.map((product) => ({
    product,
    nameKey: normalizeText(product.name),
    genericKey: normalizeText(product.genericName),
    enNameKey: normalizeText(product.enName),
  }));

  const matches = [];
  for (const line of lines) {
    if (line.length < 3) continue;
    if (NON_MEDICINE_LINE_PATTERN.test(line) || DATE_TIME_LINE_PATTERN.test(line)) continue;

    const lineNormalized = normalizeText(line);
    const lineTokens = lineNormalized.split(' ').filter(Boolean);

    let best = null;
    for (const candidate of keyedCandidates) {
      // Product name is the strongest signal (usually the brand as printed
      // on the box/label), generic name is next, English alt-name last.
      const nameScore = scoreKeyAgainstLine(candidate.nameKey, lineNormalized, lineTokens) * 0.95;
      const genericScore = scoreKeyAgainstLine(candidate.genericKey, lineNormalized, lineTokens) * 0.75;
      const enNameScore = scoreKeyAgainstLine(candidate.enNameKey, lineNormalized, lineTokens) * 0.7;
      const confidence = Math.max(nameScore, genericScore, enNameScore);

      if (confidence > 0 && (!best || confidence > best.confidence)) {
        best = { product: candidate.product._id, productName: candidate.product.name, confidence };
      }
    }

    // No catalogue match and nothing that even looks like a strength/dosage
    // form/frequency - almost certainly not a drug line at all (a stray
    // header, a table artifact, page furniture), so it's dropped rather than
    // shown as a fake "not in database" result.
    if (!best && !DRUG_SIGNAL_PATTERN.test(line)) continue;

    matches.push({
      text: line,
      product: best ? best.product : null,
      productName: best ? best.productName : null,
      confidence: best ? Math.round(best.confidence * 100) / 100 : 0,
    });
  }
  return matches;
}

async function attachOcrResult(prescriptionId, fileId, { provider, rawText, overallConfidence, matchedMedicines }) {
  const prescription = await prescriptionRepository.findRawById(prescriptionId);
  if (!prescription) return null;

  const file = prescription.files.id(fileId);
  if (!file) return null;

  file.ocrResult = {
    provider,
    rawText,
    overallConfidence,
    matchedMedicines,
    processedAt: new Date(),
  };

  if (prescription.status === PRESCRIPTION_STATUS.UPLOADED) {
    prescription.status = PRESCRIPTION_STATUS.UNDER_REVIEW;
  }

  await prescription.save();
  return prescription;
}

async function review(prescriptionId, reviewer, { status, notes }) {
  const prescription = await prescriptionRepository.findRawById(prescriptionId);
  if (!prescription) throw ApiError.notFound('Prescription not found');

  const allowed = PRESCRIPTION_STATUS_TRANSITIONS[prescription.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(`Cannot transition prescription from ${prescription.status} to ${status}`);
  }

  prescription.status = status;
  prescription.reviewedBy = reviewer.id;
  prescription.reviewedAt = new Date();
  if (notes) prescription.reviewerNotes = notes;
  if (status === PRESCRIPTION_STATUS.NEEDS_CLARIFICATION && notes) {
    prescription.clarificationHistory.push({ note: notes, by: reviewer.id });
  }

  await prescription.save();

  await recordAudit({
    actorId: reviewer.id,
    actorRole: reviewer.role,
    action: 'PRESCRIPTION_REVIEWED',
    entityType: 'Prescription',
    entityId: prescription._id,
    changes: { status, notes },
  });

  return prescription;
}

async function addClarification(prescriptionId, requester, note) {
  const prescription = await prescriptionRepository.findRawById(prescriptionId);
  if (!prescription) throw ApiError.notFound('Prescription not found');
  assertCanAccess(prescription, requester);
  prescription.clarificationHistory.push({ note, by: requester.id });
  await prescription.save();
  return prescription;
}

async function linkToOrder(prescriptionId, orderId) {
  return prescriptionRepository.updateById(prescriptionId, { order: orderId });
}

async function getSignedFileUrl(prescriptionId, fileId, requester) {
  const prescription = await prescriptionRepository.findRawById(prescriptionId);
  if (!prescription) throw ApiError.notFound('Prescription not found');
  assertCanAccess(prescription, requester);

  const file = prescription.files.id(fileId);
  if (!file) throw ApiError.notFound('File not found on this prescription');

  await recordAudit({
    actorId: requester?.id,
    actorRole: requester?.role,
    action: 'PRESCRIPTION_FILE_ACCESSED',
    entityType: 'Prescription',
    entityId: prescription._id,
    changes: { fileId },
  });

  const storage = getStorageProvider();
  const url = await storage.getSignedUrl(file.storageKey);
  return { url, expiresInMinutes: require('../../config/env').storage.signedUrlExpiresInMinutes };
}

module.exports = {
  uploadPrescription,
  getRawById,
  getById,
  listMine,
  listForReview,
  matchMedicinesFromText,
  attachOcrResult,
  review,
  addClarification,
  linkToOrder,
  getSignedFileUrl,
};
