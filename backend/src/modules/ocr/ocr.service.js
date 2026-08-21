'use strict';

const ApiError = require('../../utils/apiError');
const prescriptionService = require('../prescriptions/prescription.service');

/**
 * Thin orchestration layer over the prescription OCR pipeline. The actual
 * extraction happens in the BullMQ worker (jobs/prescriptionOCR.job.js)
 * backed by integrations/ocr/ocr.provider.js; this module exposes
 * queue/result visibility and manual reprocessing to staff.
 */
async function reprocess(prescriptionId, fileId) {
  const prescription = await prescriptionService.getRawById(prescriptionId);
  if (!prescription) throw ApiError.notFound('Prescription not found');
  const file = prescription.files.id(fileId);
  if (!file) throw ApiError.notFound('File not found on this prescription');

  const { enqueueOcrJob } = require('../../jobs/prescriptionOCR.job');
  const job = await enqueueOcrJob({ prescriptionId: String(prescriptionId), fileId: String(fileId) });
  return { queued: true, jobId: job.id };
}

async function getResult(prescriptionId, fileId) {
  const prescription = await prescriptionService.getRawById(prescriptionId);
  if (!prescription) throw ApiError.notFound('Prescription not found');
  const file = prescription.files.id(fileId);
  if (!file) throw ApiError.notFound('File not found on this prescription');
  return {
    fileId,
    originalName: file.originalName,
    processed: Boolean(file.ocrResult),
    result: file.ocrResult || null,
  };
}

module.exports = { reprocess, getResult };
