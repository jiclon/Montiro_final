import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { formatPrice, type Product } from '../../lib/api'
import { useProducts } from '../../hooks/useProducts'
import {
  ADMIN,
  DEFAULT_ORDER_TAB,
  fetchOrders,
  ORDER_STATUSES,
  ORDER_TABS,
  setOrderStatus,
  statusLabel,
  tabById,
  type AdminOrder,
} from '../../lib/admin'
import { useAuth } from '../../lib/auth'
import { NotReady } from './AdminShell'

/** Keys are exactly what the backend stores — note `canceled`, one L. */
const TONE: Record<string, string> = {
  new: 'text-[#C9A86A] border-[#C9A86A]/50',
  awaiting: 'text-[#C3C8CE] border-white/25',
  paid: 'text-[#F4F6F8] border-white/40',
  shipped: 'text-[#F4F6F8] border-white/40',
  done: 'text-[#7C838C] border-white/15',
  canceled: 'text-[#7C838C] border-white/10 line-through',
}

function when(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Row({
  order,
  byId,
  onChanged,
}: {
  order: AdminOrder
  byId: Map<string, Product>
  onChanged: (next: AdminOrder) => void
}) {
  const { guard } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // The order stores ids and quantities; the names and prices come from the
  // catalog, so the total is whatever those products cost right now.
  const lines = order.items.map((it) => {
    const p = byId.get(String(it.product_id))
    return {
      id: String(it.product_id),
      title: p ? [p.brand, p.name].filter(Boolean).join(' ') : `Товар #${it.product_id}`,
      price: p?.price ?? null,
      qty: it.quantity,
    }
  })
  const total = lines.reduce((sum, l) => sum + (l.price ?? 0) * l.qty, 0)
  const priced = lines.every((l) => l.price !== null)

  const change = async (status: string) => {
    if (!ADMIN.orderStatus || status === order.status) return
    setBusy(true)
    setError('')
    try {
      const next = await guard((token) => setOrderStatus(token, String(order.id), status))
      onChanged(next?.id ? next : { ...order, status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сменить статус.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="border-b border-white/[0.09]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full text-left flex flex-wrap items-center gap-x-5 gap-y-2 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <span className="figure text-sm text-[#7C838C] w-14 shrink-0">№{order.id}</span>
        <span className="text-[15px] text-[#F4F6F8] min-w-0 flex-1 break-words">
          {order.customer_name}
          <span className="figure text-[#7C838C]"> · {order.phone}</span>
        </span>
        <span className="figure text-sm text-[#C3C8CE] shrink-0">
          {priced ? formatPrice(total) : '—'}
        </span>
        <span className="text-[13px] text-[#7C838C] w-24 text-right shrink-0">
          {when(order.created_at)}
        </span>
        <span
          className={`text-[11px] tracking-[0.16em] px-3 py-1 rounded-full border shrink-0 ${
            TONE[order.status] ?? 'text-[#C3C8CE] border-white/20'
          }`}
        >
          {statusLabel(order.status).toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="pb-6 pl-0 sm:pl-14">
          <ul className="border-t border-white/[0.06]">
            {lines.map((l, i) => (
              <li
                key={`${l.id}-${i}`}
                className="flex items-baseline justify-between gap-4 py-2.5 border-b border-white/[0.06]"
              >
                <span className="text-sm text-[#C3C8CE] min-w-0 break-words">
                  {l.title}
                  {l.qty > 1 && <span className="text-[#7C838C]"> × {l.qty}</span>}
                </span>
                <span className="figure text-sm text-[#C3C8CE] shrink-0">
                  {l.price === null ? 'нет в каталоге' : formatPrice(l.price * l.qty)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-5 text-sm">
            {[
              ['Получение', order.delivery_type === 'pickup' ? 'Самовывоз' : 'Доставка'],
              ['Адрес', order.address || '—'],
              ['Комментарий', order.comment || '—'],
              ['Номер Kaspi', order.phone],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <dt className="text-[#7C838C] shrink-0 w-28">{label}</dt>
                <dd className="text-[#C3C8CE] min-w-0 break-words">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <p className="text-[11px] tracking-[0.24em] text-[#7C838C] mb-3">СТАТУС</p>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => change(s.key)}
                  disabled={busy || !ADMIN.orderStatus}
                  title={ADMIN.orderStatus ? '' : 'Эндпоинт PATCH /orders/{id} ещё не готов'}
                  className={`text-sm px-4 py-2 rounded-full border transition-colors disabled:cursor-not-allowed ${
                    s.key === order.status
                      ? 'bg-[#F4F6F8] text-[#0C0D10] border-transparent'
                      : 'text-[#C3C8CE]/70 border-white/15 hover:border-white/35 hover:text-[#F4F6F8] disabled:opacity-40 disabled:hover:border-white/15'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {error && <p className="text-[13px] text-[#C9A86A] mt-3">{error}</p>}
          </div>
        </div>
      )}
    </li>
  )
}

export default function AdminOrders() {
  const { guard } = useAuth()
  const { products } = useProducts()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(ADMIN.orders)
  const [error, setError] = useState('')
  // The open tab lives in the URL, so a reload — or a link to oneself — keeps
  // it. An unknown value falls back to «Активные» rather than an empty list.
  const [params, setParams] = useSearchParams()
  const tab = tabById(params.get('tab'))

  useEffect(() => {
    document.title = 'Заказы — MONTIRO'
    return () => {
      document.title = 'MONTIRO — наручные часы'
    }
  }, [])

  const load = useCallback(async () => {
    if (!ADMIN.orders) return
    setLoading(true)
    setError('')
    try {
      setOrders(await guard(fetchOrders))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить заказы.')
    } finally {
      setLoading(false)
    }
  }, [guard])

  useEffect(() => {
    void load()
  }, [load])

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  // GET /orders already returns newest first. Re-sorting here would only
  // fight the server the day it orders by something other than the id.
  const sorted = orders

  /** How many orders each tab would show. Counted once, not once per tab. */
  const counts = useMemo(() => {
    const perStatus = new Map<string, number>()
    for (const o of orders) perStatus.set(o.status, (perStatus.get(o.status) ?? 0) + 1)
    return Object.fromEntries(
      ORDER_TABS.map((t) => [
        t.id,
        t.keys === null
          ? orders.length
          : t.keys.reduce((n, k) => n + (perStatus.get(k) ?? 0), 0),
      ]),
    ) as Record<string, number>
  }, [orders])

  const shown = useMemo(() => {
    // The tuple's literal types would make `includes(string)` an error, and
    // the point here is exactly to test an arbitrary server value against it.
    const keys: readonly string[] | null = tab.keys
    return keys === null ? sorted : sorted.filter((o) => keys.includes(o.status))
  }, [sorted, tab])

  const openTab = (id: string) => {
    const next = new URLSearchParams(params)
    // a clean address for the default view
    if (id === DEFAULT_ORDER_TAB) next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  if (!ADMIN.orders) {
    return (
      <div>
        <h1 className="text-2xl md:text-3xl font-light text-[#F4F6F8]">Заказы</h1>
        <div className="mt-7">
          <NotReady what="Заказы" endpoint="GET /orders" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-[#F4F6F8]">Заказы</h1>
          <p className="text-sm text-[#7C838C] mt-1.5">
            {loading
              ? 'Загружаю…'
              : tab.keys === null
                ? `${orders.length} всего`
                : `${shown.length} из ${orders.length}`}
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-white/20 text-[#F4F6F8] text-sm px-6 py-3 rounded-full hover:border-white/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {error && (
        <div className="border border-white/10 rounded-2xl p-7 mt-7 max-w-xl">
          <p className="text-[15px] text-[#C3C8CE]/70 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Tabs. Plain client-side filtering on `status` — no new endpoint. */}
      <div
        role="tablist"
        aria-label="Фильтр заказов по статусу"
        className="flex flex-wrap gap-2 mt-8"
      >
        {ORDER_TABS.map((t) => {
          const active = t.id === tab.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => openTab(t.id)}
              className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                active
                  ? 'bg-[#F4F6F8] text-[#0C0D10] border-transparent'
                  : 'text-[#C3C8CE]/70 border-white/15 hover:border-white/35 hover:text-[#F4F6F8]'
              }`}
            >
              {t.label}{' '}
              <span className={`figure ${active ? 'text-[#0C0D10]/55' : 'text-[#7C838C]'}`}>
                ({counts[t.id] ?? 0})
              </span>
            </button>
          )
        })}
      </div>

      <ul className="mt-7 border-t border-white/[0.09]">
        {shown.map((o) => (
          <Row
            key={o.id}
            order={o}
            byId={byId}
            onChanged={(next) =>
              setOrders((cur) => cur.map((x) => (x.id === next.id ? next : x)))
            }
          />
        ))}
      </ul>

      {!loading && !error && shown.length === 0 && (
        <p className="text-[15px] text-[#C3C8CE]/60 mt-8">
          {orders.length === 0 ? 'Заказов пока нет.' : `${tab.label.toLowerCase()} — пусто.`}
        </p>
      )}
    </div>
  )
}
