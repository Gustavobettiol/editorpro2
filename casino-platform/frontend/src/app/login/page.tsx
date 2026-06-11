'use client'
import { useState } from 'react'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      router.push('/')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 glass-panel animate-slide-up">
      <h2 className="text-3xl font-black mb-8 text-center uppercase italic text-white">Entrar a <span className="text-yellow-500">Casino Pro</span></h2>
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-2">Email</label>
          <input
            type="email"
            className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 focus:border-yellow-500 outline-none transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-500 mb-2">Contraseña</label>
          <input
            type="password"
            className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 focus:border-yellow-500 outline-none transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button disabled={loading} className="btn-primary w-full py-4 text-lg">
          {loading ? 'Validando...' : 'INICIAR SESIÓN'}
        </button>
      </form>
    </div>
  )
}
