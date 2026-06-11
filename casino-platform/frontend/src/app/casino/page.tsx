'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function CasinoPage() {
  const [activeTab, setActiveTab] = useState('slots')
  const [balance, setBalance] = useState(0)

  const fetchBalance = async () => {
    try {
      const res = await api.get('/wallet/transactions')
      const total = res.data.reduce((acc: number, tx: any) => acc + Number(tx.amount), 0)
      setBalance(total)
    } catch {}
  }

  useEffect(() => { fetchBalance() }, [])

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div>
            <h1 className="text-4xl font-black italic uppercase text-white">Sala de <span className="text-yellow-500">Juegos</span></h1>
            <p className="text-slate-500 font-medium">Suerte y estrategia en cada jugada.</p>
        </div>
        <div className="text-right bg-slate-950 px-8 py-4 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Tu Saldo Actual</span>
            <span className="text-3xl font-black text-green-400">$${balance.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 w-fit mx-auto">
        {['slots', 'blackjack', 'dice'].map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-tighter transition-all ${activeTab === tab ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                {tab === 'slots' ? '🎰 Tragamonedas' : tab === 'blackjack' ? '🃏 Blackjack' : '🎲 Dados'}
            </button>
        ))}
      </div>

      <div className="glass-panel p-10 min-h-[500px]">
        {activeTab === 'slots' && <SlotsGame balance={balance} onUpdate={fetchBalance} />}
        {activeTab === 'blackjack' && <BlackjackGame balance={balance} onUpdate={fetchBalance} />}
        {activeTab === 'dice' && <DiceGame balance={balance} onUpdate={fetchBalance} />}
      </div>
    </div>
  )
}

function SlotsGame({ balance, onUpdate }: any) {
  const [reels, setReels] = useState(['SEVEN', 'BAR', 'CHERRY'])
  const [bet, setBet] = useState(10)
  const [spinning, setSpinning] = useState(false)

  const spin = async () => {
    if (balance < bet) return alert('Saldo insuficiente')
    setSpinning(true)
    try {
        const res = await api.post('/casino/slots/spin', { betAmount: bet })
        setReels(res.data.reels)
        onUpdate()
    } catch (err: any) { alert(err.response?.data?.message || 'Error') }
    finally { setSpinning(false) }
  }

  return (
    <div className="text-center space-y-12">
        <div className="flex justify-center gap-6">
            {reels.map((s, i) => (
                <div key={i} className="w-40 h-52 bg-gradient-to-b from-white to-slate-200 rounded-3xl flex items-center justify-center text-slate-900 font-black text-4xl shadow-2xl border-b-[12px] border-slate-400">
                    {spinning ? '🎲' : s === 'SEVEN' ? '7️⃣' : s === 'BAR' ? '➖' : s === 'BELL' ? '🔔' : '🍒'}
                </div>
            ))}
        </div>
        <div className="max-w-xs mx-auto space-y-6">
            <input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center text-2xl font-black focus:border-yellow-500 outline-none" />
            <button onClick={spin} disabled={spinning} className="btn-primary w-full text-2xl py-6">{spinning ? 'GIRANDO...' : '¡GIRAR!'}</button>
        </div>
    </div>
  )
}

function BlackjackGame({ balance, onUpdate }: any) {
    const [game, setGame] = useState<any>(null)
    const [bet, setBet] = useState(50)

    const play = async () => {
        try {
            const res = await api.post('/casino/blackjack/play', { betAmount: bet })
            setGame(res.data)
            onUpdate()
        } catch (err: any) { alert(err.response?.data?.message) }
    }

    return (
        <div className="text-center space-y-8">
            {game ? (
                <div className="space-y-8 animate-slide-up">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                            <h3 className="text-slate-500 font-bold uppercase text-xs mb-4">Mano Dealer ({game.dealerScore})</h3>
                            <div className="flex justify-center gap-2">
                                {game.dealerHand.map((c: string, i: number) => <div key={i} className="w-16 h-24 bg-white rounded-lg text-slate-900 flex items-center justify-center font-black text-xl border-b-4 border-slate-300">{c}</div>)}
                            </div>
                        </div>
                        <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                            <h3 className="text-slate-500 font-bold uppercase text-xs mb-4">Tu Mano ({game.playerScore})</h3>
                            <div className="flex justify-center gap-2">
                                {game.playerHand.map((c: string, i: number) => <div key={i} className="w-16 h-24 bg-white rounded-lg text-slate-900 flex items-center justify-center font-black text-xl border-b-4 border-slate-300">{c}</div>)}
                            </div>
                        </div>
                    </div>
                    <div className={`text-4xl font-black uppercase italic ${game.result === 'win' ? 'text-green-400' : game.result === 'push' ? 'text-yellow-500' : 'text-red-500'}`}>
                        {game.result === 'win' ? '¡GANASTE!' : game.result === 'push' ? 'EMPATE' : 'PERDISTE'}
                    </div>
                    <button onClick={() => setGame(null)} className="btn-secondary">Nueva Mano</button>
                </div>
            ) : (
                <div className="max-w-xs mx-auto space-y-6">
                    <h3 className="text-xl font-black text-white uppercase italic">Blackjack Pro</h3>
                    <input type="number" value={bet} onChange={e => setBet(Number(e.target.value))} className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center text-2xl font-black outline-none" />
                    <button onClick={play} className="btn-primary w-full text-2xl">REPARTIR</button>
                </div>
            )}
        </div>
    )
}

function DiceGame({ balance, onUpdate }: any) {
    const [result, setResult] = useState<any>(null)
    const [bet, setBet] = useState(20)
    const [target, setTarget] = useState(50)

    const roll = async (condition: 'over' | 'under') => {
        try {
            const res = await api.post('/casino/dice/roll', { betAmount: bet, target, condition })
            setResult(res.data)
            onUpdate()
        } catch (err: any) { alert(err.response?.data?.message) }
    }

    return (
        <div className="text-center space-y-12">
            <div className="flex flex-col items-center gap-4">
                <span className="text-6xl font-black text-white bg-slate-950 w-32 h-32 flex items-center justify-center rounded-full border-4 border-yellow-600 shadow-[0_0_50px_rgba(202,138,4,0.2)]">
                    {result ? result.roll : '??'}
                </span>
                {result && (
                    <div className={`text-2xl font-black uppercase ${result.isWin ? 'text-green-400' : 'text-red-500'}`}>
                        {result.isWin ? `¡GANASTE ${result.winAmount.toFixed(2)}!` : 'PERDISTE'}
                    </div>
                )}
            </div>

            <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                     <label className="text-slate-500 text-xs font-black uppercase">Objetivo: {target}</label>
                     <input type="range" min="2" max="98" value={target} onChange={e => setTarget(Number(e.target.value))} className="w-full accent-yellow-500" />
                </div>
                <button onClick={() => roll('under')} className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 p-4 rounded-2xl font-black uppercase">Menor que {target}</button>
                <button onClick={() => roll('over')} className="bg-green-900/20 hover:bg-green-900/40 text-green-500 border border-green-900/50 p-4 rounded-2xl font-black uppercase">Mayor que {target}</button>
            </div>
        </div>
    )
}
