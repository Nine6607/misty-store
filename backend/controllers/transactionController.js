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
    const slipFile = req.file; 

    if (!slipFile) {
        return res.status(400).json({ error: 'ไม่พบไฟล์สลิป! อัปโหลดรูปด้วยวัยรุ่น' });
    }

    try {
        const SLIPOK_BRANCH_ID = '63401';
        const SLIPOK_API_KEY = 'SLIPOKSZ607SF';

        const formData = new FormData();
        formData.append('files', slipFile.buffer, {
            filename: slipFile.originalname || 'slip.jpg',
            contentType: slipFile.mimetype || 'image/jpeg'
        });

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

        if (slipData.success !== true) {
            return res.status(400).json({ error: 'สลิปปลอม หรือ AI อ่านไม่ออก!' });
        }

        // 🚩 ดึงยอดเงิน และ "เลขอ้างอิง (transRef)" จากสลิปมาเตรียมไว้
        const amount = parseFloat(slipData.data.amount);
        const transRef = slipData.data.transRef; 

        if (!transRef) {
             return res.status(400).json({ error: 'ไม่พบเลขอ้างอิงบนสลิป โปรดใช้สลิปธนาคารมาตรฐาน' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 🚩 [วิชาสกัดดาวรุ่ง] เช็คก่อนเลยว่าเลขอ้างอิงนี้ เคยจดลงสมุดหนังหมาไปรึยัง?!
            const [existingSlips] = await connection.execute('SELECT trans_ref FROM used_slips WHERE trans_ref = ?', [transRef]);
            
            if (existingSlips.length > 0) {
                // ถ้ามีข้อมูลแปลว่าเคยเติมไปแล้ว ดีดออกเลย!
                throw new Error('มุกนี้ไม่เนียน! สลิปนี้ถูกใช้เติมเงินไปแล้วครับเสี่ย!');
            }

            // ถ้าเป็นสลิปใหม่ซิงๆ ค่อยดึงเงินมาอัปเดต
            const [users] = await connection.execute('SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]);
            const user = users[0];
            const cleanBalance = parseFloat(user.balance.toString().replace(/,/g, ''));
            const newBalance = cleanBalance + amount;

            // 1. เติมเงินเข้ากระเป๋า
            await connection.execute('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);
            
            // 2. 🚩 จดเลขอ้างอิงนี้ลงสมุดหนังหมา (ป้องกันการใช้ซ้ำในอนาคต)
            await connection.execute('INSERT INTO used_slips (trans_ref, user_id, amount) VALUES (?, ?, ?)', [transRef, userId, amount]);

            await connection.commit();
            res.json({ message: 'Topup success', amount: amount });
        } catch (dbError) {
            await connection.rollback();
            throw dbError; // โยน Error ไปให้ catch ตัวล่างจัดการพ่นแจ้งเตือน
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Slip Error:', error.response?.data || error.message);
        // ถ้าระบบเจอ Error ที่เรา throw ไว้ (เช่น สลิปซ้ำ) ให้เอาคำพูดนั้นมาโชว์เลย
        const errorMsg = error.response?.data?.message || error.message || 'ระบบตรวจสลิปขัดข้อง โปรดลองใหม่';
        res.status(400).json({ error: errorMsg });
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