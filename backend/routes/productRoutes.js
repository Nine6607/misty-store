const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
// เพิ่มบรรทัดนี้ลงไป (ในชีวิตจริงต้องใส่ Middleware เช็คว่าเป็น Admin ด้วยนะ)
router.post('/', productController.addProduct); 
// เพิ่มบรรทัดนี้ต่อจาก route อื่นๆ
router.delete('/:id', productController.deleteProduct);
module.exports = router;