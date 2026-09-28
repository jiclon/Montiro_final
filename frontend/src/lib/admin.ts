import { API_BASE, type Product } from './api'

/**
 * ─────────────────────────────────────────────────────────────────────
 *  WHAT THE BACKEND CAN DO TODAY. One place.
 *
 *  Each flag is one endpoint. Flip it the day that endpoint answers —
 *  the admin panel already has the screens, they are just disabled and
 *  labelled "эндпоинт ещё не готов" while the flag is false.
 * ─────────────────────────────────────────────────────────────────────
 */
export const ADMIN = {
  login: true, //          POST   /login
  createProduct: true, //  POST   /products          (Bearer)
  updateProduct: true, //  PATCH  /products/{id}     (Bearer)
  deleteProduct: true, //  DELETE /products/{id}     (Bearer)
  orders: true, //        GET    /orders            (Bearer)
  orderStatus: true, //   PATCH  /orders/{id}       (Bearer)
}

export const TOKEN_KEY = 'montiro.admin.token'

/** The statuses an order moves through. Change here, change everywhere. */
export const ORDER_STATUSES = [
  { key: 'new', label: 'Новый' },
  { key: 'awaiting', label: 'Счёт выставлен' },
  { key: 'paid', label: 'Оплачен' },
  { key: 'shipped', label: 'Отправлен' },
  { key: 'done', label: 'Завершён' },
  { key: 'canceled', label: 'Отменён' },
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]['key']

/**
 * The tabs over the order list. `keys: null` means "everything", including a
 * status the backend might add later — that is what keeps «Все» honest.
 * Filtering happens here, in the browser, on the `status` field of
 * `GET /orders`; there is no endpoint per tab.
 */
export const ORDER_TABS = [
  { id: 'active', label: 'Активные', keys: ['new', 'awaiting', 'paid', 'shipped'] },
  { id: 'new', label: 'Новые', keys: ['new'] },
  { id: 'awaiting', label: 'Ждут оплату', keys: ['awaiting'] },
  { id: 'paid', label: 'Оплачены', keys: ['paid'] },
  { id: 'shipped', label: 'Отправлены', keys: ['shipped'] },
  { id: 'done', label: 'Завершены', keys: ['done'] },
  { id: 'canceled', label: 'Отменены', keys: ['canceled'] },
  { id: 'all', label: 'Все', keys: null },
] as const satisfies readonly {
  id: string
  label: string
  keys: readonly string[] | null
}[]

export type OrderTabId = (typeof ORDER_TABS)[number]['id']

export const DEFAULT_ORDER_TAB: OrderTabId = 'active'

export function tabById(id: string | null): (typeof ORDER_TABS)[number] {
  return ORDER_TABS.find((t) => t.id === id) ?? ORDER_TABS[0]
}

export function statusLabel(key: string): string {
  return ORDER_STATUSES.find((s) => s.key === key)?.label ?? key
}

export type OrderItem = {
  id?: number | string
  product_id: number | string
  quantity: number
}

export type AdminOrder = {
  id: number | string
  status: string
  created_at?: string
  customer_name: string
  phone: string
  delivery_type: 'pickup' | 'delivery'
  address: string | null
  comment: string | null
  items: OrderItem[]
}

/** Everything a product form sends. `id` is absent when creating. */
export type ProductDraft = {
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

export class AuthError extends Error {
  constructor() {
    super('Сессия истекла — войдите заново.')
    this.name = 'AuthError'
  }
}

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json()
    const detail = (data as { detail?: unknown })?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const first = detail[0] as { msg?: string; loc?: unknown[] } | undefined
      if (first?.msg) {
        const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : ''
        return field ? `${field}: ${first.msg}` : first.msg
      }
    }
  } catch {
    /* a body that is not JSON tells us nothing useful */
  }
  return `Сервер ответил ошибкой ${res.status}.`
}

async function call<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = init
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  }).catch(() => {
    throw new ApiError(0, 'Сервер не отвечает.')
  })

  if (res.status === 401 || res.status === 403) throw new AuthError()
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** The backend takes JSON. Nothing else is tried. */
export async function login(username: string, password: string): Promise<string> {
  try {
    const data = await call<unknown>('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const token = (data as { access_token?: unknown })?.access_token
    if (typeof token !== 'string' || !token) {
      throw new ApiError(0, 'Сервер не вернул токен.')
    }
    return token
  } catch (err) {
    // On /login a 401 means the password is wrong, not that a session expired.
    if (err instanceof AuthError) throw new ApiError(401, 'Неверный логин или пароль.')
    throw err instanceof Error ? err : new ApiError(0, 'Не удалось войти.')
  }
}

const json = (token: string, body: unknown): RequestInit & { token: string } => ({
  token,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

/**
 * ─────────────────────────────────────────────────────────────────────
 *  HOW `images` GOES OVER THE WIRE. One place.
 *
 *  The backend column is a plain `str`, so sending a JSON array earns
 *  `images: Input should be a valid string` (422). The form keeps working
 *  with a list — that is the sane shape for a UI — and it is flattened to
 *  a comma-separated string on the way out. `list()` in api.ts already
 *  reads that back into an array, along with a JSON string or a single
 *  URL, so nothing else has to know.
 *
 *  Flip to 'array' the day the backend takes `list[str]`.
 * ─────────────────────────────────────────────────────────────────────
 */
export const IMAGES_WIRE: 'string' | 'array' = 'string'

/** The draft as the server wants it. Only `images` ever needs translating. */
function toWire<T extends Partial<ProductDraft>>(draft: T): Record<string, unknown> {
  const body: Record<string, unknown> = { ...draft }
  if (IMAGES_WIRE === 'string' && Array.isArray(draft.images)) {
    body.images = draft.images.map((u) => u.trim()).filter(Boolean).join(', ')
  }
  return body
}

export function createProduct(token: string, draft: ProductDraft): Promise<Product> {
  return call<Product>('/products', { method: 'POST', ...json(token, toWire(draft)) })
}

/** PATCH, so only the fields that actually changed are sent. */
export function updateProduct(
  token: string,
  id: string,
  patch: Partial<ProductDraft>,
): Promise<Product> {
  return call<Product>(`/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    ...json(token, toWire(patch)),
  })
}

/** What changed between the form as it opened and the form as it stands. */
export function changedFields(
  before: ProductDraft,
  after: ProductDraft,
): Partial<ProductDraft> {
  const patch: Record<string, unknown> = {}
  for (const key of Object.keys(after) as (keyof ProductDraft)[]) {
    const a = before[key]
    const b = after[key]
    const same = Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b) : a === b
    if (!same) patch[key] = b
  }
  return patch as Partial<ProductDraft>
}

export function deleteProduct(token: string, id: string): Promise<void> {
  return call<void>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE', token })
}

export async function fetchOrders(token: string): Promise<AdminOrder[]> {
  const data = await call<unknown>('/orders', { token })
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { items?: unknown })?.items)
      ? (data as { items: unknown[] }).items
      : []
  return rows.filter((r): r is AdminOrder => !!r && typeof r === 'object')
}

export function setOrderStatus(
  token: string,
  id: string,
  status: string,
): Promise<AdminOrder> {
  return call<AdminOrder>(`/orders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    ...json(token, { status }),
  })
}
