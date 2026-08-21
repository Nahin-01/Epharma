'use strict';

const productRequestRepository = require('./productRequest.repository');
const ApiError = require('../../utils/apiError');
const { recordAudit } = require('../../utils/audit');

async function create(customerId, data) {
  const request = await productRequestRepository.create({ customer: customerId, ...data });
  return request;
}

async function listMine(customerId, query) {
  return productRequestRepository.listForCustomer(customerId, query);
}

async function listAll(query) {
  return productRequestRepository.listAll(query);
}

async function getById(id, requester) {
  const request = await productRequestRepository.findById(id);
  if (!request) throw ApiError.notFound('Product request not found');
  if (requester.role === 'CUSTOMER' && String(request.customer) !== String(requester.id)) {
    throw ApiError.forbidden('You do not have access to this product request');
  }
  return request;
}

async function updateStatus(id, actor, { status, adminNotes }) {
  const request = await productRequestRepository.updateById(id, { status, adminNotes });
  if (!request) throw ApiError.notFound('Product request not found');

  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'PRODUCT_REQUEST_STATUS_CHANGED',
    entityType: 'ProductRequest',
    entityId: request._id,
    changes: { status },
  });

  const notificationService = require('../notifications/notification.service');
  await notificationService.notifyCustomer(request.customer, {
    title: 'Product request update',
    message: `Your request for "${request.productName}" is now ${status}.`,
    type: 'PRODUCT_REQUEST',
    referenceId: request._id,
  });

  return request;
}

module.exports = { create, listMine, listAll, getById, updateStatus };
