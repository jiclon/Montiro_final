import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, X } from 'lucide-react'
import { formatPrice } from '../lib/api'
import { useCart, type Line } from '../lib/cart'
import { useProducts } from '../hooks/useProducts'
import fallbackPhoto from '../assets/watch-still.jpg'

function Thumb({ line }: { line: Line }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="card-plate shrink-0 w-24 sm:w-28 rounded-2xl overflow-hidden border border-white/10">
      <div className="h-full flex items-center justify-center p-2">
        <img
          src={!line.image || broken ? fallbackPhoto : line.image}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className="max-h-full max-w-full w-auto object-contain"
        />
      </div>
    </div>
  )
}

function Stepper({ line }: { line: Line }) {
  const { setQty } = useCart()
  const btn =
    'w-9 h-9 grid place-items-center rounded-full border border-white/15 text-[#C3C8CE] ' +
    'hover:border-white/35 hover:text-[#F4F6F8] transition-colors disabled:opacity-35 ' +
    'disabled:hover:border-white/15 disabled:cursor-not-allowed'
  return (
    <div className="flex items-center gap-2">
      <button
        className={btn}
        onClick={() => setQty(line.id, line.qty - 1)}
        aria-label="Убрать одну"
        disabled={line.qty <= 1}
      >
        <Minus size={15} />
      </button>
      <span className="figure w-6 text-center text-[#F4F6F8]">{line.qty}</span>
      <button
        className={btn}
        onClick={() => setQty(line.id, line.qty + 1)}
        aria-label="Добавить одну"
        disabled={line.qty >= 9}
      >
        <Plus size={15} />
      </button>
    </div>
  )
}

export default function Cart() {
  const { lines, total, count, remove } = useCart()
  const { products } = useProducts()

  useEffect(() => {
    document.title = 'Корзина — MONTIRO'
    return () => {
      document.title = 'MONTIRO — наручные часы'
    }
  }, [])

  // A cart can sit for a week. Prices and stock come from the API every time
  // this page opens, so nothing is ordered at a price that no longer exists.
  const live = new Map(products.map((p) => [p.id, p]))
  const changed = lines.filter((l) => {
    const p = live.get(l.id)
    return p && p.price !== l.price
  })
  const gone = lines.filter((l) => live.size > 0 && !live.has(l.id))
  const backorder = lines.filter((l) => live.get(l.id)?.in_stock === false)

  return (
    <main className="relative z-20 bg-[#0C0D10] min-h-screen">
      <div className="max-w-7xl mx-auto px-5 pt-28 md:pt-36 pb-24 md:pb-32">
        <p className="text-xs tracking-[0.32em] text-[#7C838C]">КОРЗИНА</p>
        <h1 className="t-display text-[#F4F6F8] font-extralight mt-5">
          {count === 0 ? 'Пока пусто' : 'Ваш выбор'}
        </h1>

        {count === 0 ? (
          <>
            <p className="text-[15px] md:text-base text-[#C3C8CE]/60 leading-relaxed max-w-md mt-6">
              Добавьте модель из каталога — или напишите, и я подберу под запрос.
            </p>
            <Link
              to="/catalog"
              className="inline-block text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors mt-8"
            >
              В каталог
            </Link>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mt-10 md:mt-14 items-start">
            {/* ── lines ──────────────────────────────────────────── */}
            <ul className="lg:col-span-7 min-w-0 border-t border-white/[0.09]">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="flex gap-4 sm:gap-6 py-6 border-b border-white/[0.09]"
                >
                  <Link to={`/product/${line.id}`} className="shrink-0">
                    <Thumb line={line} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {line.brand && (
                          <p className="text-[11px] tracking-[0.24em] text-[#7C838C]">
                            {line.brand.toUpperCase()}
                          </p>
                        )}
                        <Link
                          to={`/product/${line.id}`}
                          className="block text-lg font-light text-[#F4F6F8] mt-1.5 hover:text-[#C9A86A] transition-colors break-words"
                        >
                          {line.name}
                        </Link>
                      </div>
                      <button
                        onClick={() => remove(line.id)}
                        aria-label="Убрать из корзины"
                        className="shrink-0 -mt-1 p-2 text-[#7C838C] hover:text-[#F4F6F8] transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {live.get(line.id)?.in_stock === false && (
                      <p className="text-[11px] tracking-[0.2em] text-[#7C838C] mt-2">ПОД ЗАКАЗ</p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                      <Stepper line={line} />
                      <span className="figure text-base text-[#C3C8CE]">
                        {formatPrice(line.price * line.qty)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* ── total ──────────────────────────────────────────── */}
            <aside className="lg:col-span-5 min-w-0 lg:sticky lg:top-28">
              <div className="border border-white/10 rounded-3xl p-7 md:p-9">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-[#7C838C]">
                    {count} {count === 1 ? 'позиция' : count < 5 ? 'позиции' : 'позиций'}
                  </span>
                  <span className="figure text-2xl font-light text-[#F4F6F8]">
                    {formatPrice(total)}
                  </span>
                </div>

                <p className="text-[13px] text-[#7C838C] leading-relaxed mt-5">
                  Доставку посчитаю при подтверждении — она зависит только от тарифа службы.
                  Оплата после согласования, счётом в Kaspi.
                </p>

                <Link
                  to="/checkout"
                  className="block text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-all hover:scale-[1.02] active:scale-95 mt-7"
                >
                  Оформить заказ
                </Link>
                <Link
                  to="/catalog"
                  className="block text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors mt-3"
                >
                  Продолжить выбор
                </Link>
              </div>

              {(changed.length > 0 || gone.length > 0 || backorder.length > 0) && (
                <div className="text-[13px] text-[#C3C8CE]/60 leading-relaxed mt-6 space-y-2">
                  {changed.length > 0 && (
                    <p>
                      Цена изменилась с момента, как вы добавили:{' '}
                      {changed.map((l) => l.name).join(', ')}. Актуальную назову при
                      подтверждении.
                    </p>
                  )}
                  {gone.length > 0 && (
                    <p>Уже нет в каталоге: {gone.map((l) => l.name).join(', ')}.</p>
                  )}
                  {backorder.length > 0 && (
                    <p>Под заказ, привезу: {backorder.map((l) => l.name).join(', ')}.</p>
                  )}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
