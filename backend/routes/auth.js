const express = require('express');
const router = express.Router();
const { login, changePassword, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', login);
router.put('/change-password', authenticateToken, changePassword);
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
