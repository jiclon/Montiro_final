import { useState } from 'react'
import { Link } from 'react-router-dom'
import useReveal from '../hooks/useReveal'
import { DIAL_WHITE } from './Hero'
import { formatPrice, type Product } from '../lib/api'
import { useProducts } from '../hooks/useProducts'
import { WHATSAPP } from '../lib/contacts'
import watchStill from '../assets/watch-still.jpg'

/**
 * Placeholder shown while the API is waking up, or if it never answers.
 * The section must never collapse into an empty white screen — it is the
 * inside of the dial, the first thing the scroll transition lands on.
 */
const PLACEHOLDER: Product = {
  id: '',
  brand: 'Montiro',
  name: 'Type 01',
  price: 46000,
  category: '',
  in_stock: true,
  image: '',
  images: [],
  old_price: null,
  description:
    'Тонкий стальной корпус 38 мм, белый циферблат без лишних надписей, чёрный ремень из натуральной кожи. Модель, которая одинаково спокойно смотрится с рубашкой и с футболкой.',
  mechanism: 'Кварцевый',
  case_material: 'Сталь 316L, 38 мм',
  strap_material: 'Натуральная кожа',
}

/** First one in stock, else whatever came back first. */
function pick(products: Product[]): Product | null {
  if (products.length === 0) return null
  return products.find((p) => p.in_stock) ?? products[0]
}

export default function Featured() {
  const head = useReveal<HTMLDivElement>(0.25)
  const media = useReveal<HTMLDivElement>(0.2)
  const body = useReveal<HTMLDivElement>(0.2)

  const { products, loading } = useProducts()
  const live = pick(products)
  const p = live ?? PLACEHOLDER

  const [broken, setBroken] = useState(false)
  const photo = !p.image || broken ? watchStill : p.image

  const specs = [
    { label: 'Механизм', value: p.mechanism },
    { label: 'Корпус', value: p.case_material },
    { label: 'Ремень', value: p.strap_material },
  ].filter((s) => s.value)

  return (
    <section
      id="featured"
      className="relative z-10 text-[#0C0D10]"
      style={{ background: DIAL_WHITE }}
    >
      <div className="max-w-7xl mx-auto px-5 pt-8 pb-20 md:pt-14 md:pb-36">
        <div ref={head.ref} className={`hero-anim ${head.inView ? 'hero-fade' : ''} text-center`}>
          <p className="text-[11px] tracking-[0.42em] text-[#0C0D10]/40">МОДЕЛЬ МЕСЯЦА</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center mt-8 md:mt-14">
          {/* ── the piece ───────────────────────────────────────────── */}
          <div ref={media.ref} className="md:col-span-6 min-w-0">
            <div
              className={`img-anim ${media.inView ? 'img-reveal' : ''} relative rounded-[28px] overflow-hidden`}
              style={{ background: 'radial-gradient(ellipse at 50% 42%, #16181C 0%, #08090B 74%)' }}
            >
              {/* A real catalog photo lands here, so no edge mask — it would
                  cut the corners off. See ProductPage. */}
              <div className="h-[300px] sm:h-[400px] md:h-[560px] flex items-center justify-center p-5 md:p-7">
                <img
                  src={photo}
                  alt={`${p.brand} ${p.name}`}
                  loading="lazy"
                  onError={() => setBroken(true)}
                  className="max-h-full max-w-full w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* ── the details ─────────────────────────────────────────── */}
          <div
            ref={body.ref}
            className={`md:col-span-6 min-w-0 md:pl-6 lg:pl-12 hero-anim ${body.inView ? 'hero-fade' : ''}`}
            style={{ animationDelay: '0.12s' }}
          >
            {p.brand && (
              <p className="text-xs tracking-[0.3em] text-[#0C0D10]/45">{p.brand.toUpperCase()}</p>
            )}

            <h2
              className="font-extralight text-4xl sm:text-6xl md:text-7xl mt-3 leading-[1.02] break-words"
              style={{ letterSpacing: '-0.03em' }}
            >
              {p.name}
            </h2>

            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3 mt-6">
              <span className="figure text-2xl md:text-3xl font-light">{formatPrice(p.price)}</span>
              {p.old_price ? (
                <span className="figure text-lg text-[#0C0D10]/35 line-through">
                  {formatPrice(p.old_price)}
                </span>
              ) : null}
              <span
                className={`text-[11px] tracking-[0.2em] px-3 py-1 rounded-full border ${
                  p.in_stock
                    ? 'text-[#0C0D10]/60 border-[#0C0D10]/20'
                    : 'text-[#0C0D10]/35 border-[#0C0D10]/12'
                }`}
              >
                {p.in_stock ? 'В НАЛИЧИИ' : 'ПОД ЗАКАЗ'}
              </span>
            </div>

            {p.description && (
              <p className="text-[15px] md:text-lg text-[#0C0D10]/65 leading-relaxed mt-6 md:mt-8 max-w-none md:max-w-md">
                {p.description}
              </p>
            )}

            {specs.length > 0 && (
              <dl className="mt-8 md:mt-10 border-t border-[#0C0D10]/12">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6 py-4 border-b border-[#0C0D10]/12"
                  >
                    <dt className="text-xs tracking-[0.2em] text-[#0C0D10]/40 shrink-0">
                      {spec.label.toUpperCase()}
                    </dt>
                    <dd className="text-sm md:text-base sm:text-right min-w-0 break-words">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8 md:mt-10">
              {live ? (
                <Link
                  to={`/product/${live.id}`}
                  className="text-center bg-[#0C0D10] text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:bg-[#262A30] transition-all hover:scale-[1.03] active:scale-95"
                >
                  Смотреть модель
                </Link>
              ) : (
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noreferrer"
                  className="text-center bg-[#0C0D10] text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:bg-[#262A30] transition-all hover:scale-[1.03] active:scale-95"
                >
                  Заказать
                </a>
              )}
              <Link
                to="/catalog"
                className="text-center border border-[#0C0D10]/20 text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:border-[#0C0D10]/50 transition-colors"
              >
                Весь каталог
              </Link>
            </div>

            {loading && (
              <p className="text-[13px] text-[#0C0D10]/40 mt-6">Обновляю наличие с сервера…</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
