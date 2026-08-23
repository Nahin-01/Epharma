'use strict';

const router = require('express').Router();
const controller = require('./product.controller');
const validation = require('./product.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { uploadImage: uploadImageMiddleware, handleUploadErrors } = require('../../middleware/upload.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

// Public catalog & search
router.get('/', validateQuery(validation.listProductsQuery), controller.list);
router.get('/slug/:slug', controller.getBySlug);
router.get('/:id/related', controller.getRelated);
router.get('/:id', controller.getById);

// Admin/inventory management
router.post(
  '/upload-image',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCT_CREATE),
  handleUploadErrors(uploadImageMiddleware.single('image')),
  controller.uploadImage
);
router.post('/', authenticate, requirePermission(PERMISSIONS.PRODUCT_CREATE), validateBody(validation.createProduct), controller.create);
router.patch('/:id', authenticate, requirePermission(PERMISSIONS.PRODUCT_UPDATE), validateBody(validation.updateProduct), controller.update);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.PRODUCT_DELETE), controller.remove);

module.exports = router;
