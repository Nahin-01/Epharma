'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const notificationService = require('./notification.service');

const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await notificationService.listMine(req.user.id, req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const unreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.countUnread(req.user.id);
  return ApiResponse.ok(res, result);
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user.id);
  return ApiResponse.ok(res, notification, 'Notification marked as read');
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  return ApiResponse.ok(res, null, 'All notifications marked as read');
});

module.exports = { listMine, unreadCount, markRead, markAllRead };
