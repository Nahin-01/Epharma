'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');
const prescriptionService = require('./prescription.service');

const upload = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) throw ApiError.badRequest('At least one prescription file is required');

  const prescription = await prescriptionService.uploadPrescription({
    customerId: req.user.id,
    files,
    source: req.body.source || 'UPLOAD',
  });
  return ApiResponse.created(res, prescription, 'Prescription uploaded successfully and queued for review');
});

const getById = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.getById(req.params.id, req.user);
  return ApiResponse.ok(res, prescription);
});

const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await prescriptionService.listMine(req.user.id, req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const listForReview = asyncHandler(async (req, res) => {
  const { items, meta } = await prescriptionService.listForReview(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const review = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.review(req.params.id, req.user, req.body);
  return ApiResponse.ok(res, prescription, 'Prescription review recorded');
});

const addClarification = asyncHandler(async (req, res) => {
  const prescription = await prescriptionService.addClarification(req.params.id, req.user, req.body.note);
  return ApiResponse.ok(res, prescription, 'Clarification added');
});

const getSignedFileUrl = asyncHandler(async (req, res) => {
  const result = await prescriptionService.getSignedFileUrl(req.params.id, req.params.fileId, req.user);
  return ApiResponse.ok(res, result);
});

module.exports = { upload, getById, listMine, listForReview, review, addClarification, getSignedFileUrl };
