const express = require('express');
const router = express.Router();
const controller = require('../controllers/complaintsController');

// 8. Get all complaints
router.get('/all-complaints', controller.getAllComplaints);

module.exports = router;
