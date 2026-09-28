import { Link, NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Wordmark from '../../components/Wordmark'
import { useAuth } from '../../lib/auth'

/**
 * The admin is a tool, not a showroom: no hero, no smooth scrolling, no
 * shop chrome. Same palette so it still feels like the same product.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()

  const tab = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-full text-sm transition-colors ${
      isActive
        ? 'bg-[#F4F6F8] text-[#0C0D10]'
        : 'text-[#C3C8CE]/75 hover:text-[#F4F6F8] hover:bg-white/[0.07]'
    }`

  return (
    <div className="min-h-screen bg-[#0C0D10]">
      <header className="border-b border-white/[0.09] sticky top-0 z-50 bg-[#0C0D10]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <Link to="/" className="text-[#F4F6F8] text-lg shrink-0" title="На сайт">
              <Wordmark tracking="0.2em" />
            </Link>
            <span className="text-[10px] tracking-[0.28em] text-[#7C838C] hidden sm:block">
              АДМИН
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink to="/admin/products" className={tab}>
              Товары
            </NavLink>
            <NavLink to="/admin/orders" className={tab}>
              Заказы
            </NavLink>
            <button
              onClick={signOut}
              title="Выйти"
              aria-label="Выйти"
              className="ml-1 p-2.5 rounded-full text-[#7C838C] hover:text-[#F4F6F8] hover:bg-white/[0.07] transition-colors"
            >
              <LogOut size={18} />
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10">{children}</main>
    </div>
  )
}

/** Shown in place of a screen whose endpoint the backend does not have yet. */
export function NotReady({ what, endpoint }: { what: string; endpoint: string }) {
  return (
    <div className="border border-white/10 rounded-2xl p-7 md:p-9 max-w-2xl">
      <h2 className="text-xl font-light text-[#F4F6F8]">{what} пока недоступны</h2>
      <p className="text-[15px] text-[#C3C8CE]/60 leading-relaxed mt-3">
        На бэкенде ещё нет эндпоинта{' '}
        <code className="text-[#C9A86A] bg-[#C9A86A]/10 px-2 py-0.5 rounded">{endpoint}</code>.
        Экран готов и включится, как только он появится — в{' '}
        <code className="text-[#C3C8CE] bg-white/[0.06] px-2 py-0.5 rounded">src/lib/admin.ts</code>{' '}
        нужно поставить соответствующий флаг в <code className="text-[#C3C8CE]">true</code>.
      </p>
    </div>
  )
}
