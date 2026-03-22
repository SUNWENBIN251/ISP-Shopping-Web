// backend/database/seed.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'record_store.db'));

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function seedDatabase() {
    console.log('🌱 Starting database seeding...');
    
    try {
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        // Clear existing data
        await runQuery('PRAGMA foreign_keys = OFF');
        await runQuery('DELETE FROM Cart_Items');
        await runQuery('DELETE FROM Order_Items');
        await runQuery('DELETE FROM Orders');
        await runQuery('DELETE FROM Reviews');
        await runQuery('DELETE FROM Discussion_Bubbles');
        await runQuery('DELETE FROM Products');
        await runQuery('DELETE FROM Albums');
        await runQuery('DELETE FROM Shipping_Address');
        await runQuery('DELETE FROM Users');
        await runQuery('PRAGMA foreign_keys = ON');
        
        console.log('✅ Database cleared');
        
        // Insert Users only
        await runQuery(
            'INSERT INTO Users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            ['user1', 'user1@example.com', hashedPassword, 'customer']
        );
        await runQuery(
            'INSERT INTO Users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            ['user2', 'user2@example.com', hashedPassword, 'customer']
        );
        await runQuery(
            'INSERT INTO Users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            ['seller', 'seller@example.com', hashedPassword, 'admin']
        );
        
        console.log('✅ Users inserted');
        
        // Get user IDs
        const users = await allQuery('SELECT user_id, username FROM Users');
        const user1 = users.find(u => u.username === 'user1');
        const user2 = users.find(u => u.username === 'user2');
        const seller = users.find(u => u.username === 'seller');
        
        // Insert Shipping Addresses only
        await runQuery(
            `INSERT INTO Shipping_Address (user_id, recipient_name, phone, address_line1, city, state, postal_code, country, is_default, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [user1.user_id, '张三', '13800138001', '北京市朝阳区建国路88号', '北京', '北京市', '100022', '中国', 1]
        );
        await runQuery(
            `INSERT INTO Shipping_Address (user_id, recipient_name, phone, address_line1, city, state, postal_code, country, is_default, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [user1.user_id, '张三', '13800138001', '上海市浦东新区世纪大道100号', '上海', '上海市', '200120', '中国', 0]
        );
        await runQuery(
            `INSERT INTO Shipping_Address (user_id, recipient_name, phone, address_line1, city, state, postal_code, country, is_default, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [user2.user_id, '李四', '13800138002', '深圳市南山区科技园', '深圳', '广东省', '518057', '中国', 1]
        );
        await runQuery(
            `INSERT INTO Shipping_Address (user_id, recipient_name, phone, address_line1, city, state, postal_code, country, is_default, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [seller.user_id, '王老板', '13800138003', '香港中环皇后大道中99号', '香港', '香港', '999077', '中国', 1]
        );
        
        console.log('✅ Shipping addresses inserted');
        
        console.log('\n=====================================');
        console.log('✅✅✅ SEEDING COMPLETED SUCCESSFULLY ✅✅✅');
        console.log('=====================================');
        console.log('\n📋 TEST ACCOUNTS (password: 123456):');
        console.log('   • user1     - Regular customer');
        console.log('   • user2     - Regular customer');  
        console.log('   • seller    - Seller account');
        console.log('\n📦 NO ALBUMS, PRODUCTS, ORDERS OR REVIEWS:');
        console.log('   • Use the seller dashboard to add albums and products');
        console.log('   • Then place orders and leave reviews');
        console.log('=====================================');
        
        db.close();
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
        db.close();
    }
}

seedDatabase();