import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from './api'
import { gallery } from './api'

/**
 * The cart.
 *
 * It survives a reload. The original spec said React state only, because
 * `localStorage` does not work inside the chat preview — but it works fine on
 * the real site, and losing a three-item cart to an accidental refresh is not
 * something a shop can afford. Every read and write is wrapped: a private
 * window or blocked site data throws, and the cart simply starts empty.
 *
 * Only what is needed to show a line is stored, never the whole product —
 * prices and stock are re-read from the API when the cart page loads, so a
 * cart left open for a week cannot check out at last week's price.
 */
export type Line = {
  id: string
  brand: string
  name: string
  price: number
  image: string
  qty: number
}

type CartValue = {
  lines: Line[]
  count: number
  total: number
  add: (product: Product, qty?: number) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
}

const KEY = 'montiro.cart.v1'
const MAX_QTY = 9

const CartContext = createContext<CartValue | null>(null)

function read(): Line[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((l): l is Line => !!l && typeof l === 'object' && typeof (l as Line).id === 'string')
      .map((l) => ({
        id: String(l.id),
        brand: String(l.brand ?? ''),
        name: String(l.name ?? ''),
        price: Number(l.price) || 0,
        image: String(l.image ?? ''),
        qty: Math.min(MAX_QTY, Math.max(1, Math.round(Number(l.qty) || 1))),
      }))
      .slice(0, 40)
  } catch {
    return []
  }
}

function write(lines: Line[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines))
  } catch {
    /* private window, blocked storage — the cart just lives for this visit */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>(read)

  useEffect(() => {
    write(lines)
  }, [lines])

  // a second tab is the same cart
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === KEY) setLines(read())
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const add = useCallback((product: Product, qty = 1) => {
    setLines((current) => {
      const found = current.find((l) => l.id === product.id)
      if (found) {
        return current.map((l) =>
          l.id === product.id ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l,
        )
      }
      return [
        ...current,
        {
          id: product.id,
          brand: product.brand,
          name: product.name,
          price: product.price,
          image: gallery(product)[0] ?? '',
          qty: Math.min(MAX_QTY, Math.max(1, qty)),
        },
      ]
    })
  }, [])

  const setQty = useCallback((id: string, qty: number) => {
    const next = Math.min(MAX_QTY, Math.round(qty))
    setLines((current) =>
      next < 1
        ? current.filter((l) => l.id !== id)
        : current.map((l) => (l.id === id ? { ...l, qty: next } : l)),
    )
  }, [])

  const remove = useCallback((id: string) => {
    setLines((current) => current.filter((l) => l.id !== id))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartValue>(() => {
    const ids = new Set(lines.map((l) => l.id))
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.price * l.qty, 0),
      add,
      setQty,
      remove,
      clear,
      has: (id: string) => ids.has(id),
    }
  }, [lines, add, setQty, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartValue {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside <CartProvider>')
  return value
}
