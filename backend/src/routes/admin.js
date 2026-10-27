const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getDashboard, getAllComplaints, updateStatus, assignComplaint, getAnalytics, exportComplaints, getDepartments } = require('../controllers/adminController');

// All admin routes require authentication AND admin role
router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/complaints', getAllComplaints);
router.patch('/complaints/:id/status', updateStatus);
router.patch('/complaints/:id/assign', assignComplaint);
router.get('/analytics', getAnalytics);
router.get('/export', exportComplaints);
router.get('/departments', getDepartments);

module.exports = router;
