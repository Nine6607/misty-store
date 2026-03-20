const pool = require('../config/db');

exports.buyProduct = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [products] = await connection.execute('SELECT * FROM products WHERE id = ? FOR UPDATE', [productId]);
        const product = products[0];

        if (!product) throw new Error('Product not found');
        if (product.stock <= 0) throw new Error('Out of stock');

        const [users] = await connection.execute('SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]);
        const user = users[0];

        if (user.balance < product.price) throw new Error('Insufficient balance');

        await connection.execute('UPDATE users SET balance = balance - ? WHERE id = ?', [product.price, userId]);
        await connection.execute('UPDATE products SET stock = stock - 1 WHERE id = ?', [productId]);
        await connection.execute('INSERT INTO orders (user_id, product_id, price_at_purchase) VALUES (?, ?, ?)', 
            [userId, productId, product.price]
        );

        await connection.commit();
        res.json({ message: 'Purchase successful!' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
};

exports.topup = async (req, res) => {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    try {
        await pool.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, req.user.id]);
        res.json({ message: `Topped up ${amount} successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const query = `
            SELECT o.id, p.name, o.price_at_purchase, o.created_at 
            FROM orders o 
            JOIN products p ON o.product_id = p.id 
            WHERE o.user_id = ? 
            ORDER BY o.created_at DESC
        `;
        const [orders] = await pool.execute(query, [req.user.id]);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};