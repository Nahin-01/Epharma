'use strict';

const supportRepository = require('./support.repository');
const ApiError = require('../../utils/apiError');

async function createTicket(customerId, { subject, message, channel, relatedOrder, relatedPrescription }) {
  return supportRepository.create({
    customer: customerId,
    subject,
    channel,
    relatedOrder,
    relatedPrescription,
    messages: [{ sender: customerId, senderRole: 'CUSTOMER', message }],
    status: 'OPEN',
  });
}

async function getTicket(id, requester) {
  const ticket = await supportRepository.findById(id, {
    populate: { path: 'customer', select: 'name email phone' },
  });
  if (!ticket) throw ApiError.notFound('Support ticket not found');
  if (requester.role === 'CUSTOMER' && String(ticket.customer._id || ticket.customer) !== String(requester.id)) {
    throw ApiError.forbidden('You do not have access to this ticket');
  }
  return ticket;
}

async function addMessage(id, requester, message) {
  const ticket = await supportRepository.findById(id);
  if (!ticket) throw ApiError.notFound('Support ticket not found');
  if (requester.role === 'CUSTOMER' && String(ticket.customer) !== String(requester.id)) {
    throw ApiError.forbidden('You do not have access to this ticket');
  }

  ticket.messages.push({ sender: requester.id, senderRole: requester.role, message });
  if (requester.role === 'CUSTOMER' && ticket.status === 'RESOLVED') {
    ticket.status = 'OPEN';
  } else if (requester.role !== 'CUSTOMER' && ticket.status === 'OPEN') {
    ticket.status = 'IN_PROGRESS';
  }
  await ticket.save();
  return ticket;
}

async function listMine(customerId, query) {
  return supportRepository.listForCustomer(customerId, query);
}

async function listAll(query) {
  return supportRepository.listAll(query);
}

async function updateStatus(id, status) {
  const ticket = await supportRepository.updateById(id, { status });
  if (!ticket) throw ApiError.notFound('Support ticket not found');
  return ticket;
}

async function assign(id, assignedTo) {
  const ticket = await supportRepository.updateById(id, { assignedTo });
  if (!ticket) throw ApiError.notFound('Support ticket not found');
  return ticket;
}

module.exports = { createTicket, getTicket, addMessage, listMine, listAll, updateStatus, assign };
