'use strict';

const { getQueue, QUEUE_NAMES } = require('./queue');
const logger = require('../utils/logger');
const { extractText } = require('../integrations/ocr/ocr.provider');

const queue = getQueue(QUEUE_NAMES.OCR);

/**
 * Enqueues a background OCR job for one uploaded prescription file.
 * Implements PHASE 4 of the prescription flow: Upload -> private storage ->
 * BullMQ OCR job -> OCR provider -> extracted text -> medicine matching ->
 * confidence score -> user/system verification -> order.
 */
async function enqueueOcrJob({ prescriptionId, fileId }) {
  return queue.add(
    'extract-prescription',
    { prescriptionId, fileId },
    { jobId: `ocr-${prescriptionId}-${fileId}` }
  );
}

/**
 * Worker processor. Loaded lazily (not at module top-level) to avoid
 * circular requires between job files and the modules that enqueue them.
 */
async function processor(job) {
  const { prescriptionId, fileId } = job.data;
  const prescriptionService = require('../modules/prescriptions/prescription.service');
  const storage = require('../config/storage').getStorageProvider();

  logger.info(`[ocr-job] Processing prescription ${prescriptionId} file ${fileId}`);

  const prescription = await prescriptionService.getRawById(prescriptionId);
  if (!prescription) {
    logger.warn(`[ocr-job] Prescription ${prescriptionId} no longer exists, skipping`);
    return { skipped: true };
  }

  const file = prescription.files.id(fileId);
  if (!file) {
    logger.warn(`[ocr-job] File ${fileId} not found on prescription ${prescriptionId}, skipping`);
    return { skipped: true };
  }

  let buffer = null;
  try {
    const fs = require('fs');
    buffer = await fs.promises.readFile(storage.resolvePath(file.storageKey));
  } catch (err) {
    logger.error(`[ocr-job] Could not read stored file for OCR: ${err.message}`);
  }

  const result = await extractText(buffer || Buffer.alloc(0), { filename: file.originalName, mimeType: file.mimeType });
  const matches = await prescriptionService.matchMedicinesFromText(result.rawText);

  await prescriptionService.attachOcrResult(prescriptionId, fileId, {
    provider: result.provider,
    rawText: result.rawText,
    overallConfidence: result.overallConfidence,
    matchedMedicines: matches,
  });

  return { prescriptionId, fileId, matchesCount: matches.length };
}

module.exports = { queue, enqueueOcrJob, processor };
