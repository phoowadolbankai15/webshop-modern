import React, { useState } from 'react'

export default function Login({ onLogin, onRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, pass: password })
      })

      const data = await res.json()

      if (data.success) {
        onLogin(data.user, data.token)
      } else {
        setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem'}}>
      <div style={{width: '100%', maxWidth: '400px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '12px', padding: '2rem', backdropFilter: 'blur(10px)'}}>
        <h1 style={{textAlign: 'center', marginBottom: '2rem', background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
          🎮 WebShop Modern
        </h1>

        <form onSubmit={handleLogin}>
          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>ชื่อผู้ใช้</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ใส่ชื่อผู้ใช้"
              required
            />
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ใส่รหัสผ่าน"
              required
            />
          </div>

          {error && (
            <div style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', color: '#fca5a5'}}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1}}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{textAlign: 'center', marginTop: '1rem', color: 'rgba(255, 255, 255, 0.7)'}}>
          ยังไม่มีบัญชี? <a onClick={onRegister} style={{color: '#fbbf24', cursor: 'pointer', fontWeight: 600}}>สมัครสมาชิก</a>
        </div>

        <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)'}}>
          <strong>ทดสอบ:</strong><br/>
          Username: navydesign<br/>
          Password: navydesignpage
        </div>
      </div>
    </div>
  )
}
