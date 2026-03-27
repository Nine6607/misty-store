const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

// 🚩 1. เรียกใช้ multer ด่านตรวจรับไฟล์
const multer = require('multer');
// ให้ multer เก็บไฟล์ไว้ใน Memory ชั่วคราวก่อนส่งให้ SlipOK
const upload = multer({ storage: multer.memoryStorage() });

router.post('/buy', authMiddleware, transactionController.buyProduct);

// 🚩 2. แก้ route topup ให้รับไฟล์รูปที่ส่งมาในชื่อตัวแปร 'slip'
router.post('/topup', authMiddleware, upload.single('slip'), transactionController.topup);

// ... (route อื่นๆ ของพี่ปล่อยไว้เหมือนเดิม) ...

module.exports = router;