const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createWarden, createBlock } = require('../controllers/adminController');
const router = express.Router();

router.post('/warden', protect, createWarden); 
router.post('/block', protect, createBlock); 

module.exports = router;