const mysql = require('mysql2/promise');

async function upgradeAdmin() {
    // 🚩 เอา URL ของ Aiven มาแปะตรงนี้เหมือนเดิมเลยพี่!
    const DB_URL = 'mysql://avnadmin:AVNS_WC46KOldp68L1GPXems@mysql-b5686ae-ninnin90635-be83.i.aivencloud.com:10154/defaultdb?ssl-mode=REQUIRED';

    try {
        console.log('🔄 กำลังแฮ็กเข้าตาราง users...');
        const db = await mysql.createConnection(DB_URL);
        
        console.log('👉 สเต็ป 1: สร้างระบบชนชั้น (เพิ่มคอลัมน์ role)...');
        try {
            // ตั้งค่าเริ่มต้นให้ทุกคนที่สมัครใหม่เป็นแค่ 'user'
            await db.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'");
            console.log('   ✅ สร้างยศสำเร็จ! (ทุกคนเริ่มมาจะเป็นไพร่... เอ้ย! user ธรรมดา)');
        } catch (err) {
            console.log('   ⚠️ ข้าม... (ระบบชนชั้นถูกสร้างไว้แล้ว)');
        }

        console.log('👉 สเต็ป 2: มอบมงกุฎประธานบริษัทให้ไอดีพี่...');
        // ตั้งให้ User คนแรกสุด (id=1 ซึ่งคือพี่แน่ๆ) กลายเป็น admin
        const [result] = await db.query("UPDATE users SET role = 'admin' WHERE id = 1");
        
        if (result.affectedRows > 0) {
            console.log('   👑 ยินดีด้วยท่านผู้นำ! ไอดีพี่กลายเป็น Admin แล้ว!');
        } else {
            console.log('   🤔 เอ๊ะ... หาไอดี id=1 ไม่เจอ ลองไปเช็คดูนะว่าไอดีพี่ id อะไร');
        }
        
        console.log('\n🎉 สเต็ป 1 เสร็จสมบูรณ์! ปิดจ๊อบ Database!');
        process.exit(0);

    } catch (err) {
        console.log('\n❌ พัง:', err.message);
        process.exit(1);
    }
}

upgradeAdmin();