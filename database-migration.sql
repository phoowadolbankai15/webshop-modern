-- Create database
CREATE DATABASE IF NOT EXISTS userdata;
USE userdata;

-- User Profile Table
CREATE TABLE IF NOT EXISTS user_profile (
  id INT(4) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(10) NOT NULL DEFAULT 'normal',
  u_name VARCHAR(16) NOT NULL UNIQUE,
  p_word VARCHAR(1000) NOT NULL,
  SID VARCHAR(1000) NOT NULL,
  e_mail VARCHAR(1000) NOT NULL UNIQUE,
  pay_point INT(7) NOT NULL DEFAULT '0',
  reward_point INT(7) NOT NULL DEFAULT '0',
  level INT(2) NOT NULL DEFAULT '1',
  user_exp INT(4) NOT NULL DEFAULT '0',
  max_exp INT(4) NOT NULL DEFAULT '1000',
  user_level VARCHAR(16) NOT NULL DEFAULT 'guest',
  user_img VARCHAR(1000) NOT NULL DEFAULT 'unprofile',
  vip_status VARCHAR(16) NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product Data Table (Shop)
CREATE TABLE IF NOT EXISTS product_data (
  product_id INT(4) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(100) NOT NULL,
  product_type VARCHAR(100) NOT NULL,
  product_class VARCHAR(100) NOT NULL,
  product_detail VARCHAR(100) NOT NULL,
  product_price INT(5) NOT NULL,
  product_img VARCHAR(1000) NOT NULL DEFAULT 'unproduct',
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  stock INT(5) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reward Data Table
CREATE TABLE IF NOT EXISTS reward_data (
  reward_id INT(3) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reward_name VARCHAR(100) NOT NULL,
  reward_type VARCHAR(100) NOT NULL,
  reward_detail VARCHAR(100) NOT NULL,
  reward_price INT(7) NOT NULL,
  reward_img VARCHAR(100) NOT NULL DEFAULT 'unproduct.jpg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Event Post Table
CREATE TABLE IF NOT EXISTS event_post (
  post_id1 INT(4) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_head1 TEXT NOT NULL,
  post_detail1 TEXT NOT NULL,
  post_img1 VARCHAR(1000) NOT NULL DEFAULT 'unimg.jpg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update Post Table
CREATE TABLE IF NOT EXISTS update_post (
  post_id INT(4) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_head TEXT NOT NULL,
  post_detail TEXT NOT NULL,
  post_img VARCHAR(100) NOT NULL DEFAULT 'unimg.jpg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reward Code Data Table
CREATE TABLE IF NOT EXISTS rewardcode_data (
  id INT(6) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  reward INT(4) NOT NULL,
  used_by INT(4),
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product Buy Log Table
CREATE TABLE IF NOT EXISTS log_productbuy (
  log_id INT(3) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  log_productname VARCHAR(1000) NOT NULL,
  log_price INT(7) NOT NULL,
  log_name VARCHAR(1000) NOT NULL,
  log_date VARCHAR(12) NOT NULL,
  buy_number VARCHAR(100) NOT NULL,
  user_id INT(4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reward Log Table
CREATE TABLE IF NOT EXISTS log_raward (
  log_id INT(4) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  log_productname VARCHAR(100) NOT NULL,
  log_price INT(7) NOT NULL,
  log_name VARCHAR(100) NOT NULL,
  log_date VARCHAR(100) NOT NULL,
  buy_number VARCHAR(100) NOT NULL,
  user_id INT(4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Web Setting Table
CREATE TABLE IF NOT EXISTS web_setting (
  config_id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
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
  web_logo VARCHAR(1000) NOT NULL,
  install_gamelink VARCHAR(1000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Gacha Rates Table
CREATE TABLE IF NOT EXISTS gacha_rates (
  id INT(1) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  netflix JSON NOT NULL,
  rov JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
  id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  admin_id INT(4) NOT NULL,
  action VARCHAR(255) NOT NULL,
  target_user INT(4),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default data
INSERT INTO user_profile (u_name, p_word, e_mail, SID, status, user_level, pay_point, reward_point) 
VALUES ('navydesign', '$2a$10$YourHashedPasswordHere', 'navydesign@navydesign.com', 'YzJlMzUzNDllOTg5NDE4MDFkMTQ4NDQyNGUzNDliZTE=', 'normal', 'actor', 6000, 6000);

INSERT INTO web_setting (webname, webstatus, version, ip, fbpage, slide1_img, slide2_img, slide3_img, background_img, video_link, text_run, web_logo, install_gamelink)
VALUES ('WebShop Modern', 'เปิดให้บริการ', '1.0.0', '127.0.0.1', 'webshopmodern', 'slide1.jpg', 'slide2.jpg', 'slide3.jpg', 'background.jpg', 'sbrAduXXiBE', 'ยินดีต้อนรับสู่ WebShop Modern', 'logo.png', 'https://example.com/download');

INSERT INTO gacha_rates (netflix, rov) 
VALUES (
  JSON_OBJECT('day1', 1, 'day14', 0.3, 'day30', 0.9, 'noPrize', 97.8),
  JSON_OBJECT('warrior', 20, 'challenger', 8, 'master', 5, 'elite', 0.95, 'epic', 0.9, 'legend', 0.3, 'mythic', 0.001, 'god', 0.001)
);

-- Insert sample products
INSERT INTO product_data (product_name, product_type, product_class, product_detail, product_price, category, stock)
VALUES 
  ('ROV Mythic ID', 'Game ID', 'Rare', 'ไอดี ROV ระดับ Mythic', 99, 'rov', 10),
  ('ROV Legend ID', 'Game ID', 'Rare', 'ไอดี ROV ระดับ Legend', 49, 'rov', 20),
  ('Netflix 1 Month', 'Subscription', 'Premium', 'Netflix 1 เดือน', 9, 'netflix', 100),
  ('Netflix 3 Months', 'Subscription', 'Premium', 'Netflix 3 เดือน', 24, 'netflix', 100),
  ('Garena 50 Baht', 'Card', 'Standard', 'บัตร Garena 50 บาท', 50, 'garena', 50),
  ('Garena 100 Baht', 'Card', 'Standard', 'บัตร Garena 100 บาท', 100, 'garena', 50);

-- Insert sample events
INSERT INTO event_post (post_head1, post_detail1, post_img1)
VALUES 
  ('ยินดีต้อนรับ', 'ยินดีต้อนรับสู่ WebShop Modern', 'event1.jpg'),
  ('อัปเดตใหม่', 'เพิ่มระบบ Gacha ใหม่', 'event2.jpg');

-- Insert sample updates
INSERT INTO update_post (post_head, post_detail, post_img)
VALUES 
  ('อัปเดต v1.0.0', 'เปิดตัว WebShop Modern', 'update1.jpg'),
  ('ปรับปรุง UI/UX', 'ปรับปรุงหน้าตา Gacha', 'update2.jpg');

-- Create indexes
CREATE INDEX idx_user_username ON user_profile(u_name);
CREATE INDEX idx_user_email ON user_profile(e_mail);
CREATE INDEX idx_product_category ON product_data(category);
CREATE INDEX idx_log_user ON log_productbuy(user_id);
CREATE INDEX idx_log_reward_user ON log_raward(user_id);
CREATE INDEX idx_audit_admin ON audit_log(admin_id);
