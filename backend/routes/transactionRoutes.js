const express = require('express');
const router = express.Router();
const txController = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/buy', authMiddleware, txController.buyProduct);
router.post('/topup', authMiddleware, txController.topup);
router.get('/history', authMiddleware, txController.getHistory);

module.exports = router;