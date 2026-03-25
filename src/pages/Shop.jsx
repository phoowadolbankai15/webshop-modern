import React, { useState, useEffect } from 'react'

export default function Shop({ user }) {
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(d => {
        setProducts(d.products || [])
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter)

  return (
    <div style={{padding: '2rem'}}>
      <h1 style={{marginBottom: '2rem'}}>🛍️ ร้านค้า</h1>

      <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap'}}>
        {['all', 'rov', 'netflix', 'garena'].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{padding: '10px 20px', background: filter === cat ? 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.1)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500}}>
            {cat === 'all' ? 'ทั้งหมด' : cat === 'rov' ? 'ROV' : cat === 'netflix' ? 'Netflix' : 'Garena'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '2rem'}}>กำลังโหลด...</div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem'}}>
          {filtered.map(product => (
            <div key={product.product_id} style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center'}}>
              <h3 style={{marginBottom: '0.5rem'}}>{product.product_name}</h3>
              <p style={{color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem'}}>{product.product_detail}</p>
              <div style={{fontSize: '1.5rem', fontWeight: 700, color: '#fbbf24', marginBottom: '1rem'}}>฿{product.product_price}</div>
              <button style={{width: '100%', padding: '10px', background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600}}>
                ซื้อเลย
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
