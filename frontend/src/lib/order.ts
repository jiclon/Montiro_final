import { formatPrice } from './api'
import type { Line } from './cart'
import { WHATSAPP } from './contacts'

export type Delivery = 'delivery' | 'pickup'

export type Order = {
  /** Empty in the WhatsApp fallback: no server, so no number yet. */
  number: string
  name: string
  phone: string
  city: string
  delivery: Delivery
  comment: string
  lines: Line[]
  total: number
}

export const DELIVERY_LABEL: Record<Delivery, string> = {
  delivery: 'Доставка по Казахстану',
  pickup: 'Самовывоз, Петропавловск',
}

/**
 * The number is made here, on the phone that placed the order. There is no
 * order endpoint yet, so nothing on a server can hand one out — this is a
 * label the buyer and the shop can both say out loud, not a database key.
 * Date first so it sorts, four digits so two orders in one day cannot collide
 * in practice.
 */
export function makeOrderNumber(now = new Date()): string {
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const tail = String(Math.floor(1000 + Math.random() * 9000))
  return `M-${yy}${mm}${dd}-${tail}`
}

/** Normalises what a person actually types into a phone field. */
export function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && (digits.startsWith('8') || digits.startsWith('7'))) {
    return `+7${digits.slice(1)}`
  }
  if (digits.length === 10) return `+7${digits}`
  return raw.trim()
}

export function phoneLooksReal(raw: string): boolean {
  return raw.replace(/\D/g, '').length >= 10
}

/**
 * The whole order as one message. Until the backend has an endpoint, this IS
 * the order: it arrives in WhatsApp with everything needed to raise the Kaspi
 * invoice, and nothing has to be asked twice.
 */
export function orderMessage(order: Order): string {
  const items = order.lines.map(
    (l, i) =>
      `${i + 1}. ${[l.brand, l.name].filter(Boolean).join(' ')}` +
      `${l.qty > 1 ? ` × ${l.qty}` : ''} — ${formatPrice(l.price * l.qty)}`,
  )

  return [
    order.number ? `Заказ ${order.number}` : 'Заказ с сайта',
    '',
    ...items,
    '',
    `Итого: ${formatPrice(order.total)}`,
    '',
    `Имя: ${order.name}`,
    `Номер Kaspi: ${order.phone}`,
    order.delivery === 'delivery' ? `Адрес: ${order.city}` : null,
    `Получение: ${DELIVERY_LABEL[order.delivery]}`,
    order.comment ? `Комментарий: ${order.comment}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

export function orderWhatsappUrl(order: Order): string {
  return `${WHATSAPP}?text=${encodeURIComponent(orderMessage(order))}`
}
