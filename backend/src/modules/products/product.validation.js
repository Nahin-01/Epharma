'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');

const dosageForm = Joi.string().valid(
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'SUSPENSION',
  'CREAM',
  'OINTMENT',
  'DROPS',
  'INJECTION',
  'INHALER',
  'DEVICE',
  'OTHER'
);

const createProduct = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  bnName: Joi.string().max(200).allow(''),
  enName: Joi.string().max(200).allow(''),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).max(200).required(),
  sku: Joi.string().max(50).optional(),

  genericName: Joi.string().max(200).allow(''),
  generic: objectId.optional().allow(null),
  brand: objectId.optional().allow(null),
  category: objectId.required(),

  dosageForm: dosageForm.default('OTHER'),
  strength: Joi.string().max(50).allow(''),
  manufacturer: Joi.string().max(150).allow(''),

  prescriptionRequired: Joi.boolean().default(false),
  description: Joi.string().max(5000).allow(''),
  images: Joi.array().items(Joi.string()).default([]),

  mrp: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  discountPercent: Joi.number().min(0).max(100).default(0),

  lowStockThreshold: Joi.number().integer().min(0).default(10),

  tags: Joi.array().items(Joi.string()).default([]),
  isFeatured: Joi.boolean().default(false),
  isBestSeller: Joi.boolean().default(false),
  isPromoted: Joi.boolean().default(false),

  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DISCONTINUED').default('ACTIVE'),
});

const updateProduct = createProduct.fork(['name', 'slug', 'category', 'mrp', 'sellingPrice'], (schema) =>
  schema.optional()
).min(1);

const listProductsQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().allow(''),
  category: objectId.optional(),
  brand: objectId.optional(),
  generic: objectId.optional(),
  dosageForm: dosageForm.optional(),
  prescriptionRequired: Joi.boolean().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  isFeatured: Joi.boolean().optional(),
  isBestSeller: Joi.boolean().optional(),
  inStock: Joi.boolean().optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DISCONTINUED').optional(),
  sort: Joi.string()
    .valid('price_asc', 'price_desc', 'newest', 'best_selling', 'relevance')
    .default('relevance'),
});

module.exports = { createProduct, updateProduct, listProductsQuery };
