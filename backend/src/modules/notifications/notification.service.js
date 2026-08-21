'use strict';

const notificationRepository = require('./notification.repository');
const ApiError = require('../../utils/apiError');
const logger = require('../../utils/logger');

async function notifyCustomer(userId, { title, message, type = 'SYSTEM', referenceId = null }) {
  const notification = await notificationRepository.create({
    recipient: userId,
    title,
    message,
    type,
    referenceId,
    channel: 'IN_APP',
  });

  const { enqueueNotification } = require('../../jobs/notification.job');
  await enqueueNotification({ notificationId: String(notification._id), channel: 'IN_APP' });

  try {
    const User = require('../users/user.model');
    const Customer = require('../customers/customer.model');
    const user = await User.findById(userId).select('phone');
    const customer = await Customer.findOne({ user: userId }).select('preferences');
    const smsAllowed = !customer || customer.preferences?.smsNotifications !== false;

    if (user?.phone && smsAllowed) {
      await enqueueNotification({ channel: 'SMS', to: user.phone, message: `${title}: ${message}` });
    }
  } catch (err) {
    logger.warn(`Failed to queue SMS notification for user ${userId}: ${err.message}`);
  }

  return notification;
}

async function notifyRole(role, payload) {
  const User = require('../users/user.model');
  const staff = await User.find({ role, isActive: true }).select('_id');
  const results = [];
  for (const user of staff) {
    results.push(await notifyCustomer(user._id, payload));
  }
  return results;
}

async function listMine(userId, query) {
  return notificationRepository.listForRecipient(userId, {
    unreadOnly: query.unreadOnly === 'true' || query.unreadOnly === true,
    page: query.page,
    limit: query.limit,
  });
}

async function markRead(id, userId) {
  const notification = await notificationRepository.findById(id);
  if (!notification) throw ApiError.notFound('Notification not found');
  if (String(notification.recipient) !== String(userId)) {
    throw ApiError.forbidden('You do not have access to this notification');
  }
  notification.isRead = true;
  await notification.save();
  return notification;
}

async function markAllRead(userId) {
  await notificationRepository.markAllRead(userId);
  return { success: true };
}

async function countUnread(userId) {
  const count = await notificationRepository.countUnread(userId);
  return { count };
}

module.exports = { notifyCustomer, notifyRole, listMine, markRead, markAllRead, countUnread };
