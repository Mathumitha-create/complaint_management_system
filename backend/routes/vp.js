const express = require('express');
const router = express.Router();
const controller = require('../controllers/complaintsController');

// 9. Get escalated complaints
router.get('/escalated', controller.getEscalatedComplaints);

module.exports = router;
