import React, { useState } from 'react'

export default function Register({ onRegister, onLogin }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, mail: email, pass: password, conpass: confirmPassword })
      })

      const data = await res.json()

      if (data.success) {
        alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ')
        onLogin()
      } else {
        setError(data.message || 'ลงทะเบียนไม่สำเร็จ')
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
          สมัครสมาชิก
        </h1>

        <form onSubmit={handleRegister}>
          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>ชื่อผู้ใช้</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้" required />
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>อีเมล</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมล" required />
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>รหัสผ่าน</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่าน" required />
          </div>

          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>ยืนยันรหัสผ่าน</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="ยืนยันรหัสผ่าน" required />
          </div>

          {error && <div style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', color: '#fca5a5'}}>{error}</div>}

          <button type="submit" disabled={loading} style={{width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1}}>
            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div style={{textAlign: 'center', marginTop: '1rem', color: 'rgba(255, 255, 255, 0.7)'}}>
          มีบัญชีแล้ว? <a onClick={onLogin} style={{color: '#fbbf24', cursor: 'pointer', fontWeight: 600}}>เข้าสู่ระบบ</a>
        </div>
      </div>
    </div>
  )
}
