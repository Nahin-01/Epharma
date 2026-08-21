'use strict';

const Notification = require('./notification.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(Notification);

module.exports = {
  Model: Notification,
  ...base,

  async listForRecipient(recipientId, { unreadOnly, page, limit } = {}) {
    const filter = { recipient: recipientId };
    if (unreadOnly) filter.isRead = false;
    return base.list({ filter, page, limit });
  },

  async markAllRead(recipientId) {
    return Notification.updateMany({ recipient: recipientId, isRead: false }, { $set: { isRead: true } });
  },

  async countUnread(recipientId) {
    return Notification.countDocuments({ recipient: recipientId, isRead: false });
  },
};
