const pool = require('../config/db');
const axios = require('axios');
const FormData = require('form-data');

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

        const cleanBalance = parseFloat(user.balance.toString().replace(/,/g, ''));
        const cleanPrice = parseFloat(product.price.toString().replace(/,/g, ''));

        console.log(`เงินที่มี: ${cleanBalance} | ราคาสินค้า: ${cleanPrice}`);

        if (cleanBalance < cleanPrice) {
            throw new Error('Insufficient balance (เงินไม่พอจริงๆ หรือโดนระบบแกง!)');
        }

        await connection.execute('UPDATE users SET balance = balance - ? WHERE id = ?', [cleanPrice, userId]);
        await connection.execute('UPDATE products SET stock = stock - 1 WHERE id = ?', [productId]);
        await connection.execute('INSERT INTO orders (user_id, product_id, price_at_purchase) VALUES (?, ?, ?)', 
            [userId, productId, cleanPrice]
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
    const userId = req.user.id;
    const slipFile = req.file; // ไฟล์สลิปที่ multer รับมาให้

    if (!slipFile) {
        return res.status(400).json({ error: 'ไม่พบไฟล์สลิป! อัปโหลดรูปด้วยวัยรุ่น' });
    }

    try {
        // 🚩 เอาเครื่องหมาย # ออกแล้ว เหลือแค่ตัวเลขล้วนๆ
        const SLIPOK_BRANCH_ID = '63401';
        const SLIPOK_API_KEY = 'SLIPOKSZ607SF';

        // 1. แพ็คไฟล์รูปลงกล่อง เตรียมส่งให้ SlipOK
        const formData = new FormData();
        formData.append('files', slipFile.buffer, {
            filename: slipFile.originalname || 'slip.jpg',
            contentType: slipFile.mimetype || 'image/jpeg'
        });

        // 2. ยิงคำสั่งไปให้ AI ของ SlipOK ตรวจสอบ
        const slipOkResponse = await axios.post(
            `https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`,
            formData,
            {
                headers: {
                    'x-authorization': SLIPOK_API_KEY,
                    ...formData.getHeaders()
                }
            }
        );

        const slipData = slipOkResponse.data;

        // 3. ถ้า SlipOK บอกว่าปลอม, ซ้ำ หรืออ่านไม่ออก เตะก้านคอกลับไปเลย!
        if (slipData.success !== true) {
            return res.status(400).json({ error: 'สลิปปลอม, ใช้ซ้ำ หรือ AI อ่านไม่ออก!' });
        }

        // 4. สลิปของแท้! ดึงยอดเงินที่โอนจริงออกมา (AI อ่านให้แล้ว)
        const amount = parseFloat(slipData.data.amount);

        // 5. ดำเนินการอัปเดตยอดเงินเข้า Database
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [users] = await connection.execute('SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]);
            const user = users[0];
            const cleanBalance = parseFloat(user.balance.toString().replace(/,/g, ''));
            const newBalance = cleanBalance + amount;

            await connection.execute('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);

            await connection.commit();
            res.json({ message: 'Topup success', amount: amount });
        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        } finally {
            connection.release();
        }

    } catch (error) {
        // ดัก Error เผื่อระบบ SlipOK ล่มหรือยิง API ไม่ผ่าน
        console.error('SlipOK Error:', error.response?.data || error.message);
        const errorMsg = error.response?.data?.message || 'ระบบตรวจสลิปขัดข้อง โปรดลองใหม่';
        res.status(500).json({ error: errorMsg });
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