const express = require('express');
const router = express.Router();
const controller = require('../controllers/complaintsController');

// 1. Create a new complaint
router.post('/create', controller.createComplaint);

// 2. Auto-resolve via Email Button
router.get('/auto-resolve/:complaintId', controller.autoResolveComplaint);

// 4. Get specific complaint
router.get('/:id', controller.getComplaint);

// 5. Get complaints for specific warden (boys/girls)
router.get('/warden/:hostelType', controller.getWardenComplaints);

// 6. Get complaints for specific student
router.get('/student/:studentId', controller.getStudentComplaints);

// 7. Resolve a complaint (Manual)
router.post('/resolve/:id', controller.resolveComplaint);

module.exports = router;
