const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const authMiddleware = require('../middleware/auth');
 
router.get('/', authMiddleware.protect, historyController.getHistory);
router.delete('/:id', authMiddleware.protect, historyController.deleteCheck);
 
module.exports = router;