import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatPrice, gallery, type Product } from '../lib/api'
import { WHATSAPP } from '../lib/contacts'
import { useCart } from '../lib/cart'
import { useProduct } from '../hooks/useProducts'
import fallbackPhoto from '../assets/watch-still.jpg'

const PLATE_BG = 'radial-gradient(ellipse at 50% 42%, #0A0B0D 0%, #050607 76%)'

/** Keeps a wild photo from making the plate absurdly tall or wide. */
const MIN_RATIO = 0.62
const MAX_RATIO = 1.7
const DEFAULT_RATIO = 0.8
const clampRatio = (r: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, r))

function Gallery({ product }: { product: Product }) {
  const shots = gallery(product)
  const [index, setIndex] = useState(0)
  const [broken, setBroken] = useState<Record<number, boolean>>({})
  // The plate takes the shape of the photo in it, so there is no black margin
  // to look at. Measured on load, remembered per photo.
  const [ratios, setRatios] = useState<Record<number, number>>({})
  const touch = useRef<{ x: number; y: number } | null>(null)

  const count = Math.max(1, shots.length)
  const src = shots.length === 0 || broken[index] ? fallbackPhoto : shots[index]
  const ratio = clampRatio(ratios[index] ?? DEFAULT_RATIO)

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  )

  // Photos may load in any order; index 0 must not inherit index 2's shape.
  const measure = (i: number) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    if (w > 0 && h > 0) setRatios((r) => (r[i] ? r : { ...r, [i]: w / h }))
  }

  const arrow =
    'absolute top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full ' +
    'bg-[#0C0D10]/65 backdrop-blur-sm border border-white/15 text-[#F4F6F8] ' +
    'hover:bg-[#0C0D10]/85 hover:border-[#C9A86A]/60 hover:text-[#C9A86A] transition-colors'

  return (
    <div>
      <div
        role="group"
        aria-roledescription="галерея"
        aria-label={`Фотографии: ${product.brand} ${product.name}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (count < 2) return
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
          if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
        }}
        // Swipe, but only a horizontal one — a vertical drag is the page
        // scrolling and must not flip the photo.
        onPointerDown={(e) => { touch.current = { x: e.clientX, y: e.clientY } }}
        onPointerUp={(e) => {
          const start = touch.current
          touch.current = null
          if (!start || count < 2) return
          const dx = e.clientX - start.x
          const dy = e.clientY - start.y
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
        }}
        className="group relative mx-auto rounded-2xl overflow-hidden border border-white/10 outline-none focus-visible:border-[#C9A86A]/60"
        style={{
          background: PLATE_BG,
          aspectRatio: String(ratio),
          // as large as the column allows, but never taller than the screen
          width: `min(100%, calc(78vh * ${ratio}))`,
        }}
      >
        {/* The plate is cut to the photo's own shape, so `object-contain` fills
            it edge to edge: everything is visible and nothing is framed in
            black. The elliptical mask that used to live here ate the corners
            of real photographs. */}
        <img
          key={src}
          src={src}
          alt={`${product.brand} ${product.name}`}
          onLoad={measure(index)}
          onError={() => setBroken((b) => ({ ...b, [index]: true }))}
          className="shot w-full h-full object-contain select-none"
          draggable={false}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Предыдущее фото"
              className={`${arrow} left-3`}
            >
              <ChevronLeft size={19} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Следующее фото"
              className={`${arrow} right-3`}
            >
              <ChevronRight size={19} />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {shots.map((shot, i) => (
                <button
                  key={`dot-${shot}-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Фото ${i + 1} из ${count}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-6 bg-[#C9A86A]' : 'w-1.5 bg-white/35 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {shots.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide">
          {shots.map((shot, i) => (
            <button
              key={shot + i}
              onClick={() => setIndex(i)}
              aria-label={`Фото ${i + 1}`}
              className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden border transition-colors ${
                i === index ? 'border-[#C9A86A]/60' : 'border-white/10 hover:border-white/30'
              }`}
              style={{ background: PLATE_BG }}
            >
              <img
                src={broken[i] ? fallbackPhoto : shot}
                alt=""
                loading="lazy"
                onLoad={measure(i)}
                onError={() => setBroken((b) => ({ ...b, [i]: true }))}
                className="w-full h-full object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative z-20 bg-[#0C0D10] min-h-screen">
      <div className="max-w-7xl mx-auto px-5 pt-28 md:pt-36 pb-24 md:pb-32">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm text-[#7C838C] hover:text-[#F4F6F8] transition-colors"
        >
          <ArrowLeft size={16} />
          Каталог
        </Link>
        {children}
      </div>
    </main>
  )
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const { product, loading, error, retry } = useProduct(id)
  const { add, has } = useCart()
  const navigate = useNavigate()

  /** Adds the watch if it is not already in the cart, then opens the form. */
  const buyNow = () => {
    if (!product) return
    if (!has(product.id)) add(product)
    navigate('/checkout')
  }

  useEffect(() => {
    if (product) document.title = `${product.brand} ${product.name} — MONTIRO`
    return () => {
      document.title = 'MONTIRO — наручные часы'
    }
  }, [product])

  if (loading) {
    return (
      <Shell>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mt-10 animate-pulse">
          <div className="md:col-span-7 min-w-0">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] h-[340px] sm:h-[440px] md:h-[560px]" />
          </div>
          <div className="md:col-span-5 min-w-0 space-y-5">
            <div className="h-3 w-24 bg-white/[0.06] rounded" />
            <div className="h-10 w-56 bg-white/[0.06] rounded" />
            <div className="h-6 w-40 bg-white/[0.05] rounded" />
            <div className="h-24 w-full bg-white/[0.04] rounded" />
          </div>
        </div>
        <p className="text-sm text-[#7C838C] mt-10">
          Загружаю. Сервер мог уснуть — первая загрузка занимает до минуты.
        </p>
      </Shell>
    )
  }

  if (error || !product) {
    const missing = error === 'notfound'
    return (
      <Shell>
        <div className="border border-white/10 rounded-3xl p-8 md:p-12 mt-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-light text-[#F4F6F8]">
            {missing ? 'Такой модели нет' : 'Не удалось загрузить модель'}
          </h1>
          <p className="text-[15px] text-[#C3C8CE]/60 leading-relaxed mt-4">
            {missing
              ? 'Возможно, её уже забрали. Посмотрите, что есть сейчас, или напишите — подберу похожее.'
              : 'Скорее всего сервер уснул и не успел проснуться. Попробуйте ещё раз через минуту.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            {!missing && (
              <button
                onClick={retry}
                className="text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors"
              >
                Попробовать снова
              </button>
            )}
            <Link
              to="/catalog"
              className={`text-center text-sm px-8 py-3.5 rounded-full transition-colors ${
                missing
                  ? 'bg-[#F4F6F8] text-[#0C0D10] hover:bg-[#C9A86A]'
                  : 'border border-white/20 text-[#F4F6F8] hover:border-[#C9A86A]/70 hover:text-[#C9A86A]'
              }`}
            >
              В каталог
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
      </Shell>
    )
  }

  const specs = [
    { label: 'Механизм', value: product.mechanism },
    { label: 'Корпус', value: product.case_material },
    { label: 'Ремень', value: product.strap_material },
    { label: 'Категория', value: product.category },
  ].filter((s) => s.value)

  return (
    <Shell>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start mt-10">
        <div className="md:col-span-7 min-w-0">
          <Gallery product={product} />
        </div>

        <div className="md:col-span-5 min-w-0 md:pl-4 lg:pl-8">
          {product.brand && (
            <p className="text-xs tracking-[0.3em] text-[#7C838C]">{product.brand.toUpperCase()}</p>
          )}

          <h1
            className="t-display font-extralight text-[#F4F6F8] mt-3 break-words"
          >
            {product.name}
          </h1>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3 mt-6">
            <span className="figure text-2xl md:text-3xl font-light text-[#F4F6F8]">
              {formatPrice(product.price)}
            </span>
            {product.old_price && (
              <span className="figure text-lg text-[#7C838C]/70 line-through">
                {formatPrice(product.old_price)}
              </span>
            )}
            <span
              className={`text-[11px] tracking-[0.2em] px-3 py-1 rounded-full border ${
                product.in_stock
                  ? 'text-[#C3C8CE]/75 border-white/20'
                  : 'text-[#7C838C] border-white/10'
              }`}
            >
              {product.in_stock ? 'В НАЛИЧИИ' : 'ПОД ЗАКАЗ'}
            </span>
          </div>

          {product.description && (
            <p className="text-[15px] md:text-base text-[#C3C8CE]/65 leading-relaxed mt-7">
              {product.description}
            </p>
          )}

          {specs.length > 0 && (
            <dl className="mt-9 border-t border-white/[0.09]">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6 py-4 border-b border-white/[0.09]"
                >
                  <dt className="text-xs tracking-[0.2em] text-[#7C838C] shrink-0">
                    {s.label.toUpperCase()}
                  </dt>
                  <dd className="text-sm md:text-base text-[#C3C8CE] sm:text-right min-w-0 break-words">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-9">
            {/* Straight to the form. Anything already in the cart comes along —
                the buyer is buying, not starting a second order. */}
            <button
              onClick={buyNow}
              className="text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-all hover:scale-[1.02] active:scale-95"
            >
              Купить сейчас
            </button>
            <button
              onClick={() => add(product)}
              className="text-center text-sm px-8 py-3.5 rounded-full border border-white/20 text-[#F4F6F8] hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors"
            >
              {has(product.id) ? 'Добавить ещё' : 'В корзину'}
            </button>
          </div>

          <Link
            to={has(product.id) ? '/cart' : '/catalog'}
            className="inline-block text-[13px] text-[#7C838C] hover:text-[#C9A86A] transition-colors mt-5"
          >
            {has(product.id) ? 'Перейти в корзину' : 'Весь каталог'}
          </Link>

          <p className="text-[13px] text-[#7C838C] leading-relaxed mt-6">
            Оплата через Kaspi: оформляете заказ, я выставляю счёт на ваш номер, вы
            подтверждаете его в приложении — и я отправляю.
          </p>

          {/* Said on the page where the buyer decides, not only in the footer. */}
          <p className="text-[13px] text-[#7C838C] leading-relaxed mt-4 pt-4 border-t border-white/[0.09]">
            Реплика, не оригинальная продукция бренда. Не выдаю за оригинал и не продаю с
            документами оригинала — <Link to="/help#about" className="underline decoration-white/20 underline-offset-4 hover:text-[#C9A86A]">подробнее</Link>.
          </p>
        </div>
      </div>
    </Shell>
  )
}
