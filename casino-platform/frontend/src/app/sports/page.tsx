'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export default function SportsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [parlay, setParlay] = useState<any[]>([])

  useEffect(() => {
    api.get('/sports-betting/events')
      .then(res => setEvents(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const addToParlay = (event: any, prediction: string, odds: number) => {
      if (parlay.find(p => p.eventId === event.id)) return
      setParlay([...parlay, { eventId: event.id, title: `${event.teamA} vs ${event.teamB}`, prediction, odds }])
  }

  const placeParlay = async () => {
      const amount = prompt('Monto para la combinada:', '50')
      if (!amount) return
      try {
          await api.post('/sports-betting/parlay', { selections: parlay, amount: Number(amount) })
          alert('¡Apuesta combinada realizada!')
          setParlay([])
      } catch (err: any) { alert(err.response?.data?.message) }
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 flex flex-col lg:flex-row gap-12 animate-slide-up">
      <div className="flex-grow space-y-8">
        <h2 className="text-3xl font-black italic uppercase text-white border-l-8 border-yellow-600 pl-6">Eventos en Vivo</h2>

        <div className="space-y-4">
            {events.map((event: any) => (
            <div key={event.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-slate-700 transition-all">
                <div className="text-center md:text-left">
                <span className="bg-yellow-600/10 text-yellow-500 text-[10px] uppercase font-black px-2 py-1 rounded-full mb-2 inline-block">{event.sport}</span>
                <div className="text-xl font-black flex items-center gap-4 text-white">
                    <span>{event.teamA}</span>
                    <span className="text-slate-600 text-sm font-medium italic">VS</span>
                    <span>{event.teamB}</span>
                </div>
                </div>

                <div className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                {[
                    { label: 'Local', val: 'A', o: event.oddsA },
                    { label: 'Empate', val: 'Draw', o: event.oddsDraw },
                    { label: 'Visitante', val: 'B', o: event.oddsB }
                ].map(opt => (
                    <button
                        key={opt.val}
                        onClick={() => addToParlay(event, opt.val, opt.o)}
                        className="bg-slate-900 hover:bg-slate-800 px-6 py-3 rounded-xl flex flex-col items-center transition-all active:scale-95 border border-transparent hover:border-yellow-500/30"
                    >
                        <span className="text-[10px] text-slate-500 uppercase font-bold">{opt.label}</span>
                        <span className="font-black text-yellow-500 text-lg">{Number(opt.o).toFixed(2)}</span>
                    </button>
                ))}
                </div>
            </div>
            ))}
        </div>
      </div>

      <div className="lg:w-96 space-y-6">
        <div className="glass-panel p-8 sticky top-24">
            <h3 className="text-xl font-black italic uppercase mb-6 text-white border-b border-slate-800 pb-4">Cupón de Apuestas</h3>
            {parlay.length === 0 ? (
                <p className="text-slate-500 text-sm italic text-center py-8">Selecciona cuotas para armar tu apuesta combinada.</p>
            ) : (
                <div className="space-y-4">
                    {parlay.map((p, i) => (
                        <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center animate-slide-up">
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{p.title}</p>
                                <p className="text-sm font-black text-white">{p.prediction}</p>
                            </div>
                            <span className="text-yellow-500 font-black">{Number(p.odds).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="pt-4 border-t border-slate-800">
                        <div className="flex justify-between text-lg font-black mb-6">
                            <span className="text-slate-400 uppercase text-xs">Cuota Total</span>
                            <span className="text-yellow-500">
                                {parlay.reduce((acc, p) => acc * p.odds, 1).toFixed(2)}
                            </span>
                        </div>
                        <button onClick={placeParlay} className="btn-primary w-full">APOSTAR AHORA</button>
                        <button onClick={() => setParlay([])} className="text-xs text-slate-600 font-bold uppercase w-full mt-4 hover:text-red-500 transition-colors">Limpiar Cupón</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
