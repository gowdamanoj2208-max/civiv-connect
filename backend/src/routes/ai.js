const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { classifyComplaint, checkDuplicate } = require('../controllers/aiController');

router.post('/classify', classifyComplaint);
router.post('/duplicate-check', checkDuplicate);

module.exports = router;
