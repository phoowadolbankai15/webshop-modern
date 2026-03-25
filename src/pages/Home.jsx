import React from 'react'

export default function Home({ onNavigate }) {
  return (
    <div style={{padding: '4rem 2rem'}}>
      <div style={{maxWidth: '1200px', margin: '0 auto', textAlign: 'center'}}>
        <h1 style={{fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
          ยินดีต้อนรับสู่ WebShop Modern
        </h1>
        <p style={{fontSize: '1.2rem', marginBottom: '2rem', color: 'rgba(255, 255, 255, 0.8)'}}>
          ร้านค้าออนไลน์ที่ทันสมัยพร้อมระบบ Gacha และ VIP
        </p>
        <button onClick={() => onNavigate('shop')} style={{padding: '15px 40px', background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer'}}>
          🛍️ เข้าไปดูร้านค้า
        </button>
      </div>
    </div>
  )
}
