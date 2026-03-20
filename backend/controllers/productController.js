const db = require('../config/db'); // เปลี่ยนชื่อให้เรียกง่ายๆ ว่า db

// 1. ดึงสินค้าทั้งหมด (เปลี่ยนชื่อเป็น getAllProducts ให้ตรงกับ Routes)
exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};

// 2. เพิ่มสินค้า (ใช้แบบที่มี productId จะได้เทพๆ)
exports.addProduct = async (req, res) => {
    const { name, description, price, image_url, stock } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, image_url, stock]
        );
        res.status(201).json({ 
            message: 'Product added!', 
            productId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};

// 3. ลบสินค้า (จุดที่พี่ลบไม่ได้ น่าจะติดที่ชื่อตัวแปร db นี่แหละ)
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params; // รับค่า ID จาก URL
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบสินค้าไอดีนี้' });
        }
        
        res.json({ message: 'ลบสินค้าเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
};