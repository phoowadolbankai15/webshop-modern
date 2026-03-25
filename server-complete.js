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
    maxAge: 24 * 60 * 60 * 1000
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

// ============ AUTHENTICATION ROUTES ============

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM user_profile WHERE u_name = ?',
      [user]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const userRecord = rows[0];

    // Check status
    if (userRecord.status === 'blocker') {
      return res.status(403).json({ success: false, message: 'บัญชีคุณถูกบล็อคการใช้งาน' });
    }

    if (userRecord.status === 'banner') {
      return res.status(403).json({ success: false, message: 'บัญชีคุณถูกแบนการใช้งาน' });
    }

    // Verify password
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

    // Set session
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
        vipStatus: userRecord.vip_status || 'normal'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { user, mail, pass, conpass } = req.body;

    if (!user || !mail || !pass || !conpass) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    if (pass !== conpass) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านไม่ตรงกัน' });
    }

    const connection = await pool.getConnection();

    const [existingUser] = await connection.query(
      'SELECT id FROM user_profile WHERE u_name = ?',
      [user]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้มีในระบบแล้ว' });
    }

    const [existingEmail] = await connection.query(
      'SELECT id FROM user_profile WHERE e_mail = ?',
      [mail]
    );

    if (existingEmail.length > 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'อีเมลนี้มีในระบบแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const sid = Buffer.from(user + mail + Date.now()).toString('base64');

    await connection.query(
      'INSERT INTO user_profile (u_name, p_word, e_mail, SID, status, user_level, vip_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user, hashedPassword, mail, sid, 'normal', 'guest', 'normal']
    );

    connection.release();

    res.json({ success: true, message: 'ลงทะเบียนใช้งานสำเร็จ' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Logout
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

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT id, u_name, e_mail, pay_point, reward_point, level, user_level, user_img, vip_status FROM user_profile WHERE id = ?',
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

// Get all products (Shop)
app.get('/api/products', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM product_data');
    connection.release();

    res.json({ success: true, products: rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM product_data WHERE product_id = ?',
      [req.params.id]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' });
    }

    res.json({ success: true, product: rows[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ GACHA/LOTTERY ROUTES ============

// Get gacha rates
app.get('/api/gacha/rates', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM gacha_rates');
    connection.release();

    if (rows.length === 0) {
      // Return default rates
      return res.json({ success: true, rates: {
        netflix: { day1: 1, day14: 0.3, day30: 0.9, noPrize: 97.8 },
        rov: { warrior: 20, challenger: 8, master: 5, elite: 0.95, epic: 0.9, legend: 0.3, mythic: 0.001, god: 0.001 }
      }});
    }

    res.json({ success: true, rates: rows[0] });
  } catch (error) {
    console.error('Get gacha rates error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Play gacha (Netflix)
app.post('/api/gacha/netflix', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }

    const connection = await pool.getConnection();
    const [user] = await connection.query(
      'SELECT reward_point FROM user_profile WHERE id = ?',
      [req.session.userId]
    );

    if (user[0].reward_point < 100) {
      connection.release();
      return res.status(400).json({ success: false, message: 'แต้มไม่พอ' });
    }

    // Generate random reward
    const rand = Math.random() * 100;
    let reward = 'noPrize';
    let rewardName = 'ไม่ได้รางวัล';
    let rewardValue = 0;

    if (rand < 1) {
      reward = 'day1';
      rewardName = '1 วัน';
      rewardValue = 1;
    } else if (rand < 1.3) {
      reward = 'day14';
      rewardName = '14 วัน';
      rewardValue = 14;
    } else if (rand < 2.2) {
      reward = 'day30';
      rewardName = '30 วัน';
      rewardValue = 30;
    }

    // Deduct points
    await connection.query(
      'UPDATE user_profile SET reward_point = reward_point - 100 WHERE id = ?',
      [req.session.userId]
    );

    // Log transaction
    await connection.query(
      'INSERT INTO log_raward (log_productname, log_price, log_name, log_date, buy_number) VALUES (?, ?, ?, ?, ?)',
      ['Netflix ' + rewardName, rewardValue, req.session.MM_Username, new Date().toISOString(), 1]
    );

    connection.release();

    res.json({ success: true, reward, rewardName, rewardValue });
  } catch (error) {
    console.error('Gacha error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Play gacha (ROV)
app.post('/api/gacha/rov', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }

    const connection = await pool.getConnection();
    const [user] = await connection.query(
      'SELECT reward_point FROM user_profile WHERE id = ?',
      [req.session.userId]
    );

    if (user[0].reward_point < 100) {
      connection.release();
      return res.status(400).json({ success: false, message: 'แต้มไม่พอ' });
    }

    // Generate random reward
    const rand = Math.random() * 100;
    let reward = 'challenger';
    let rewardName = 'Challenger';

    if (rand < 0.001) {
      reward = 'god';
      rewardName = 'God ID';
    } else if (rand < 0.002) {
      reward = 'mythic';
      rewardName = 'Mythic';
    } else if (rand < 0.302) {
      reward = 'legend';
      rewardName = 'Legend';
    } else if (rand < 1.202) {
      reward = 'epic';
      rewardName = 'Epic';
    } else if (rand < 2.152) {
      reward = 'elite';
      rewardName = 'Elite';
    } else if (rand < 7.152) {
      reward = 'master';
      rewardName = 'Master';
    } else if (rand < 27.152) {
      reward = 'warrior';
      rewardName = 'Warrior';
    }

    // Deduct points
    await connection.query(
      'UPDATE user_profile SET reward_point = reward_point - 100 WHERE id = ?',
      [req.session.userId]
    );

    // Log transaction
    await connection.query(
      'INSERT INTO log_raward (log_productname, log_price, log_name, log_date, buy_number) VALUES (?, ?, ?, ?, ?)',
      ['ROV ' + rewardName, 1, req.session.MM_Username, new Date().toISOString(), 1]
    );

    connection.release();

    res.json({ success: true, reward, rewardName });
  } catch (error) {
    console.error('Gacha error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ REWARD ROUTES ============

// Get all rewards
app.get('/api/rewards', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM reward_data');
    connection.release();

    res.json({ success: true, rewards: rows });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ REWARD CODE ROUTES ============

// Use reward code
app.post('/api/rewardcode/use', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'ไม่ได้เข้าสู่ระบบ' });
    }

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'กรุณาใส่โค้ด' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM rewardcode_data WHERE code = ?',
      [code]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'โค้ดไม่ถูกต้อง' });
    }

    const rewardCode = rows[0];

    // Add reward points
    await connection.query(
      'UPDATE user_profile SET reward_point = reward_point + ? WHERE id = ?',
      [rewardCode.reward, req.session.userId]
    );

    // Delete code
    await connection.query(
      'DELETE FROM rewardcode_data WHERE id = ?',
      [rewardCode.id]
    );

    connection.release();

    res.json({ success: true, message: 'ใช้โค้ดสำเร็จ', reward: rewardCode.reward });
  } catch (error) {
    console.error('Use reward code error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ EVENT ROUTES ============

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const connection = await pool.getConnection();
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
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM update_post');
    connection.release();

    res.json({ success: true, updates: rows });
  } catch (error) {
    console.error('Get updates error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ ADMIN ROUTES ============

// Get all users (Admin only)
app.get('/api/admin/users', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userLevel !== 'actor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT id, u_name, e_mail, status, user_level, vip_status FROM user_profile');
    connection.release();

    res.json({ success: true, users: rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Ban/Unban user (Admin only)
app.post('/api/admin/user/ban', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userLevel !== 'actor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const { userId, status } = req.body;

    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE user_profile SET status = ? WHERE id = ?',
      [status, userId]
    );

    // Log audit
    await connection.query(
      'INSERT INTO audit_log (admin_id, action, target_user, timestamp) VALUES (?, ?, ?, ?)',
      [req.session.userId, `Ban user: ${status}`, userId, new Date().toISOString()]
    );

    connection.release();

    res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Toggle VIP status (Admin only)
app.post('/api/admin/user/vip', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userLevel !== 'actor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const { userId, vipStatus } = req.body;

    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE user_profile SET vip_status = ? WHERE id = ?',
      [vipStatus, userId]
    );

    // Log audit
    await connection.query(
      'INSERT INTO audit_log (admin_id, action, target_user, timestamp) VALUES (?, ?, ?, ?)',
      [req.session.userId, `VIP status: ${vipStatus}`, userId, new Date().toISOString()]
    );

    connection.release();

    res.json({ success: true, message: 'อัปเดต VIP สำเร็จ' });
  } catch (error) {
    console.error('VIP error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// Update gacha rates (Admin only)
app.post('/api/admin/gacha/rates', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userLevel !== 'actor') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์' });
    }

    const { rates } = req.body;

    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE gacha_rates SET netflix = ?, rov = ? WHERE id = 1',
      [JSON.stringify(rates.netflix), JSON.stringify(rates.rov)]
    );

    // Log audit
    await connection.query(
      'INSERT INTO audit_log (admin_id, action, target_user, timestamp) VALUES (?, ?, ?, ?)',
      [req.session.userId, 'Update gacha rates', 'system', new Date().toISOString()]
    );

    connection.release();

    res.json({ success: true, message: 'อัปเดตอัตราสำเร็จ' });
  } catch (error) {
    console.error('Update rates error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ============ WEB SETTINGS ============

// Get web configuration
app.get('/api/config', async (req, res) => {
  try {
    const connection = await pool.getConnection();
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
