const mysql = require('mysql2/promise');

async function fixDatabase() {
    // 🚩 URL เดิมของพี่แหละ (แอบซ่อนรหัสไว้หน่อยละกัน 555)
    const DB_URL = 'mysql://avnadmin:AVNS_WC46KOldp68L1GPXems@mysql-b5686ae-ninnin90635-be83.i.aivencloud.com:10154/defaultdb?ssl-mode=REQUIRED';

    try {
        console.log('🔄 กำลังบุกเข้า Aiven แบบสายตรง...');
        const db = await mysql.createConnection(DB_URL);
        console.log('✅ เจาะระบบ Aiven สำเร็จ!');

        console.log('👉 กำลังสร้างสมุดหนังหมา (ตาราง used_slips)...');
        
        // 🚩 ลบทิ้งคำสั่งเก่าให้หมด แล้วใส่คำสั่งสร้างตารางนี้แทน!
        const sql = `
            CREATE TABLE IF NOT EXISTS used_slips (
                trans_ref VARCHAR(255) PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await db.query(sql);
        
        console.log('\n🎉 สร้างตาราง used_slips สำเร็จโว้ย! ปิดช่องโหว่เสี่ยปั๊มเงินเรียบร้อย!');
        process.exit(0);

    } catch (err) {
        console.log('\n❌ พังครับพี่ เช็คด่วน:');
        console.log(err.message);
        process.exit(1);
    }
}

fixDatabase();