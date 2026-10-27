const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, registerValidators, loginValidators, loginLimiter } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/register', registerValidators, validate, register);
router.post('/login', loginLimiter, loginValidators, validate, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
