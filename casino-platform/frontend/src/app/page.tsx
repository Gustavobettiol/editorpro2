import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">
            Bienvenido a <span className="text-yellow-500">Casino Pro</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            La plataforma líder en entretenimiento digital, apuestas deportivas y juegos de casino con transparencia garantizada.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Link href="/sports" className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-yellow-500/50 transition-all shadow-xl hover:-translate-y-2">
            <div className="w-16 h-16 bg-yellow-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-600/20 transition-colors">
                <span className="text-3xl">⚽</span>
            </div>
            <h3 className="text-2xl font-black mb-3 uppercase italic">Deportes</h3>
            <p className="text-slate-400 mb-6">Apuesta en tus ligas favoritas con las mejores cuotas del mercado en tiempo real.</p>
            <span className="text-yellow-500 font-bold group-hover:underline">Ir a apostar →</span>
        </Link>

        <Link href="/casino" className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-yellow-500/50 transition-all shadow-xl hover:-translate-y-2">
            <div className="w-16 h-16 bg-yellow-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-600/20 transition-colors">
                <span className="text-3xl">🎰</span>
            </div>
            <h3 className="text-2xl font-black mb-3 uppercase italic">Casino</h3>
            <p className="text-slate-400 mb-6">Tragamonedas y ruleta con sistema RNG auditable para una experiencia justa.</p>
            <span className="text-yellow-500 font-bold group-hover:underline">Probar suerte →</span>
        </Link>

        <Link href="/wallet" className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-yellow-500/50 transition-all shadow-xl hover:-translate-y-2">
            <div className="w-16 h-16 bg-yellow-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-600/20 transition-colors">
                <span className="text-3xl">💳</span>
            </div>
            <h3 className="text-2xl font-black mb-3 uppercase italic">Billetera</h3>
            <p className="text-slate-400 mb-6">Gestiona tus fondos de forma segura con nuestro sistema de transacciones inmutables.</p>
            <span className="text-yellow-500 font-bold group-hover:underline">Ver saldo →</span>
        </Link>
      </div>

      <div className="mt-20 bg-slate-900 p-10 rounded-3xl border border-slate-800 text-center">
        <h4 className="text-red-500 font-black uppercase text-xs mb-4 tracking-[0.3em]">Aviso Legal Obligatorio</h4>
        <p className="text-slate-500 text-sm max-w-3xl mx-auto leading-relaxed">
            El juego puede causar adicción. Juegue de forma responsable. El acceso a esta plataforma está estrictamente prohibido a menores de 18 años.
            Contamos con herramientas de autoexclusión y límites de depósito para proteger a nuestros usuarios.
        </p>
      </div>
    </div>
  )
}
