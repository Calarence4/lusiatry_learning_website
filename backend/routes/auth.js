const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// 公开路由
router.post('/login', authController.login);

// 需要认证的路由
router.get('/me', requireAuth, authController.me);

module.exports = router;