import React, { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'

export default function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('home')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="loading">กำลังโหลด...</div>
  }

  if (!user && currentPage !== 'register') {
    return (
      <Login 
        onLogin={(userData, token) => {
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(userData))
          setUser(userData)
          setCurrentPage('home')
        }}
        onRegister={() => setCurrentPage('register')}
      />
    )
  }

  if (currentPage === 'register' && !user) {
    return (
      <Register 
        onRegister={() => setCurrentPage('home')}
        onLogin={() => setCurrentPage('home')}
      />
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCurrentPage('home')
  }

  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  return (
    <div className="app">
      <Navbar 
        user={user} 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      
      <main>
        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
        {currentPage === 'shop' && <Shop user={user} />}
        {currentPage === 'profile' && <Profile user={user} setUser={setUser} />}
        {currentPage === 'admin' && user?.level === 'actor' && <Admin />}
      </main>
    </div>
  )
}
