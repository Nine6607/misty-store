const mysql = require('mysql2/promise');

async function checkUsers() {
    // 🚩 เอา URL ของ Aiven มาแปะตรงนี้!
    const DB_URL = 'mysql://avnadmin:AVNS_WC46KOldp68L1GPXems@mysql-b5686ae-ninnin90635-be83.i.aivencloud.com:10154/defaultdb?ssl-mode=REQUIRED';

    try {
        console.log('🔄 กำลังแอบส่อง Database...');
        const db = await mysql.createConnection(DB_URL);
        
        // ดึงข้อมูลมาดูว่าใครยศอะไรบ้าง
        const [users] = await db.query('SELECT id, username, role FROM users');
        
        console.log('\n📊 รายชื่อประชากรในระบบตอนนี้:');
        // ใช้คำสั่งนี้ มันจะปริ้นออกมาเป็นตารางสวยๆ ใน Terminal เลย!
        console.table(users); 
        
        process.exit(0);
    } catch (err) {
        console.log('\n❌ สอดแนมล้มเหลว:', err.message);
        process.exit(1);
    }
}

checkUsers();