'use strict';

const appointmentRepository = require('./appointment.repository');
const doctorRepository = require('../doctors/doctor.repository');
const ApiError = require('../../utils/apiError');

async function book(customerId, { doctor: doctorId, chamberId, date, timeSlot, notes }) {
  const doctor = await doctorRepository.findById(doctorId);
  if (!doctor || !doctor.isActive) throw ApiError.notFound('Doctor not found');

  const chamber = doctor.chambers.id(chamberId);
  if (!chamber) throw ApiError.notFound('Chamber not found for this doctor');

  try {
    const appointment = await appointmentRepository.create({
      doctor: doctorId,
      chamberId,
      customer: customerId,
      date,
      timeSlot,
      consultationFee: chamber.consultationFee,
      notes,
      status: 'REQUESTED',
    });

    const notificationService = require('../notifications/notification.service');
    await notificationService.notifyCustomer(customerId, {
      title: 'Appointment requested',
      message: `Your appointment request with Dr. ${doctor.name} on ${new Date(date).toDateString()} at ${timeSlot} has been received.`,
      type: 'APPOINTMENT',
      referenceId: appointment._id,
    });

    return appointment;
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict('This time slot has already been booked. Please choose another.');
    }
    throw err;
  }
}

async function listMine(customerId, query) {
  return appointmentRepository.listForCustomer(customerId, query);
}

async function listForDoctor(doctorId, query) {
  return appointmentRepository.listForDoctor(doctorId, query);
}

async function updateStatus(id, requester, status) {
  const appointment = await appointmentRepository.findById(id);
  if (!appointment) throw ApiError.notFound('Appointment not found');

  const isOwner = String(appointment.customer) === String(requester?.id);
  let canManage = requester?.role && requester.role !== 'CUSTOMER' && requester.role !== 'DOCTOR';

  if (requester?.role === 'DOCTOR') {
    const doctor = await doctorRepository.findById(appointment.doctor);
    canManage = Boolean(doctor && doctor.user && String(doctor.user) === String(requester.id));
  }

  if (!isOwner && !canManage) throw ApiError.forbidden('You do not have access to this appointment');

  appointment.status = status;
  await appointment.save();
  return appointment;
}

module.exports = { book, listMine, listForDoctor, updateStatus };
