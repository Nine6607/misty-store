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