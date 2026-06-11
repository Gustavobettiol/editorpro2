import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Casino Pro Platform',
  description: 'Plataforma de gambling legal y responsable',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center font-black text-slate-900 group-hover:rotate-12 transition-transform">C</div>
              <span className="text-2xl font-black tracking-tighter text-white uppercase italic">Casino<span className="text-yellow-500">Pro</span></span>
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
              <Link href="/sports" className="hover:text-yellow-500 transition-colors">Deportes</Link>
              <Link href="/casino" className="hover:text-yellow-500 transition-colors">Casino</Link>
              <Link href="/wallet" className="hover:text-yellow-500 transition-colors">Billetera</Link>
              <Link href="/login" className="bg-slate-800 text-white px-5 py-2 rounded-full border border-slate-700 hover:bg-slate-700 transition-all">Entrar</Link>
            </div>
          </div>
        </nav>

        <main className="flex-grow">
          {children}
        </main>

        <footer className="bg-slate-900 border-t border-slate-800 py-12 px-6">
          <div className="container mx-auto text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-red-950/30 border border-red-900/50 rounded-full">
                <p className="text-red-500 font-black text-xs tracking-[0.2em]">JUEGA CON RESPONSABILIDAD. PROHIBIDO MENORES DE 18 AÑOS.</p>
            </div>
            <p className="text-slate-500 text-xs max-w-xl mx-auto leading-relaxed">
                © 2024 Casino Pro Platform. Esta plataforma utiliza sistemas RNG auditables y cumple con estándares internacionales de juego seguro.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
