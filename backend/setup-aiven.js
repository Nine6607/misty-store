const mysql = require('mysql2/promise');

async function setupDatabase() {
    console.log("🚀 กำลังเชื่อมต่อ Aiven Database...");
    
    // ใส่ข้อมูลของพี่ตรงนี้!!!
    const db = await mysql.createConnection({
        host: 'mysql-b5686ae-ninnin90635-be83.i.aivencloud.com', // ก๊อปมาใส่
        port: 10154,
        user: 'avnadmin', // เช็ค User ตัวเองในหน้า Aiven
        password: 'AVNS_WC46KOldp68L1GPXems', // ก๊อป Password มาใส่
        database: 'defaultdb',
        ssl: { rejectUnauthorized: false }
    });

    console.log("✅ เชื่อมต่อสำเร็จ! กำลังร่ายเวทมนตร์สร้างตาราง...");

    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            balance DECIMAL(10, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            image_url VARCHAR(255),
            stock INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            price_at_purchase DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    console.log("📦 กำลังเติมสินค้าเข้าสต็อก...");
    await db.query(`
        INSERT INTO products (name, description, price, image_url, stock) VALUES 
        ('Misty Pro License', 'Lifetime access to all pro features', 1990.00, 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=500&q=80', 50),
        ('Cyber UI Kit', 'Premium TailwindCSS components', 590.00, 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=500&q=80', 100)
    `);

    console.log("✨ เสร็จสมบูรณ์! Aiven พร้อมรบแล้ว!");
    process.exit();
}

setupDatabase().catch(err => console.error("❌ บั๊กกิน:", err));