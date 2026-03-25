const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite Database
const db = new Database(path.join(__dirname, 'webshop.db'));
db.pragma('journal_mode = WAL');

// Create tables
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT DEFAULT 'normal',
      u_name TEXT UNIQUE NOT NULL,
      p_word TEXT NOT NULL,
      SID TEXT NOT NULL,
      e_mail TEXT UNIQUE NOT NULL,
      pay_point INTEGER DEFAULT 0,
      reward_point INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      user_exp INTEGER DEFAULT 0,
      max_exp INTEGER DEFAULT 1000,
      user_level TEXT DEFAULT 'guest',
      user_img TEXT DEFAULT 'unprofile',
      vip_status TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_data (
      product_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      product_type TEXT NOT NULL,
      product_class TEXT NOT NULL,
      product_detail TEXT NOT NULL,
      product_price INTEGER NOT NULL,
      product_img TEXT DEFAULT 'unproduct',
      category TEXT DEFAULT 'general',
      stock INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reward_data (
      reward_id INTEGER PRIMARY KEY AUTOINCREMENT,
      reward_name TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      reward_detail TEXT NOT NULL,
      reward_price INTEGER NOT NULL,
      reward_img TEXT DEFAULT 'unproduct.jpg',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_post (
      post_id1 INTEGER PRIMARY KEY AUTOINCREMENT,
      post_head1 TEXT NOT NULL,
      post_detail1 TEXT NOT NULL,
      post_img1 TEXT DEFAULT 'unimg.jpg',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS update_post (
      post_id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_head TEXT NOT NULL,
      post_detail TEXT NOT NULL,
      post_img TEXT DEFAULT 'unimg.jpg',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rewardcode_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      reward INTEGER NOT NULL,
      used_by INTEGER,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS log_productbuy (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_productname TEXT NOT NULL,
      log_price INTEGER NOT NULL,
      log_name TEXT NOT NULL,
      log_date TEXT NOT NULL,
      buy_number TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS log_raward (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_productname TEXT NOT NULL,
      log_price INTEGER NOT NULL,
      log_name TEXT NOT NULL,
      log_date TEXT NOT NULL,
      buy_number TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gacha_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      netflix TEXT,
      rov TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_user INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS web_setting (
      config_id INTEGER PRIMARY KEY AUTOINCREMENT,
      webname TEXT NOT NULL,
      webstatus TEXT NOT NULL,
      version TEXT NOT NULL,
      ip TEXT NOT NULL,
      fbpage TEXT NOT NULL,
      slide1_img TEXT NOT NULL,
      slide2_img TEXT NOT NULL,
      slide3_img TEXT NOT NULL,
      background_img TEXT NOT NULL,
      video_link TEXT NOT NULL,
      text_run TEXT NOT NULL,
      web_logo TEXT NOT NULL,
      install_gamelink TEXT NOT NULL
    );
  `);

  // Insert default data
  try {
    db.prepare('INSERT INTO user_profile (u_name, p_word, e_mail, SID, status, user_level, pay_point, reward_point) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run('navydesign', '$2a$10$YourHashedPasswordHere', 'navydesign@navydesign.com', 'YzJlMzUzNDllOTg5NDE4MDFkMTQ4NDQyNGUzNDliZTE=', 'normal', 'actor', 6000, 6000);
  } catch (e) {
    // User already exists
  }

  try {
    db.prepare('INSERT INTO web_setting (webname, webstatus, version, ip, fbpage, slide1_img, slide2_img, slide3_img, background_img, video_link, text_run, web_logo, install_gamelink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run('WebShop Modern', 'เปิดให้บริการ', '1.0.0', '127.0.0.1', 'webshopmodern', 'slide1.jpg', 'slide2.jpg', 'slide3.jpg', 'background.jpg', 'sbrAduXXiBE', 'ยินดีต้อนรับสู่ WebShop Modern', 'logo.png', 'https://example.com/download');
  } catch (e) {
    // Settings already exist
  }

  try {
    db.prepare('INSERT INTO gacha_rates (netflix, rov) VALUES (?, ?)')
      .run(
        JSON.stringify({day1: 1, day14: 0.3, day30: 0.9, noPrize: 97.8}),
        JSON.stringify({warrior: 20, challenger: 8, master: 5, elite: 0.95, epic: 0.9, legend: 0.3, mythic: 0.001, god: 0.001})
      );
  } catch (e) {
    // Rates already exist
  }

  // Insert sample products
  const products = [
    ['ROV Mythic ID', 'Game ID', 'Rare', 'ไอดี ROV ระดับ Mythic', 99, 'rov', 10],
    ['ROV Legend ID', 'Game ID', 'Rare', 'ไอดี ROV ระดับ Legend', 49, 'rov', 20],
    ['Netflix 1 Month', 'Subscription', 'Premium', 'Netflix 1 เดือน', 9, 'netflix', 100],
    ['Netflix 3 Months', 'Subscription', 'Premium', 'Netflix 3 เดือน', 24, 'netflix', 100],
    ['Garena 50 Baht', 'Card', 'Standard', 'บัตร Garena 50 บาท', 50, 'garena', 50],
    ['Garena 100 Baht', 'Card', 'Standard', 'บัตร Garena 100 บาท', 100, 'garena', 50]
  ];

  try {
    const stmt = db.prepare('INSERT INTO product_data (product_name, product_type, product_class, product_detail, product_price, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?)');
    products.forEach(p => stmt.run(...p));
  } catch (e) {
    // Products already exist
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Initialize database
initializeDatabase();

// ============ AUTHENTICATION ROUTES ============

app.post('/api/auth/login', async (req, res) => {
  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const userRecord = db.prepare('SELECT * FROM user_profile WHERE u_name = ?').get(user);

    if (!userRecord) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    if (userRecord.status === 'blocker' || userRecord.status === 'banner') {
      return res.status(403).json({ success: false, message: 'บัญชีคุณถูกบล็อคหรือแบนการใช้งาน' });
    }

    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(pass, userRecord.p_word);
    } catch (e) {
      const encodedPass = Buffer.from(pass).toString('base64');
      passwordMatch = encodedPass === userRecord.p_word;
    }

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    req.session.MM_Username = user;
    req.session.userId = userRecord.id;
    req.session.userLevel = userRecord.user_level;

    const token = jwt.sign(
      { id: userRecord.id, username: user, level: userRecord.user_level },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: userRecord.id,
        username: user,
        email: userRecord.e_mail,
        level: userRecord.user_level,
        payPoint: userRecord.pay_point,
        rewardPoint: userRecord.reward_point,
        vipStatus: userRecord.vip_status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { user, mail, pass, conpass } = req.body;

    if (!user || !mail || !pass || !conpass) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (pass !== conpass) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านไม่ตรงกัน' });
    }

    const existingUser = db.prepare('SELECT id FROM user_profile WHERE u_name = ?').get(user);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้มีในระบบแล้ว' });
    }

    const existingEmail = db.prepare('SELECT id FROM user_profile WHERE e_mail = ?').get(mail);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'อีเมลนี้มีในระบบแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const sid = Buffer.from(user + mail + Date.now()).toString('base64');

    db.prepare('INSERT INTO user_profile (u_name, p_word, e_mail, SID, status, user_level, vip_status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(user, hashedPassword, mail, sid, 'normal', 'guest', 'normal');

    res.json({ success: true, message: 'ลงทะเบียนใช้งานสำเร็จ' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
    res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  });
});

// ============ USER ROUTES ============

app.get('/api/user/profile', (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }

    const user = db.prepare('SELECT id, u_name, e_mail, pay_point, reward_point, level, user_level, user_img, vip_status FROM user_profile WHERE id = ?').get(req.session.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ PRODUCT ROUTES ============

app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM product_data').all();
    res.json({ success: true, products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM product_data WHERE product_id = ?').get(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ GACHA ROUTES ============

app.get('/api/gacha/rates', (req, res) => {
  try {
    const rates = db.prepare('SELECT * FROM gacha_rates LIMIT 1').get();

    if (!rates) {
      return res.json({ success: true, rates: {
        netflix: { day1: 1, day14: 0.3, day30: 0.9, noPrize: 97.8 },
        rov: { warrior: 20, challenger: 8, master: 5, elite: 0.95, epic: 0.9, legend: 0.3, mythic: 0.001, god: 0.001 }
      }});
    }

    res.json({ success: true, rates: {
      netflix: JSON.parse(rates.netflix),
      rov: JSON.parse(rates.rov)
    }});
  } catch (error) {
    console.error('Get gacha rates error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.post('/api/gacha/netflix', (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }

    const user = db.prepare('SELECT reward_point FROM user_profile WHERE id = ?').get(req.session.userId);

    if (user.reward_point < 100) {
      return res.status(400).json({ success: false, message: 'แต้มไม่พอ' });
    }

    const rand = Math.random() * 100;
    let reward = 'noPrize', rewardName = 'ไม่ได้รางวัล', rewardValue = 0;

    if (rand < 1) { reward = 'day1'; rewardName = '1 วัน'; rewardValue = 1; }
    else if (rand < 1.3) { reward = 'day14'; rewardName = '14 วัน'; rewardValue = 14; }
    else if (rand < 2.2) { reward = 'day30'; rewardName = '30 วัน'; rewardValue = 30; }

    db.prepare('UPDATE user_profile SET reward_point = reward_point - 100 WHERE id = ?').run(req.session.userId);
    db.prepare('INSERT INTO log_raward (log_productname, log_price, log_name, log_date, buy_number, user_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run('Netflix ' + rewardName, rewardValue, req.session.MM_Username, new Date().toISOString(), 1, req.session.userId);

    res.json({ success: true, reward, rewardName, rewardValue });
  } catch (error) {
    console.error('Gacha error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.post('/api/gacha/rov', (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }

    const user = db.prepare('SELECT reward_point FROM user_profile WHERE id = ?').get(req.session.userId);

    if (user.reward_point < 100) {
      return res.status(400).json({ success: false, message: 'แต้มไม่พอ' });
    }

    const rand = Math.random() * 100;
    let reward = 'challenger', rewardName = 'Challenger';

    if (rand < 0.001) { reward = 'god'; rewardName = 'God ID'; }
    else if (rand < 0.002) { reward = 'mythic'; rewardName = 'Mythic'; }
    else if (rand < 0.302) { reward = 'legend'; rewardName = 'Legend'; }
    else if (rand < 1.202) { reward = 'epic'; rewardName = 'Epic'; }
    else if (rand < 2.152) { reward = 'elite'; rewardName = 'Elite'; }
    else if (rand < 7.152) { reward = 'master'; rewardName = 'Master'; }
    else if (rand < 27.152) { reward = 'warrior'; rewardName = 'Warrior'; }

    db.prepare('UPDATE user_profile SET reward_point = reward_point - 100 WHERE id = ?').run(req.session.userId);
    db.prepare('INSERT INTO log_raward (log_productname, log_price, log_name, log_date, buy_number, user_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run('ROV ' + rewardName, 1, req.session.MM_Username, new Date().toISOString(), 1, req.session.userId);

    res.json({ success: true, reward, rewardName });
  } catch (error) {
    console.error('Gacha error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ REWARD CODE ROUTES ============

app.post('/api/rewardcode/use', (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'กรุณาใส่โค้ด' });
    }

    const rewardCode = db.prepare('SELECT * FROM rewardcode_data WHERE code = ?').get(code);

    if (!rewardCode) {
      return res.status(400).json({ success: false, message: 'โค้ดไม่ถูกต้อง' });
    }

    db.prepare('UPDATE user_profile SET reward_point = reward_point + ? WHERE id = ?').run(rewardCode.reward, req.session.userId);
    db.prepare('DELETE FROM rewardcode_data WHERE id = ?').run(rewardCode.id);

    res.json({ success: true, message: 'ใช้โค้ดสำเร็จ', reward: rewardCode.reward });
  } catch (error) {
    console.error('Use reward code error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ ADMIN ROUTES ============

app.get('/api/admin/users', (req, res) => {
  try {
    if (!req.session.userId || req.session.userLevel !== 'actor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const users = db.prepare('SELECT id, u_name, e_mail, status, user_level, vip_status FROM user_profile').all();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.post('/api/admin/user/ban', (req, res) => {
  try {
    if (!req.session.userId || req.session.userLevel !== 'actor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const { userId, status } = req.body;

    db.prepare('UPDATE user_profile SET status = ? WHERE id = ?').run(status, userId);
    db.prepare('INSERT INTO audit_log (admin_id, action, target_user, timestamp) VALUES (?, ?, ?, ?)')
      .run(req.session.userId, `Ban user: ${status}`, userId, new Date().toISOString());

    res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.post('/api/admin/user/vip', (req, res) => {
  try {
    if (!req.session.userId || req.session.userLevel !== 'actor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const { userId, vipStatus } = req.body;

    db.prepare('UPDATE user_profile SET vip_status = ? WHERE id = ?').run(vipStatus, userId);
    db.prepare('INSERT INTO audit_log (admin_id, action, target_user, timestamp) VALUES (?, ?, ?, ?)')
      .run(req.session.userId, `VIP status: ${vipStatus}`, userId, new Date().toISOString());

    res.json({ success: true, message: 'อัปเดต VIP สำเร็จ' });
  } catch (error) {
    console.error('VIP error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.post('/api/admin/gacha/rates', (req, res) => {
  try {
    if (!req.session.userId || req.session.userLevel !== 'actor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const { rates } = req.body;

    db.prepare('UPDATE gacha_rates SET netflix = ?, rov = ? WHERE id = 1')
      .run(JSON.stringify(rates.netflix), JSON.stringify(rates.rov));

    db.prepare('INSERT INTO audit_log (admin_id, action, target_user, timestamp) VALUES (?, ?, ?, ?)')
      .run(req.session.userId, 'Update gacha rates', null, new Date().toISOString());

    res.json({ success: true, message: 'อัปเดตอัตราสำเร็จ' });
  } catch (error) {
    console.error('Update rates error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ EVENT ROUTES ============

app.get('/api/events', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM event_post').all();
    res.json({ success: true, events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.get('/api/updates', (req, res) => {
  try {
    const updates = db.prepare('SELECT * FROM update_post').all();
    res.json({ success: true, updates });
  } catch (error) {
    console.error('Get updates error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ CONFIG ROUTES ============

app.get('/api/config', (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM web_setting WHERE config_id = 1').get();

    if (!config) {
      return res.status(404).json({ success: false, message: 'ไม่พบการตั้งค่า' });
    }

    res.json({ success: true, config });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ ERROR HANDLING ============

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ WebShop Modern running on http://localhost:${PORT}`);
  console.log(`📊 Database: webshop.db`);
  console.log(`👤 Admin: navydesign / navydesignpage`);
});
