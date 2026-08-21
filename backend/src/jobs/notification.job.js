'use strict';

const { getQueue, QUEUE_NAMES } = require('./queue');
const logger = require('../utils/logger');
const { sendSms } = require('../integrations/sms/sms.provider');

const queue = getQueue(QUEUE_NAMES.NOTIFICATION);

/**
 * Enqueues delivery of a notification that has already been persisted
 * in-app (Notification.create happens synchronously in the service layer so
 * the API response and "My Notifications" list are consistent immediately).
 * This job only handles the SMS side-channel + marking delivery status.
 */
async function enqueueNotification({ notificationId, channel = 'IN_APP', to, message }) {
  return queue.add('deliver-notification', { notificationId, channel, to, message });
}

async function processor(job) {
  const { notificationId, channel, to, message } = job.data;
  const notificationRepo = require('../modules/notifications/notification.repository');

  if (channel === 'SMS') {
    if (!to) {
      logger.warn(`[notification-job] SMS notification ${notificationId} missing recipient phone`);
      return { skipped: true };
    }
    const result = await sendSms(to, message);
    if (notificationId) {
      await notificationRepo.updateById(notificationId, {
        deliveryStatus: 'SENT',
        deliveryMeta: result,
      });
    }
    return result;
  }

  // IN_APP notifications are already stored; nothing else to deliver here
  // beyond marking them as delivered for audit purposes.
  if (notificationId) {
    await notificationRepo.updateById(notificationId, { deliveryStatus: 'DELIVERED' });
  }
  return { delivered: true };
}

module.exports = { queue, enqueueNotification, processor };
