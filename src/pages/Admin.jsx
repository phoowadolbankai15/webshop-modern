import React, { useState, useEffect } from 'react'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('users')

  useEffect(() => {
    if (tab === 'users') {
      fetch('/api/admin/users')
        .then(r => r.json())
        .then(d => {
          setUsers(d.users || [])
          setLoading(false)
        })
        .catch(e => {
          console.error(e)
          setLoading(false)
        })
    }
  }, [tab])

  const handleBan = async (userId, status) => {
    try {
      const res = await fetch('/api/admin/user/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      })
      const data = await res.json()
      if (data.success) {
        alert('อัปเดตสำเร็จ')
        setUsers(users.map(u => u.id === userId ? {...u, status} : u))
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด')
    }
  }

  return (
    <div style={{padding: '2rem'}}>
      <h1 style={{marginBottom: '2rem'}}>⚙️ แอดมิน</h1>

      <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
        <button onClick={() => setTab('users')} style={{padding: '10px 20px', background: tab === 'users' ? 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.1)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>
          👥 ผู้ใช้
        </button>
        <button onClick={() => setTab('gacha')} style={{padding: '10px 20px', background: tab === 'gacha' ? 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.1)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>
          🎰 Gacha
        </button>
      </div>

      {tab === 'users' && (
        <div>
          {loading ? (
            <div>กำลังโหลด...</div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid rgba(124, 58, 237, 0.3)'}}>
                    <th style={{padding: '1rem', textAlign: 'left'}}>ชื่อผู้ใช้</th>
                    <th style={{padding: '1rem', textAlign: 'left'}}>อีเมล</th>
                    <th style={{padding: '1rem', textAlign: 'left'}}>สถานะ</th>
                    <th style={{padding: '1rem', textAlign: 'left'}}>ระดับ</th>
                    <th style={{padding: '1rem', textAlign: 'left'}}>การกระทำ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{borderBottom: '1px solid rgba(124, 58, 237, 0.2)'}}>
                      <td style={{padding: '1rem'}}>{user.u_name}</td>
                      <td style={{padding: '1rem'}}>{user.e_mail}</td>
                      <td style={{padding: '1rem', color: user.status === 'normal' ? '#10b981' : '#ef4444'}}>{user.status}</td>
                      <td style={{padding: '1rem'}}>{user.user_level}</td>
                      <td style={{padding: '1rem'}}>
                        <button onClick={() => handleBan(user.id, user.status === 'normal' ? 'blocker' : 'normal')} style={{padding: '5px 10px', background: user.status === 'normal' ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem'}}>
                          {user.status === 'normal' ? 'Ban' : 'Unban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'gacha' && (
        <div style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '12px', padding: '2rem'}}>
          <h3>Gacha Rates Management</h3>
          <p style={{color: 'rgba(255, 255, 255, 0.7)', marginTop: '1rem'}}>ฟีเจอร์นี้กำลังพัฒนา</p>
        </div>
      )}
    </div>
  )
}
