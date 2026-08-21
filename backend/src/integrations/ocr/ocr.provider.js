'use strict';

const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * OCR provider abstraction consumed by the prescriptionOCR job. "mock"
 * (default) returns a deterministic, low-confidence placeholder result so
 * the full prescription pipeline (upload -> queue -> extraction -> medicine
 * matching -> review) can be exercised without a paid OCR subscription.
 * Swap OCR_PROVIDER to a real vendor (Google Vision, Textract, ...) once
 * credentials are available; the job code does not need to change.
 */
async function extractMock(fileBuffer, { filename } = {}) {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    provider: 'mock',
    rawText:
      'Rx\nParacetamol 500mg - 1 tab TDS x 5 days\nAmoxicillin 250mg - 1 cap BID x 7 days\nCetirizine 10mg - 1 tab OD x 3 days',
    lines: [
      { text: 'Paracetamol 500mg - 1 tab TDS x 5 days', confidence: 0.62 },
      { text: 'Amoxicillin 250mg - 1 cap BID x 7 days', confidence: 0.58 },
      { text: 'Cetirizine 10mg - 1 tab OD x 3 days', confidence: 0.6 },
    ],
    overallConfidence: 0.6,
    meta: { filename, sizeBytes: fileBuffer ? fileBuffer.length : 0 },
  };
}

/**
 * OCR.space (https://ocr.space/ocrapi) - free-tier-friendly real OCR used
 * when OCR_PROVIDER=ocrspace. Sends the file as a base64 data URI; the free
 * key is capped at 1MB per request and ~25000 requests/month, which is
 * enough for a dev/course deployment.
 */
async function extractOcrSpace(fileBuffer, { filename, mimeType } = {}) {
  if (!env.ocr.apiKey || !env.ocr.apiUrl) {
    logger.warn('OCR.space credentials missing, falling back to mock extraction');
    return extractMock(fileBuffer, { filename });
  }
  if (!fileBuffer || fileBuffer.length === 0) {
    logger.warn('OCR.space: empty file buffer, falling back to mock extraction');
    return extractMock(fileBuffer, { filename });
  }
  try {
    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;
    const params = new URLSearchParams({
      apikey: env.ocr.apiKey,
      base64Image: dataUri,
      language: 'eng',
      isOverlayRequired: 'false',
      scale: 'true',
      OCREngine: '2',
    });
    const { data } = await axios.post(env.ocr.apiUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
    });

    if (data.IsErroredOnProcessing || Number(data.OCRExitCode) > 2) {
      const message = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join('; ') : data.ErrorMessage || data.ErrorDetails;
      throw new Error(message || 'OCR.space failed to process the image');
    }

    const rawText = (data.ParsedResults || [])
      .map((r) => r.ParsedText || '')
      .join('\n')
      .trim();

    return {
      provider: 'ocrspace',
      rawText,
      lines: rawText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((text) => ({ text, confidence: 0.7 })),
      overallConfidence: rawText ? 0.7 : 0,
      meta: { filename, sizeBytes: fileBuffer.length },
    };
  } catch (err) {
    logger.error(`OCR.space extraction failed: ${err.message}`);
    throw err;
  }
}

async function extractGeneric(fileBuffer, opts = {}) {
  if (!env.ocr.apiKey || !env.ocr.apiUrl) {
    logger.warn('OCR provider credentials missing, falling back to mock extraction');
    return extractMock(fileBuffer, opts);
  }
  try {
    const { data } = await axios.post(
      env.ocr.apiUrl,
      { image: fileBuffer.toString('base64') },
      { headers: { Authorization: `Bearer ${env.ocr.apiKey}` }, timeout: 30000 }
    );
    return {
      provider: env.ocr.provider,
      rawText: data.text || '',
      lines: data.lines || [],
      overallConfidence: data.confidence ?? 0,
      meta: data.meta || {},
    };
  } catch (err) {
    logger.error(`OCR extraction failed: ${err.message}`);
    throw err;
  }
}

async function extractText(fileBuffer, opts = {}) {
  if (env.ocr.provider === 'mock') return extractMock(fileBuffer, opts);
  if (env.ocr.provider === 'ocrspace') return extractOcrSpace(fileBuffer, opts);
  return extractGeneric(fileBuffer, opts);
}

module.exports = { extractText };
