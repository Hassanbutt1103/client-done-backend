const express = require('express');
const {
  forgotPassword,
  showResetForm,
  resetPassword
} = require('../controllers/passwordResetController');

const router = express.Router();

// API endpoint for requesting password reset
router.post('/forgot-password', forgotPassword);

module.exports = router; 