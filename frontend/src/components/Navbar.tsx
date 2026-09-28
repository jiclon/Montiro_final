import { useEffect, useState } from 'react'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import Wordmark from './Wordmark'
import { WHATSAPP } from '../lib/contacts'
import { useCart } from '../lib/cart'

/**
 * Sections of the site, not slices of the catalog. Categories live on the
 * catalog page itself, where they are built from the data — putting them up
 * here hardcoded them and made the bar read like a filter panel.
 */
const LINKS = [
  { label: 'Главная', to: '/' },
  { label: 'Каталог', to: '/catalog' },
  { label: 'Доставка', to: '/help#delivery' },
  { label: 'Поддержка', to: '/help' },
]

/** Which link wears the filled pill — the section you are actually in. */
function activeIndex(pathname: string): number {
  if (pathname === '/') return 0
  if (pathname.startsWith('/catalog') || pathname.startsWith('/product')) return 1
  if (pathname.startsWith('/help')) return 3
  return -1
}

export default function Navbar() {
  // The page runs dark, then opens into the white dial section. The bar has to
  // flip with it or it simply disappears against the white.
  const [onLight, setOnLight] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { count } = useCart()

  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      setScrolled(window.scrollY > 40)

      // the dial opening counts as light long before the section itself arrives
      if (document.documentElement.dataset.dial === 'open') {
        setOnLight(true)
        return
      }
      const light = document.getElementById('featured')
      // No light section on this page — every other page is dark end to end.
      // Bailing out here instead would strand the bar in its dark-ink skin
      // after navigating away from the home page, i.e. invisible.
      if (!light) {
        setOnLight(false)
        return
      }
      const r = light.getBoundingClientRect()
      setOnLight(r.top <= 64 && r.bottom >= 64)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    window.addEventListener('montiro:dial', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('montiro:dial', onScroll)
    }
    // re-measure after a route change: the light section may have just left
  }, [pathname])

  // Close the sheet when the viewport grows past the breakpoint.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const close = () => mq.matches && setOpen(false)
    mq.addEventListener('change', close)
    return () => mq.removeEventListener('change', close)
  }, [])

  const here = activeIndex(pathname)
  const ink = onLight ? '#0C0D10' : '#F4F6F8'
  const paper = onLight ? '#F2F1EC' : '#0C0D10'
  const hair = onLight ? 'border-black/15' : 'border-white/15'
  const veil = onLight ? 'bg-[#E8E7E1]' : 'bg-[#16181C]'
  const muted = onLight ? 'text-black/55 hover:bg-black/10' : 'text-[#C3C8CE]/75 hover:bg-white/15'

  // A bare fixed bar collides with the content it floats over on small screens.
  const barSkin =
    scrolled || open
      ? `${onLight ? 'bg-[#F2F1EC]' : 'bg-[#0C0D10]'} border-b ${
          onLight ? 'border-black/[0.07]' : 'border-white/[0.07]'
        }`
      : 'bg-transparent border-b border-transparent'

  return (
    <header
      className={`hero-anim hero-fade-down fixed top-0 left-0 right-0 z-[100] transition-colors duration-300 ${barSkin}`}
      style={{ animationDelay: '0.1s' }}
    >
      <nav className="flex items-center justify-between p-4 sm:p-5">
        <Link
          to="/"
          className="text-xl sm:text-2xl transition-colors duration-500"
          style={{ color: ink }}
          onClick={() => setOpen(false)}
        >
          <Wordmark tracking="0.24em" />
        </Link>

        <div
          className={`hidden md:flex absolute left-1/2 -translate-x-1/2 ${veil} ${hair} border rounded-full px-2 py-2 items-center gap-1 transition-colors duration-500`}
        >
          {LINKS.map((link, i) =>
            i === here ? (
              <Link
                key={link.label}
                to={link.to}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-500"
                style={{ background: ink, color: paper }}
              >
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className={`${muted} transition-colors px-4 py-1.5 rounded-full text-sm font-medium`}
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            aria-label={count ? `Корзина, ${count} шт.` : 'Корзина'}
            onClick={() => setOpen(false)}
            className="relative p-2.5 transition-colors duration-500 hover:opacity-70"
            style={{ color: ink }}
          >
            <ShoppingBag size={21} strokeWidth={1.4} />
            {count > 0 && (
              <span
                className="figure absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1
                           grid place-items-center rounded-full text-[10px] leading-none
                           transition-colors duration-500"
                style={{ background: ink, color: paper }}
              >
                {count}
              </span>
            )}
          </Link>

          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            className="hidden md:block text-sm font-medium px-6 py-2.5 rounded-full transition-colors duration-500 hover:opacity-80"
            style={{ background: ink, color: paper }}
          >
            Написать
          </a>

          <button
            className="md:hidden -mr-2 p-2 transition-colors duration-500"
            style={{ color: ink }}
            aria-label={open ? 'Закрыть меню' : 'Меню'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </nav>

      {/* mobile sheet */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? 'max-h-[26rem] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`px-4 pb-5 pt-1 border-t ${onLight ? 'border-black/[0.07]' : 'border-white/[0.07]'}`}>
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`block py-3.5 text-base border-b ${
                    onLight ? 'border-black/[0.06] text-black/75' : 'border-white/[0.06] text-[#C3C8CE]'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="mt-5 block text-center text-sm font-medium px-6 py-3.5 rounded-full"
            style={{ background: ink, color: paper }}
          >
            Написать в WhatsApp
          </a>
        </div>
      </div>
    </header>
  )
}
