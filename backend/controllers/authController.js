const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
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

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, username: user.username, balance: user.balance } });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [users] = await pool.execute('SELECT id, username, balance FROM users WHERE id = ?', [req.user.id]);
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};