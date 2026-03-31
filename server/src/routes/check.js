const express = require('express');
const router = express.Router();
const checkController = require('../controllers/checkController');
const authMiddleware = require('../middleware/auth');
 
router.post('/text', authMiddleware.optionalAuth, checkController.checkText);
router.post('/url', authMiddleware.optionalAuth, checkController.checkUrl);
router.get('/share/:shareId', checkController.getByShareId);
 
module.exports = router;