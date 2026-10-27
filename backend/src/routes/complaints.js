const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createComplaint, getComplaints, trackComplaint, getComplaintById, getMyComplaints, supportComplaint
} = require('../controllers/complaintController');

// Public
router.get('/', optionalAuth, getComplaints);
router.get('/track/:complaintId', trackComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/:id', optionalAuth, getComplaintById);

// Protected
router.post('/', protect, upload.array('images', 5), createComplaint);
router.post('/:id/support', protect, supportComplaint);

module.exports = router;
