const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // ไม่ต้องแก้ตรงนี้ เพราะใน Database เราตั้งค่า Default เป็น 'user' ให้อัตโนมัติแล้ว
        await pool.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        const user = users[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 🚩 1. ฝัง role ลงไปใน Token (บัตรผ่าน) เผื่อใช้ตั้งด่านตรวจที่ Backend
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        // 🚩 2. ส่ง role กลับไปให้ Vercel (หน้าเว็บ) รู้ด้วยว่ายศอะไร
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                balance: user.balance,
                role: user.role // เพิ่มตรงนี้!
            } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // 🚩 3. ตอนหน้าเว็บดึงข้อมูล Profile ก็ให้ดึง role ออกมาโชว์ด้วย
        const [users] = await pool.execute('SELECT id, username, balance, role FROM users WHERE id = ?', [req.user.id]);
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};