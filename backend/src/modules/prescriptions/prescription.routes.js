'use strict';

const router = require('express').Router();
const controller = require('./prescription.controller');
const validation = require('./prescription.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { uploadPrescription, handleUploadErrors } = require('../../middleware/upload.middleware');
const { PERMISSIONS } = require('../../constants/permissions');
const env = require('../../config/env');

router.use(authenticate);

router.post(
  '/',
  handleUploadErrors(uploadPrescription.array('files', env.storage.maxPrescriptionFiles)),
  validateBody(validation.uploadPrescription),
  controller.upload
);

router.get('/mine', controller.listMine);

router.get('/review-queue', requirePermission(PERMISSIONS.PRESCRIPTION_VIEW), validateQuery(validation.listQuery), controller.listForReview);
router.patch('/:id/review', requirePermission(PERMISSIONS.PRESCRIPTION_REVIEW), validateBody(validation.reviewPrescription), controller.review);

router.post('/:id/clarifications', validateBody(validation.addClarification), controller.addClarification);
router.get('/:id/files/:fileId/signed-url', controller.getSignedFileUrl);
router.get('/:id', controller.getById);

module.exports = router;
