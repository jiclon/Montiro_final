import { formatPrice, type Product } from './api'

export const WHATSAPP = 'https://wa.me/77059126313'
export const WHATSAPP_SECOND = 'https://wa.me/77761399741'
export const INSTAGRAM = 'https://instagram.com/montiro.store'
export const TIKTOK = 'https://tiktok.com/@montiro_watches'

/**
 * There is no payment gateway — an order starts as a WhatsApp message. The
 * link arrives pre-filled with the model and a direct link back to it, so the
 * conversation opens with everything already on the table.
 */
export function orderUrl(p: Product): string {
  const link = typeof window === 'undefined' ? '' : `${window.location.origin}/product/${p.id}`
  const text = [
    'Здравствуйте! Интересуют часы:',
    `${p.brand} ${p.name} — ${formatPrice(p.price)}`,
    link,
  ]
    .filter(Boolean)
    .join('\n')
  return `${WHATSAPP}?text=${encodeURIComponent(text)}`
}
