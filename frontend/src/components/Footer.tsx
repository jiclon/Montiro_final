import { Link } from 'react-router-dom'
import useReveal from '../hooks/useReveal'
import Wordmark from './Wordmark'
import { INSTAGRAM, TIKTOK, WHATSAPP, WHATSAPP_SECOND } from '../lib/contacts'

/**
 * Every link here goes somewhere real. They used to all point at `#catalog`,
 * which went nowhere, and the shop column listed hardcoded categories — those
 * belong on the catalog page, built from the data.
 */
type Item = { label: string; to?: string; href?: string }

const COLUMNS: { title: string; links: Item[] }[] = [
  {
    title: 'Магазин',
    links: [
      { label: 'Главная', to: '/' },
      { label: 'Каталог', to: '/catalog' },
      { label: 'О товаре', to: '/help#about' },
    ],
  },
  {
    title: 'Покупателю',
    links: [
      { label: 'Как заказать', to: '/help#payment' },
      { label: 'Доставка', to: '/help#delivery' },
      { label: 'Оплата', to: '/help#payment' },
      { label: 'Гарантия', to: '/help#warranty' },
      { label: 'Обмен и возврат', to: '/help#return' },
      { label: 'Конфиденциальность', to: '/privacy' },
    ],
  },
  {
    title: 'Связь',
    links: [
      { label: 'WhatsApp +7 705 912 6313', href: WHATSAPP },
      { label: 'WhatsApp +7 776 139 9741', href: WHATSAPP_SECOND },
      { label: 'Instagram', href: INSTAGRAM },
      { label: 'TikTok', href: TIKTOK },
    ],
  },
]

export default function Footer() {
  const giant = useReveal<HTMLDivElement>(0.2)

  return (
    <footer className="overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 pt-16 md:pt-28">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-10 pb-12 md:pb-16">
          <div className="col-span-2 md:col-span-4">
            <Link to="/" className="text-[#F4F6F8] text-2xl inline-block">
              <Wordmark tracking="0.24em" />
            </Link>
            <p className="text-[10px] tracking-[0.42em] text-[#7C838C]/70 mt-3 ml-1">WATCH</p>
            <p className="text-[#7C838C] text-sm leading-relaxed mt-6 max-w-xs">
              Наручные часы. Петропавловск, Казахстан. Доставка по всей стране.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div
              key={column.title}
              className={
                column.title === 'Связь'
                  ? 'col-span-2 md:col-span-4'
                  : 'col-span-1 md:col-span-2'
              }
            >
              <p className="text-xs tracking-[0.2em] text-[#7C838C]/70 mb-5">{column.title}</p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-[#C3C8CE]/70 hover:text-[#C9A86A] transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#C3C8CE]/70 hover:text-[#C9A86A] transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6 border-t border-white/[0.09]">
          <p className="text-xs text-[#7C838C]/70">© 2026 Montiro</p>
          <p className="text-xs text-[#7C838C]/70">Реплики. Не оригинальная продукция брендов.</p>
        </div>
      </div>

      <div ref={giant.ref} className="relative h-[22vw] sm:h-[17vw]" aria-hidden="true">
        <span
          className={`wordmark-giant hero-anim ${giant.inView ? 'hero-rise' : ''} absolute left-1/2 -translate-x-1/2 top-0 text-[20vw] sm:text-[15vw] leading-[0.82] text-[#C3C8CE]/[0.08] whitespace-nowrap select-none`}
        >
          <Wordmark tracking="0.03em" />
        </span>
      </div>
    </footer>
  )
}
