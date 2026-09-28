import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatPrice } from '../lib/api'
import type { Line } from '../lib/cart'
import { WHATSAPP } from '../lib/contacts'

/**
 * Handed over by the checkout after POST /orders answered. `number` and
 * `phone` are the server's values — this screen reads the order back, it does
 * not repeat the form.
 */
type Placed = {
  number: string
  phone: string
  name: string
  lines: Line[]
  total: number
}

/** Small, and never the next step — just a way to ask. */
function AskLink() {
  return (
    <p className="text-[13px] text-[#7C838C] mt-8">
      Есть вопрос?{' '}
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noreferrer"
        className="text-[#C3C8CE] underline decoration-white/20 underline-offset-4 hover:text-[#C9A86A] hover:decoration-[#C9A86A]/60 transition-colors"
      >
        Напишите нам
      </a>
    </p>
  )
}

export default function OrderPlaced() {
  const { state } = useLocation()
  const placed = (state ?? null) as Placed | null

  useEffect(() => {
    document.title = placed?.number
      ? `Заказ №${placed.number} — MONTIRO`
      : 'Заказ принят — MONTIRO'
    return () => {
      document.title = 'MONTIRO — наручные часы'
    }
  }, [placed])

  return (
    <main className="relative z-20 bg-[#0C0D10] min-h-screen">
      <div className="max-w-7xl mx-auto px-5 pt-28 md:pt-36 pb-24 md:pb-32">
        <p className="text-xs tracking-[0.32em] text-[#7C838C]">MONTIRO</p>

        {/* The details live in navigation state, so a reload loses them. The
            order itself is already placed; only this screen forgets. */}
        {placed ? (
          <>
            <h1 className="t-display text-[#F4F6F8] font-extralight mt-5">
              Заказ{' '}
              {placed.number && <span className="figure">№{placed.number}</span>} принят
            </h1>

            <p className="text-[15px] md:text-base text-[#C3C8CE]/75 leading-relaxed max-w-lg mt-6">
              В течение часа пришлём счёт Kaspi на номер{' '}
              <span className="figure text-[#F4F6F8]">{placed.phone}</span>. После оплаты
              отправим заказ.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mt-12 items-start">
              <aside className="lg:col-span-6 min-w-0">
                <div className="border border-white/10 rounded-3xl p-7 md:p-9">
                  <p className="text-xs tracking-[0.24em] text-[#7C838C]">ЗАКАЗ</p>
                  <ul className="mt-5 border-t border-white/[0.09]">
                    {placed.lines.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-baseline justify-between gap-4 py-3.5 border-b border-white/[0.09]"
                      >
                        <span className="text-sm text-[#C3C8CE] min-w-0 break-words">
                          {[l.brand, l.name].filter(Boolean).join(' ')}
                          {l.qty > 1 && <span className="text-[#7C838C]"> × {l.qty}</span>}
                        </span>
                        <span className="figure text-sm text-[#C3C8CE] shrink-0">
                          {formatPrice(l.price * l.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-baseline justify-between gap-4 mt-5">
                    <span className="text-sm text-[#7C838C]">Итого</span>
                    <span className="figure text-xl font-light text-[#F4F6F8]">
                      {formatPrice(placed.total)}
                    </span>
                  </div>

                  <dl className="mt-6 space-y-2.5 text-sm">
                    {[
                      ['Имя', placed.name],
                      ['Номер Kaspi', placed.phone],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-[#7C838C] shrink-0">{label}</dt>
                        <dd className="text-[#C3C8CE] text-right min-w-0 break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </aside>

              <div className="lg:col-span-6 min-w-0">
                <Link
                  to="/catalog"
                  className="inline-block text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors"
                >
                  Вернуться в каталог
                </Link>
                <p className="text-[13px] text-[#7C838C] leading-relaxed mt-6 max-w-sm">
                  Пока вы не подтвердите счёт в Kaspi, деньги не спишутся.
                </p>
                <AskLink />
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="t-display text-[#F4F6F8] font-extralight mt-5">Заказ принят</h1>
            <p className="text-[15px] md:text-base text-[#C3C8CE]/75 leading-relaxed max-w-lg mt-6">
              Детали этого экрана живут только до перезагрузки, но сам заказ уже принят. В течение
              часа пришлём счёт Kaspi на указанный номер. После оплаты отправим заказ.
            </p>
            <div className="mt-8">
              <Link
                to="/catalog"
                className="inline-block text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors"
              >
                Вернуться в каталог
              </Link>
            </div>
            <AskLink />
          </>
        )}
      </div>
    </main>
  )
}
