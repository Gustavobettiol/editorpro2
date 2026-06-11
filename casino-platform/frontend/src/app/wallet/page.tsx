'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWalletData = async () => {
    try {
        const res = await api.get('/wallet/transactions')
        setTransactions(res.data)
        const total = res.data.reduce((acc: number, tx: any) => acc + Number(tx.amount), 0)
        setBalance(total)
    } catch (err) {
        console.error('Error fetching wallet', err)
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  const handleDeposit = async () => {
    const amount = prompt('Monto a depositar:', '100')
    if (!amount) return
    try {
        await api.post('/wallet/deposit', { amount: Number(amount) })
        fetchWalletData()
    } catch (err) {
        alert('Error al depositar')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 flex justify-between items-center shadow-xl">
        <div>
          <h2 className="text-slate-400 uppercase text-xs font-black tracking-widest">Saldo Disponible</h2>
          <p className="text-5xl font-black text-green-400">$${balance.toFixed(2)}</p>
        </div>
        <div className="space-x-4">
          <button onClick={handleDeposit} className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-xl font-black transition-all active:scale-95 shadow-lg shadow-green-900/20">DEPOSITAR</button>
          <button className="bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded-xl font-black transition-all opacity-50 cursor-not-allowed">RETIRAR</button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        <h3 className="p-5 bg-slate-700/50 font-black text-lg uppercase tracking-tighter border-b border-slate-700">Historial de Transacciones</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead>
                <tr className="text-slate-400 border-b border-slate-700 text-xs uppercase bg-slate-900/30">
                <th className="p-5">Fecha</th>
                <th className="p-5">Tipo</th>
                <th className="p-5">Monto</th>
                <th className="p-5">Estado</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={4} className="p-12 text-center text-slate-500 animate-pulse">Cargando transacciones...</td></tr>
                ) : transactions.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-slate-500 italic">No hay transacciones registradas</td></tr>
                ) : (
                transactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="p-5 text-sm">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="p-5"><span className="bg-slate-900 px-2 py-1 rounded text-[10px] font-bold uppercase">{tx.type.replace('_', ' ')}</span></td>
                    <td className={`p-5 font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="p-5 text-[10px] uppercase font-black text-slate-500">{tx.status}</td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}
