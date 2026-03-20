const pool = require('../config/db');

exports.getProducts = async (req, res) => {
    try {
        const [products] = await pool.execute('SELECT * FROM products ORDER BY created_at DESC');
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addProduct = async (req, res) => {
    const { name, description, price, image_url, stock } = req.body;
    try {
        await pool.execute(
            'INSERT INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, image_url, stock]
        );
        res.status(201).json({ message: 'Product added' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ฟังก์ชันสำหรับแอดมินเพิ่มสินค้า
exports.addProduct = async (req, res) => {
    try {
        const { name, description, price, image_url, stock } = req.body;
        const [result] = await db.query(
            'INSERT INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, image_url, stock]
        );
        res.status(201).json({ message: 'Product added!', productId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ฟังก์ชันสำหรับลบสินค้า
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'ลบสินค้าเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};