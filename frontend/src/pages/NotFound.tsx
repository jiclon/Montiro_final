import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WHATSAPP } from '../lib/contacts'

/**
 * Unknown addresses used to drop silently into the catalog, which hides a
 * broken link instead of reporting it.
 */
export default function NotFound() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = 'Страница не найдена — MONTIRO'
    return () => {
      document.title = 'MONTIRO — наручные часы'
    }
  }, [])

  return (
    <main className="relative z-20 bg-[#0C0D10] min-h-screen">
      <div className="max-w-7xl mx-auto px-5 pt-28 md:pt-36 pb-24 md:pb-32">
        <p className="text-xs tracking-[0.32em] text-[#7C838C]">404</p>
        <h1 className="t-display text-[#F4F6F8] font-extralight mt-5">Такой страницы нет</h1>
        <p className="text-[15px] md:text-base text-[#C3C8CE]/60 leading-relaxed max-w-md mt-6">
          Адрес <span className="text-[#C3C8CE] break-all">{pathname}</span> не существует —
          возможно, ссылка устарела. Каталог на месте, начните оттуда.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-9">
          <Link
            to="/catalog"
            className="text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors"
          >
            В каталог
          </Link>
          <Link
            to="/"
            className="text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors"
          >
            На главную
          </Link>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            className="text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors"
          >
            Написать
          </a>
        </div>
      </div>
    </main>
  )
}
