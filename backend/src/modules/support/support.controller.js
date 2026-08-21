'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const service = require('./support.service');

const createTicket = asyncHandler(async (req, res) => {
  const ticket = await service.createTicket(req.user.id, req.body);
  return ApiResponse.created(res, ticket, 'Support ticket created successfully');
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await service.getTicket(req.params.id, req.user);
  return ApiResponse.ok(res, ticket);
});

const addMessage = asyncHandler(async (req, res) => {
  const ticket = await service.addMessage(req.params.id, req.user, req.body.message);
  return ApiResponse.ok(res, ticket, 'Message added');
});

const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listMine(req.user.id, req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const listAll = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listAll(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const updateStatus = asyncHandler(async (req, res) => {
  const ticket = await service.updateStatus(req.params.id, req.body.status);
  return ApiResponse.ok(res, ticket, 'Ticket status updated');
});

const assign = asyncHandler(async (req, res) => {
  const ticket = await service.assign(req.params.id, req.body.assignedTo);
  return ApiResponse.ok(res, ticket, 'Ticket assigned');
});

module.exports = { createTicket, getTicket, addMessage, listMine, listAll, updateStatus, assign };
