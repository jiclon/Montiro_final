import { API_BASE } from './api'
import type { Line } from './cart'

/**
 * ─────────────────────────────────────────────────────────────────────
 *  THE SWITCH. One place, two values.
 *
 *  `enabled: true` — the checkout calls POST /orders for real.
 *  `enabled: false` — no request is made at all: the button goes straight to
 *  "Не удалось оформить заказ" with WhatsApp as a way out. That is a shutter,
 *  not an error, and it is the only thing that block means when the server is
 *  fine. Either way nothing opens by itself — the buyer presses it.
 * ─────────────────────────────────────────────────────────────────────
 */
export const ORDERS = {
  enabled: true,
  path: '/orders',
  /** One attempt, not three: a buyer waiting on a button will not wait 80s. */
  timeout: 20_000,
}

export type DeliveryType = 'pickup' | 'delivery'

/** Exactly the body the backend expects. */
export type OrderPayload = {
  customer_name: string
  phone: string
  delivery_type: DeliveryType
  address: string | null
  comment: string | null
  items: { product_id: number | string; quantity: number }[]
  /** One per checkout attempt. A retry repeats it, so the server can tell a
      second press from a second order. */
  idempotency_key: string
}

/** A v4 uuid, with a fallback for the browsers that lack `randomUUID`. */
export function newIdempotencyKey(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 14)}`
}

/**
 * What comes back on 201 — the whole `OrderRead`. The confirmation screen is
 * built from this, not from the form, so the buyer reads back what the server
 * actually stored (a normalised phone, for instance).
 */
export type CreatedOrder = {
  id: number | string
  phone?: string
  customer_name?: string
  status?: string
  created_at?: string
}

export class OrderError extends Error {
  /** 'validation' — the server rejected the data; 'network' — it never answered. */
  readonly kind: 'validation' | 'network'
  readonly status?: number

  constructor(kind: 'validation' | 'network', message: string, status?: number) {
    super(message)
    this.name = 'OrderError'
    this.kind = kind
    this.status = status
  }
}

/** Numeric ids go out as numbers — the backend's product_id is an int. */
function productId(id: string): number | string {
  return /^\d+$/.test(id) ? Number(id) : id
}

export function buildPayload(input: {
  name: string
  phone: string
  delivery: DeliveryType
  address: string
  comment: string
  lines: Line[]
  idempotencyKey: string
}): OrderPayload {
  return {
    customer_name: input.name.trim(),
    phone: input.phone.trim(),
    delivery_type: input.delivery,
    address: input.delivery === 'delivery' ? input.address.trim() || null : null,
    comment: input.comment.trim() || null,
    items: input.lines.map((l) => ({ product_id: productId(l.id), quantity: l.qty })),
    idempotency_key: input.idempotencyKey,
  }
}

/**
 * The server's own words. It answers with `{"detail": "Товара нет в наличии"}`
 * and similar — those are written for the buyer, so they are shown as they
 * are rather than replaced with a generic message.
 */
async function detailOf(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json()
    const detail = (data as { detail?: unknown })?.detail
    if (typeof detail === 'string' && detail.trim()) return detail.trim()
    if (Array.isArray(detail)) {
      const first = detail[0] as { msg?: string } | undefined
      if (typeof first?.msg === 'string' && first.msg.trim()) return first.msg.trim()
    }
  } catch {
    /* a body that is not JSON tells us nothing useful */
  }
  return ''
}

/**
 * Creates the order. A 400 or 422 is the server saying the data is wrong —
 * repeating it changes nothing, so it is not retried and not dressed up as a
 * network problem. Anything else means the order did not reach anyone, and
 * that is when WhatsApp steps in.
 */
export async function createOrder(payload: OrderPayload): Promise<CreatedOrder> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ORDERS.timeout)

  try {
    const res = await fetch(`${API_BASE}${ORDERS.path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    // 400 «Корзина пуста» / «Неверное количество» / «Товара нет в наличии»,
    // 404 «Товар не найден», 422 — all say what is wrong. Repeating the same
    // body cannot fix any of them, so none are retried and the buyer reads the
    // server's own sentence.
    if (res.status === 400 || res.status === 404 || res.status === 422) {
      const detail = await detailOf(res)
      throw new OrderError(
        'validation',
        detail || 'Сервер не принял заказ — проверьте поля или обновите корзину.',
        res.status,
      )
    }
    if (!res.ok) {
      throw new OrderError('network', `Сервер ответил ошибкой ${res.status}.`, res.status)
    }

    const data: unknown = await res.json()
    if (!data || typeof data !== 'object' || !('id' in data)) {
      throw new OrderError('network', 'Сервер ответил, но без номера заказа.')
    }
    return data as CreatedOrder
  } catch (err) {
    if (err instanceof OrderError) throw err
    throw new OrderError('network', 'Сервер не отвечает.')
  } finally {
    clearTimeout(timer)
  }
}
