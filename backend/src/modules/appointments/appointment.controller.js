'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const appointmentService = require('./appointment.service');

const book = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.book(req.user.id, req.body);
  return ApiResponse.created(res, appointment, 'Appointment requested successfully');
});

const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await appointmentService.listMine(req.user.id, req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const listForDoctor = asyncHandler(async (req, res) => {
  const { items, meta } = await appointmentService.listForDoctor(req.params.doctorId, req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const updateStatus = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.updateStatus(req.params.id, req.user, req.body.status);
  return ApiResponse.ok(res, appointment, 'Appointment status updated');
});

module.exports = { book, listMine, listForDoctor, updateStatus };
