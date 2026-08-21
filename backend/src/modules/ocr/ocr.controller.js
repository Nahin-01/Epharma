'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const ocrService = require('./ocr.service');

const reprocess = asyncHandler(async (req, res) => {
  const result = await ocrService.reprocess(req.body.prescriptionId, req.body.fileId);
  return ApiResponse.ok(res, result, 'OCR reprocessing queued');
});

const getResult = asyncHandler(async (req, res) => {
  const result = await ocrService.getResult(req.params.prescriptionId, req.params.fileId);
  return ApiResponse.ok(res, result);
});

module.exports = { reprocess, getResult };
