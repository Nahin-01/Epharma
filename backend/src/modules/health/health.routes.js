'use strict';

const router = require('express').Router();
const controller = require('./health.controller');

router.get('/', controller.check);

module.exports = router;
