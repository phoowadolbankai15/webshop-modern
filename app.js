const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite Database
const db = new sqlite3.Database(path.join(__dirname, 'webshop.db'), (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Helper function to run queries
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Create tables
async function initializeDatabase() {
  try {
    await dbRun(`
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
    )
    `);

    await dbRun(`
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
    )
    `);

    await dbRun(`
    CREATE TABLE IF NOT EXISTS reward_data (
      reward_id INTEGER PRIMARY KEY AUTOINCREMENT,
      reward_name TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      reward_detail TEXT NOT NULL,
      reward_price INTEGER NOT NULL,
      reward_img TEXT DEFAULT 'unproduct.jpg',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    await dbRun(`
    CREATE TABLE IF NOT EXISTS event_post (
      post_id1 INTEGER PRIMARY KEY AUTOINCREMENT,
      post_head1 TEXT NOT NULL,
      post_detail1 TEXT NOT NULL,
      post_img1 TEXT DEFAULT 'unimg.jpg',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    await dbRun(`
    CREATE TABLE IF NOT EXISTS update_post (
      post_id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_head TEXT NOT NULL,
      post_detail TEXT NOT NULL,
      post_img TEXT DEFAULT 'unimg.jpg',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    await dbRun(`
    CREATE TABLE IF NOT EXISTS rewardcode_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      reward INTEGER NOT NULL,
      used_by INTEGER,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    await dbRun(`
    CREATE TABLE IF NOT EXISTS log_productbuy (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_productname TEXT NOT NULL,
      log_price INTEGER NOT NULL,
      log_name TEXT NOT NULL,
      log_date TEXT NOT NULL,
      buy_number TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    await dbRun(`
    CREATE TABLE IF NOT EXISTS log_raward (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_productname TEXT NOT NULL,
      log_price INTEGER NOT NULL,
      log_name TEXT NOT NULL,
      log_date TEXT NOT NULL,
      buy_number TEXT NOT NULL,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    await dbRun(`
    CREATE TABLE IF NOT EXISTS gacha_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      netflix TEXT,
      rov TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    await dbRun(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_user INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      details TEXT
    )
    `);

    await dbRun(`
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
    )
    `);

    // Insert default data
    try {
      await dbRun(
        'INSERT INTO user_profile (u_name, p_word, e_mail, SID, status, user_level, pay_point, reward_point) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['navydesign', '$2a$10$YourHashedPasswordHere', 'navydesign@navydesign.com', 'YzJlMzUzNDllOTg5NDE4MDFkMTQ4NDQyNGUzNDliZTE=', 'normal', 'actor', 6000, 6000]
      );
    } catch (e) {
      // User already exists
    }

    try {
      await dbRun(
        'INSERT INTO web_setting (webname, webstatus, version, ip, fbpage, slide1_img, slide2_img, slide3_img, background_img, video_link, text_run, web_logo, install_gamelink) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['WebShop Modern', 'เปิดให้บริการ', '1.0.0', '127.0.0.1', 'webshopmodern', 'slide1.jpg', 'slide2.jpg', 'slide3.jpg', 'background.jpg', 'sbrAduXXiBE', 'ยินดีต้อนรับสู่ WebShop Modern', 'logo.png', 'https://example.com/download']
      );
    } catch (e) {
      // Settings already exist
    }

    try {
      await dbRun(
        'INSERT INTO gacha_rates (netflix, rov) VALUES (?, ?)',
        [
          JSON.stringify({day1: 1, day14: 0.3, day30: 0.9, noPrize: 97.8}),
          JSON.stringify({warrior: 20, challenger: 8, master: 5, elite: 0.95, epic: 0.9, legend: 0.3, mythic: 0.001, god: 0.001})
        ]
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

    for (const p of products) {
      try {
        await dbRun(
          'INSERT INTO product_data (product_name, product_type, product_class, product_detail, product_price, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
          p
        );
      } catch (e) {
        // Product already exists
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
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

    const userRecord = await dbGet('SELECT * FROM user_profile WHERE u_name = ?', [user]);

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

    const existingUser = await dbGet('SELECT id FROM user_profile WHERE u_name = ?', [user]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้มีในระบบแล้ว' });
    }

    const existingEmail = await dbGet('SELECT id FROM user_profile WHERE e_mail = ?', [mail]);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'อีเมลนี้มีในระบบแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const sid = Buffer.from(user + mail + Date.now()).toString('base64');

    await dbRun(
      'INSERT INTO user_profile (u_name, p_word, e_mail, SID, status, user_level, vip_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user, hashedPassword, mail, sid, 'normal', 'guest', 'normal']
    );

    res.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ PRODUCT ROUTES ============

app.get('/api/products', async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM product_data');
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await dbGet('SELECT * FROM product_data WHERE product_id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ USER ROUTES ============

app.get('/api/user/profile', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }

    const user = await dbGet('SELECT * FROM user_profile WHERE id = ?', [req.session.userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.u_name,
        email: user.e_mail,
        payPoint: user.pay_point,
        rewardPoint: user.reward_point,
        level: user.level,
        userLevel: user.user_level,
        vipStatus: user.vip_status,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ ADMIN ROUTES ============

app.get('/api/admin/users', async (req, res) => {
  try {
    if (!req.session.userLevel || req.session.userLevel !== 'actor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' });
    }

    const users = await dbAll('SELECT id, u_name, e_mail, user_level, vip_status, status, pay_point, reward_point FROM user_profile');
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.post('/api/admin/ban-user', async (req, res) => {
  try {
    if (!req.session.userLevel || req.session.userLevel !== 'actor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' });
    }

    const { userId, reason } = req.body;
    await dbRun('UPDATE user_profile SET status = ? WHERE id = ?', ['banner', userId]);
    
    await dbRun(
      'INSERT INTO audit_log (admin_id, action, target_user, details) VALUES (?, ?, ?, ?)',
      [req.session.userId, 'BAN_USER', userId, reason]
    );

    res.json({ success: true, message: 'แบนผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ HEALTH CHECK ============

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
