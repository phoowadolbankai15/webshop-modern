import React, { useState, useEffect } from 'react'

export default function Profile({ user, setUser }) {
  const [profile, setProfile] = useState(user)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUseCode = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rewardcode/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      if (data.success) {
        alert('ใช้โค้ดสำเร็จ! ได้ ' + data.reward + ' แต้ม')
        setCode('')
      } else {
        alert(data.message)
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{padding: '2rem', maxWidth: '600px', margin: '0 auto'}}>
      <h1 style={{marginBottom: '2rem'}}>👤 โปรไฟล์</h1>

      <div style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '12px', padding: '2rem', marginBottom: '2rem'}}>
        <div style={{marginBottom: '1.5rem'}}>
          <label style={{color: 'rgba(255, 255, 255, 0.7)'}}>ชื่อผู้ใช้:</label>
          <div style={{fontSize: '1.2rem', fontWeight: 600, color: '#fbbf24'}}>{profile?.username}</div>
        </div>

        <div style={{marginBottom: '1.5rem'}}>
          <label style={{color: 'rgba(255, 255, 255, 0.7)'}}>อีเมล:</label>
          <div>{profile?.email}</div>
        </div>

        <div style={{marginBottom: '1.5rem'}}>
          <label style={{color: 'rgba(255, 255, 255, 0.7)'}}>แต้มเงิน:</label>
          <div style={{fontSize: '1.5rem', fontWeight: 700, color: '#10b981'}}>฿{profile?.payPoint || 0}</div>
        </div>

        <div style={{marginBottom: '1.5rem'}}>
          <label style={{color: 'rgba(255, 255, 255, 0.7)'}}>แต้มรางวัล:</label>
          <div style={{fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24'}}>{profile?.rewardPoint || 0}</div>
        </div>

        <div>
          <label style={{color: 'rgba(255, 255, 255, 0.7)'}}>สถานะ VIP:</label>
          <div style={{fontSize: '1.1rem', fontWeight: 600, color: profile?.vipStatus === 'vip' ? '#fbbf24' : '#fff'}}>
            {profile?.vipStatus === 'vip' ? '👑 VIP' : 'สมาชิกทั่วไป'}
          </div>
        </div>
      </div>

      <div style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '12px', padding: '2rem'}}>
        <h3 style={{marginBottom: '1rem'}}>ใช้โค้ดรับแต้ม</h3>
        <div style={{display: 'flex', gap: '1rem'}}>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ใส่โค้ด" />
          <button onClick={handleUseCode} disabled={loading} style={{padding: '10px 20px', background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600}}>
            {loading ? 'กำลัง...' : 'ใช้'}
          </button>
        </div>
      </div>
    </div>
  )
}
