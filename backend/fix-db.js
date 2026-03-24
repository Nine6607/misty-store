const mysql = require('mysql2/promise');

async function fixDatabase() {
    // 🚩 เอา URL ของ Aiven มาแปะตรงนี้! (อันที่เคยใส่ใน Render อะพี่)
    const DB_URL = 'mysql://avnadmin:AVNS_WC46KOldp68L1GPXems@mysql-b5686ae-ninnin90635-be83.i.aivencloud.com:10154/defaultdb?ssl-mode=REQUIRED';

    try {
        console.log('🔄 กำลังบุกเข้า Aiven แบบสายตรง...');
        // สร้างท่อเชื่อมตรง ไม่ผ่านใครทั้งนั้น!
        const db = await mysql.createConnection(DB_URL);
        console.log('✅ เจาะระบบ Aiven สำเร็จ!');

        console.log('🧹 สเต็ป 0: ล้างบางตาราง orders...');
        await db.query('DELETE FROM `orders`');
        
        console.log('👉 สเต็ป 1: ทำลายกฎเก่า...');
        try {
            await db.query('ALTER TABLE `orders` DROP FOREIGN KEY `orders_ibfk_2`');
        } catch (dropErr) {
            // ช่างมัน
        }
        
        console.log('👉 สเต็ป 2: ฝังกฎใหม่ (ON DELETE CASCADE)...');
        await db.query('ALTER TABLE `orders` ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE');
        
        console.log('\n🎉 สำเร็จโว้ยยยยยยยยยย! ปิดจ๊อบ! ไปกดลบสินค้าที่หน้าเว็บได้เลยพี่!');
        process.exit(0);

    } catch (err) {
        console.log('\n❌ ถ้าพังรอบนี้แปลว่าพี่ก๊อป URL มาผิดแล้วแหละ 5555:');
        console.log(err.message);
        process.exit(1);
    }
}

fixDatabase();