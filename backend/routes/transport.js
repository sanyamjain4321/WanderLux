const express = require('express');
const router = express.Router();
const { getTransportOptions } = require('../controllers/transportController');

// GET /api/transport?type=domestic|international
router.get('/', getTransportOptions);

module.exports = router;
