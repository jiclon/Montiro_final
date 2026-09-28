import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { formatPrice } from '../lib/api'
import { useCart } from '../lib/cart'
import { cleanPhone, orderWhatsappUrl, phoneLooksReal, type Order } from '../lib/order'
import {
  buildPayload,
  createOrder,
  newIdempotencyKey,
  ORDERS,
  OrderError,
  type DeliveryType,
} from '../lib/orders'

const FIELD =
  'w-full bg-white/[0.04] border rounded-2xl text-[15px] text-[#F4F6F8] ' +
  'placeholder:text-[#7C838C] px-5 py-3.5 outline-none transition-colors'

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] tracking-[0.24em] text-[#7C838C] mb-2.5">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-[#C9A86A] mt-2">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-[#7C838C] mt-2">{hint}</p>
      ) : null}
    </div>
  )
}

export default function Checkout() {
  const { lines, total, count, clear } = useCart()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [delivery, setDelivery] = useState<DeliveryType>('delivery')
  const [comment, setComment] = useState('')
  const [tried, setTried] = useState(false)
  const [sending, setSending] = useState(false)
  // Sending empties the cart, which would otherwise trip the guard below and
  // bounce the buyer back to /cart instead of the confirmation.
  const [sent, setSent] = useState(false)
  // Set only when the order did not go through. `refused` means the server
  // looked at it and said no (empty cart, sold out, unknown product) — that is
  // fixed in the cart, not by writing to WhatsApp.
  const [failed, setFailed] = useState<
    { refused: boolean; message: string; order: Order } | null
  >(null)

  // One key per checkout attempt. Pressing the button again after a failure
  // repeats it, so a request that actually reached the server cannot become a
  // second order. It is only minted once, on the first send.
  const idempotencyKey = useRef('')

  useEffect(() => {
    document.title = 'Оформление — MONTIRO'
    return () => {
      document.title = 'MONTIRO — наручные часы'
    }
  }, [])

  // someone opened /checkout with an empty cart, or cleared it in another tab
  useEffect(() => {
    if (count === 0 && !sent) navigate('/cart', { replace: true })
  }, [count, sent, navigate])

  const errors = {
    name: name.trim().length < 2 ? 'Как к вам обращаться?' : '',
    phone: !phoneLooksReal(phone) ? 'Номер нужен целиком — на него придёт счёт' : '',
    address:
      delivery === 'delivery' && address.trim().length < 3 ? 'Куда отправлять — город, адрес?' : '',
  }
  const valid = !errors.name && !errors.phone && !errors.address

  /** The same order, described for a human — used only if the server fails. */
  const asMessage = (): Order => ({
    number: '',
    name: name.trim(),
    phone: cleanPhone(phone),
    city: delivery === 'delivery' ? address.trim() : 'Петропавловск',
    delivery,
    comment: comment.trim(),
    lines,
    total,
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    setFailed(null)
    if (!valid || sending) return

    if (!idempotencyKey.current) idempotencyKey.current = newIdempotencyKey()

    const payload = buildPayload({
      name,
      phone: cleanPhone(phone),
      delivery,
      address,
      comment,
      lines,
      idempotencyKey: idempotencyKey.current,
    })

    // No tab ever opens by itself. With the endpoint switched off the order
    // cannot be placed, and that is said out loud instead of silently
    // redirecting the buyer into a messenger.
    if (!ORDERS.enabled) {
      setFailed({
        refused: false,
        message: 'Оформление на сайте временно недоступно.',
        order: asMessage(),
      })
      return
    }

    setSending(true)
    try {
      const created = await createOrder(payload)
      setSent(true)
      clear()
      navigate('/order', {
        replace: true,
        state: {
          // Both come from the server's answer, with the typed number only as
          // a fallback if the response omits it.
          number: String(created.id),
          phone: created.phone?.trim() || cleanPhone(phone),
          lines,
          total,
          name: created.customer_name?.trim() || name.trim(),
        },
      })
    } catch (err) {
      setFailed({
        // The server's own sentence — «Товара нет в наличии», «Корзина пуста»,
        // «Товар не найден» — shown as it came.
        refused: err instanceof OrderError && err.kind === 'validation',
        message: err instanceof Error ? err.message : 'Сервер не отвечает.',
        order: asMessage(),
      })
    } finally {
      setSending(false)
    }
  }

  const border = (bad: string) =>
    tried && bad ? 'border-[#C9A86A]/60' : 'border-white/15 focus:border-[#C9A86A]/60'

  return (
    <main className="relative z-20 bg-[#0C0D10] min-h-screen">
      <div className="max-w-7xl mx-auto px-5 pt-28 md:pt-36 pb-24 md:pb-32">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm text-[#7C838C] hover:text-[#F4F6F8] transition-colors"
        >
          <ArrowLeft size={16} />
          Корзина
        </Link>

        <p className="text-xs tracking-[0.32em] text-[#7C838C] mt-10">ОФОРМЛЕНИЕ</p>
        <h1 className="t-display text-[#F4F6F8] font-extralight mt-5">Последний шаг</h1>
        <p className="text-[15px] md:text-base text-[#C3C8CE]/60 leading-relaxed max-w-lg mt-6">
          Оплаты на сайте нет. Вы оформляете заказ, я выставляю счёт в Kaspi на указанный номер —
          деньги спишутся, только когда вы сами подтвердите его в приложении.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mt-12 items-start">
          <form onSubmit={submit} noValidate className="lg:col-span-7 min-w-0 space-y-7">
            <Field id="name" label="ВАШЕ ИМЯ" error={tried ? errors.name : ''}>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Ерасыл"
                className={`${FIELD} ${border(errors.name)}`}
              />
            </Field>

            <Field
              id="phone"
              label="НОМЕР KASPI"
              hint="На этот номер придёт счёт в Kaspi"
              error={tried ? errors.phone : ''}
            >
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="+7 705 000 00 00"
                className={`${FIELD} ${border(errors.phone)}`}
              />
            </Field>

            <div>
              <p className="text-[11px] tracking-[0.24em] text-[#7C838C] mb-2.5">ПОЛУЧЕНИЕ</p>
              <div className="flex flex-col sm:flex-row gap-3">
                {(
                  [
                    ['delivery', 'Доставка по Казахстану', '2–5 дней, трек в WhatsApp'],
                    ['pickup', 'Самовывоз', 'Встретимся в Петропавловске'],
                  ] as const
                ).map(([key, title, note]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDelivery(key)}
                    aria-pressed={delivery === key}
                    className={`flex-1 text-left rounded-2xl border px-5 py-4 transition-colors ${
                      delivery === key
                        ? 'border-[#C9A86A]/60 bg-white/[0.05]'
                        : 'border-white/15 hover:border-white/30'
                    }`}
                  >
                    <span className="block text-[15px] text-[#F4F6F8]">{title}</span>
                    <span className="block text-[13px] text-[#7C838C] mt-1">{note}</span>
                  </button>
                ))}
              </div>
            </div>

            {delivery === 'delivery' && (
              <Field
                id="address"
                label="АДРЕС ДОСТАВКИ"
                hint="Город, улица, дом — куда отправлять посылку."
                error={tried ? errors.address : ''}
              >
                <input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                  placeholder="Астана, Кабанбай батыра 12, кв. 40"
                  className={`${FIELD} ${border(errors.address)}`}
                />
              </Field>
            )}

            <Field id="comment" label="КОММЕНТАРИЙ" hint="Необязательно.">
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Например: нужен подарочный пакет"
                className={`${FIELD} ${border('')} resize-none`}
              />
            </Field>

            <p className="text-[13px] md:text-sm text-[#C3C8CE]/60 leading-relaxed max-w-md">
              После оформления я отправлю счёт на ваш номер Kaspi. Подтвердите оплату в
              приложении — и я отправлю заказ.
            </p>

            <button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-10 py-4 rounded-full hover:bg-[#C9A86A] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-wait"
            >
              {sending ? 'Отправляю…' : 'Оформить заказ'}
            </button>

            {/* Two different failures. The server refusing the order is not the
                server being unreachable, and they do not deserve the same
                answer. Nothing here opens by itself. */}
            {failed &&
              (failed.refused ? (
                <div className="border border-[#C9A86A]/40 rounded-3xl p-6 md:p-8">
                  <h2 className="text-xl font-light text-[#F4F6F8]">Заказ не принят</h2>
                  <p className="text-[14px] text-[#C3C8CE]/65 leading-relaxed mt-3">
                    {failed.message}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Link
                      to="/cart"
                      className="text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors"
                    >
                      Открыть корзину
                    </Link>
                    <button
                      type="submit"
                      disabled={sending}
                      className="text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors disabled:opacity-60"
                    >
                      Попробовать снова
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-[#C9A86A]/40 rounded-3xl p-6 md:p-8">
                  <h2 className="text-xl font-light text-[#F4F6F8]">Не удалось оформить заказ</h2>
                  <p className="text-[14px] text-[#C3C8CE]/65 leading-relaxed mt-3">
                    {failed.message} Заказ никуда не пропал — отправьте его мне готовым
                    сообщением, я оформлю руками и выставлю счёт.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <a
                      href={orderWhatsappUrl(failed.order)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors"
                    >
                      Написать в WhatsApp
                    </a>
                    <button
                      type="submit"
                      disabled={sending}
                      className="text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors disabled:opacity-60"
                    >
                      Попробовать снова
                    </button>
                  </div>
                </div>
              ))}
          </form>

          {/* ── what is being ordered ───────────────────────────── */}
          <aside className="lg:col-span-5 min-w-0 lg:sticky lg:top-28">
            <div className="border border-white/10 rounded-3xl p-7 md:p-9">
              <p className="text-xs tracking-[0.24em] text-[#7C838C]">ЗАКАЗ</p>
              <ul className="mt-5 border-t border-white/[0.09]">
                {lines.map((l) => (
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
                <span className="figure text-2xl font-light text-[#F4F6F8]">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="text-[13px] text-[#7C838C] leading-relaxed mt-5">
                Без доставки — её посчитаю по тарифу службы и назову до выставления счёта.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
