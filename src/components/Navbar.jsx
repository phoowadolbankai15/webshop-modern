import React, { useState } from 'react'

export default function Navbar({ user, currentPage, onNavigate, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="navbar" style={{
      background: 'rgba(15, 23, 42, 0.95)',
      borderBottom: '1px solid rgba(124, 58, 237, 0.3)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer'}} onClick={() => onNavigate('home')}>
        🎮 WebShop Modern
      </div>

      <div style={{display: 'flex', gap: '2rem', alignItems: 'center'}}>
        <a style={{color: currentPage === 'home' ? '#fbbf24' : '#fff', cursor: 'pointer', fontWeight: 500}} onClick={() => onNavigate('home')}>หน้าแรก</a>
        <a style={{color: currentPage === 'shop' ? '#fbbf24' : '#fff', cursor: 'pointer', fontWeight: 500}} onClick={() => onNavigate('shop')}>ร้านค้า</a>
        <a style={{color: currentPage === 'profile' ? '#fbbf24' : '#fff', cursor: 'pointer', fontWeight: 500}} onClick={() => onNavigate('profile')}>โปรไฟล์</a>
        {user?.level === 'actor' && (
          <a style={{color: currentPage === 'admin' ? '#fbbf24' : '#fff', cursor: 'pointer', fontWeight: 500}} onClick={() => onNavigate('admin')}>⚙️ แอดมิน</a>
        )}
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
        {user && (
          <>
            <div style={{textAlign: 'right'}}>
              <div style={{fontWeight: 600, color: '#fbbf24'}}>👤 {user.username}</div>
              <div style={{fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)'}}>{user.level === 'actor' ? '👑 Admin' : '⭐ Member'}</div>
            </div>
            <button style={{padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500}} onClick={onLogout}>
              ออกจากระบบ
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
