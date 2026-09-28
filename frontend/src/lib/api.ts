/**
 * The only place that talks to the backend.
 *
 * Two things shape everything here. The API sleeps on Render's free tier, so
 * the first request of the day can take the better part of a minute — we retry
 * with growing timeouts instead of failing fast. And the payload is written by
 * hand on the other side, so every field is normalised rather than trusted.
 */

/**
 * In development the default is the Vite proxy at `/api` (see vite.config.ts):
 * same origin, so the browser never runs a CORS check against the local
 * FastAPI. In a production build the default is the live API. Either can be
 * overridden with VITE_API_BASE.
 */
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ??
  (import.meta.env.DEV ? '/api' : 'https://montiro.onrender.com')

export type Product = {
  id: string
  brand: string
  name: string
  price: number
  category: string
  in_stock: boolean
  image: string
  images: string[]
  old_price: number | null
  description: string
  mechanism: string
  case_material: string
  strap_material: string
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v))

const num = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d.,-]/g, '').replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  return null
}

const bool = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return !['false', '0', 'no', 'нет', ''].includes(v.trim().toLowerCase())
  return true
}

/** `images` may arrive as an array, a JSON string, or a comma-separated list. */
const list = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(str).filter(Boolean)
  if (typeof v === 'string') {
    const t = v.trim()
    if (!t) return []
    if (t.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(t)
        if (Array.isArray(parsed)) return parsed.map(str).filter(Boolean)
      } catch {
        /* fall through to the comma split */
      }
    }
    return t.split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

function normalise(raw: Record<string, unknown>): Product {
  const price = num(raw.price) ?? 0
  const oldPrice = num(raw.old_price)
  return {
    id: str(raw.id),
    brand: str(raw.brand),
    name: str(raw.name),
    price,
    category: str(raw.category),
    in_stock: bool(raw.in_stock),
    image: str(raw.image),
    images: list(raw.images),
    // an old price that is not actually higher is noise, not a discount
    old_price: oldPrice && oldPrice > price ? oldPrice : null,
    description: str(raw.description),
    mechanism: str(raw.mechanism),
    case_material: str(raw.case_material),
    strap_material: str(raw.strap_material),
  }
}

/** Every picture for one product, in order, without duplicates or blanks. */
export function gallery(p: Product): string[] {
  return [...new Set([p.image, ...p.images].filter(Boolean))]
}

export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₸`
}

/** Growing timeouts: a cold Render dyno needs far longer than a warm one. */
const ATTEMPT_TIMEOUTS = [12_000, 25_000, 45_000]

async function request(path: string, signal?: AbortSignal): Promise<unknown> {
  let lastError: unknown

  for (const timeout of ATTEMPT_TIMEOUTS) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const onAbort = () => controller.abort()
    signal?.addEventListener('abort', onAbort)

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      if (res.status === 404) throw new NotFoundError()
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as unknown
    } catch (err) {
      if (err instanceof NotFoundError) throw err
      if (signal?.aborted) throw err
      lastError = err
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
  }

  throw lastError ?? new Error('Не удалось связаться с сервером')
}

export class NotFoundError extends Error {
  constructor() {
    super('not found')
    this.name = 'NotFoundError'
  }
}

export async function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  const data = await request('/products', signal)
  // tolerate both a bare array and a wrapper like { items: [...] }
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { items?: unknown })?.items)
      ? ((data as { items: unknown[] }).items)
      : []
  return rows.filter((r): r is Record<string, unknown> => !!r && typeof r === 'object').map(normalise)
}

export async function fetchProduct(id: string, signal?: AbortSignal): Promise<Product> {
  const data = await request(`/products/${encodeURIComponent(id)}`, signal)
  if (!data || typeof data !== 'object') throw new NotFoundError()
  return normalise(data as Record<string, unknown>)
}
