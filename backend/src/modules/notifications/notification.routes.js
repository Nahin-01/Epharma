'use strict';

const router = require('express').Router();
const controller = require('./notification.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', controller.listMine);
router.get('/unread-count', controller.unreadCount);
router.patch('/:id/read', controller.markRead);
router.patch('/read-all', controller.markAllRead);

module.exports = router;
