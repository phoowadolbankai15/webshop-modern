const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'userdata',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to get database connection
async function getConnection() {
  return await pool.getConnection();
}

// ============ AUTHENTICATION ROUTES ============

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const connection = await getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM user_profile WHERE u_name = ?',
      [user]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const userRecord = rows[0];

    // Check if account is blocked or banned
    if (userRecord.status === 'blocker') {
      return res.status(403).json({ success: false, message: 'บัญชีคุณถูกบล็อคการใช้งาน' });
    }

    if (userRecord.status === 'banner') {
      return res.status(403).json({ success: false, message: 'บัญชีคุณถูกแบนการใช้งาน' });
    }

    // Verify password (using bcrypt for new passwords, base64 for legacy)
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(pass, userRecord.p_word);
    } catch (e) {
      // Fallback to base64 for legacy passwords
      const encodedPass = Buffer.from(pass).toString('base64');
      passwordMatch = encodedPass === userRecord.p_word;
    }

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // Set session
    req.session.MM_Username = user;
    req.session.userId = userRecord.id;
    req.session.userLevel = userRecord.user_level;

    // Create JWT token
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
        rewardPoint: userRecord.reward_point
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Register route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { user, mail, pass, conpass } = req.body;

    // Validation
    if (!user || !mail || !pass || !conpass) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (pass !== conpass) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านไม่ตรงกัน' });
    }

    const connection = await getConnection();

    // Check if username exists
    const [existingUser] = await connection.query(
      'SELECT id FROM user_profile WHERE u_name = ?',
      [user]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้มีในระบบแล้ว' });
    }

    // Check if email exists
    const [existingEmail] = await connection.query(
      'SELECT id FROM user_profile WHERE e_mail = ?',
      [mail]
    );

    if (existingEmail.length > 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'อีเมลนี้มีในระบบแล้ว' });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(pass, 10);
    const sid = Buffer.from(user + mail + Date.now()).toString('base64');

    // Insert new user
    await connection.query(
      'INSERT INTO user_profile (u_name, p_word, e_mail, SID, status, user_level) VALUES (?, ?, ?, ?, ?, ?)',
      [user, hashedPassword, mail, sid, 'normal', 'guest']
    );

    connection.release();

    res.json({ success: true, message: 'ลงทะเบียนใช้งานสำเร็จ' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Logout route
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
    res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  });
});

// ============ USER ROUTES ============

// Get user profile
app.get('/api/user/profile', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }

    const connection = await getConnection();
    const [rows] = await connection.query(
      'SELECT id, u_name, e_mail, pay_point, reward_point, level, user_level, user_img FROM user_profile WHERE id = ?',
      [req.session.userId]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ PRODUCT ROUTES ============

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT * FROM product_data');
    connection.release();

    res.json({ success: true, products: rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ REWARD ROUTES ============

// Get all rewards
app.get('/api/rewards', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT * FROM reward_data');
    connection.release();

    res.json({ success: true, rewards: rows });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ EVENT ROUTES ============

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT * FROM event_post');
    connection.release();

    res.json({ success: true, events: rows });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Get all updates
app.get('/api/updates', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT * FROM update_post');
    connection.release();

    res.json({ success: true, updates: rows });
  } catch (error) {
    console.error('Get updates error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ WEB SETTINGS ============

// Get web configuration
app.get('/api/config', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT * FROM web_setting WHERE config_id = 1');
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบการตั้งค่า' });
    }

    res.json({ success: true, config: rows[0] });
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
  console.log(`Server running on http://localhost:${PORT}`);
});
