import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import Select from '../components/Select'
import { useProducts } from '../hooks/useProducts'
import { formatPrice, type Product } from '../lib/api'
import { WHATSAPP } from '../lib/contacts'

const ALL = 'Все'

/**
 * Every filter is built from the products the API returned — categories,
 * brands and the price bounds alike. Nothing here is hardcoded, so a new
 * category or brand in the admin panel shows up on its own.
 *
 * The whole filter state lives in the URL, which means a filtered view can be
 * sent to a customer as a plain link.
 */
type Filters = {
  q: string
  category: string
  brand: string
  min: number | null
  max: number | null
  sort: string
}

const SORTS = [
  { key: '', label: 'Сначала в наличии' },
  { key: 'price-asc', label: 'Сначала дешевле' },
  { key: 'price-desc', label: 'Сначала дороже' },
  { key: 'name', label: 'По названию' },
]

function Skeleton() {
  return (
    <div className="animate-pulse">
      {/* same shape as a real card, so the grid does not jump when data lands */}
      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] aspect-[4/5] sm:aspect-square" />
      <div className="h-2.5 w-16 bg-white/[0.06] rounded mt-5" />
      <div className="h-4 w-28 bg-white/[0.06] rounded mt-3" />
      <div className="h-3 w-20 bg-white/[0.05] rounded mt-3" />
    </div>
  )
}

/** Unique values of one field, in the order a human would expect to read them. */
function uniq(products: Product[], pick: (p: Product) => string): string[] {
  const seen = new Map<string, string>()
  for (const p of products) {
    const value = pick(p)
    if (value) seen.set(value.toLowerCase(), value)
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'ru'))
}

function Chips({
  options,
  active,
  onPick,
}: {
  options: string[]
  active: string
  onPick: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = option === active
        return (
          <button
            key={option}
            onClick={() => onPick(option)}
            className={`text-sm px-5 py-2 rounded-full border transition-colors ${
              on
                ? 'bg-[#F4F6F8] text-[#0C0D10] border-transparent'
                : 'text-[#C3C8CE]/75 border-white/15 hover:border-white/35 hover:text-[#F4F6F8]'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] tracking-[0.24em] text-[#7C838C] mb-3">{children}</p>
}

export default function Catalog() {
  const { products, loading, error, retry } = useProducts()
  const [params, setParams] = useSearchParams()

  const categories = useMemo(() => [ALL, ...uniq(products, (p) => p.category)], [products])
  const brands = useMemo(() => [ALL, ...uniq(products, (p) => p.brand)], [products])

  // the real span of prices in stock — used as placeholders, so the inputs
  // suggest sensible numbers instead of an empty box
  const bounds = useMemo(() => {
    const prices = products.map((p) => p.price).filter((n) => n > 0)
    if (prices.length === 0) return null
    return { low: Math.min(...prices), high: Math.max(...prices) }
  }, [products])

  const number = (key: string): number | null => {
    const raw = params.get(key)
    if (!raw) return null
    const n = Number(raw.replace(/\s/g, ''))
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const match = (options: string[], wanted: string) =>
    options.find((o) => o.toLowerCase() === wanted.toLowerCase()) ?? ALL

  const filters: Filters = {
    q: params.get('q') ?? '',
    // an unknown value in the URL shows everything rather than an empty page
    category: match(categories, params.get('c') ?? ''),
    brand: match(brands, params.get('b') ?? ''),
    min: number('min'),
    max: number('max'),
    sort: SORTS.some((s) => s.key === params.get('sort')) ? (params.get('sort') as string) : '',
  }

  /** Writes one key, dropping it entirely when it goes back to its default. */
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || value === ALL) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const reset = () => setParams({}, { replace: true })

  const shown = useMemo(() => {
    const needle = filters.q.trim().toLowerCase()

    const list = products.filter((p) => {
      if (filters.category !== ALL && p.category.toLowerCase() !== filters.category.toLowerCase())
        return false
      if (filters.brand !== ALL && p.brand.toLowerCase() !== filters.brand.toLowerCase())
        return false
      if (filters.min !== null && p.price < filters.min) return false
      if (filters.max !== null && p.price > filters.max) return false
      if (needle && !`${p.brand} ${p.name}`.toLowerCase().includes(needle)) return false
      return true
    })

    const byName = (a: Product, b: Product) =>
      `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, 'ru')

    if (filters.sort === 'price-asc') list.sort((a, b) => a.price - b.price || byName(a, b))
    else if (filters.sort === 'price-desc') list.sort((a, b) => b.price - a.price || byName(a, b))
    else if (filters.sort === 'name') list.sort(byName)
    // default: what you can actually buy today comes first
    else list.sort((a, b) => Number(b.in_stock) - Number(a.in_stock) || byName(a, b))

    return list
  }, [products, filters.category, filters.brand, filters.min, filters.max, filters.q, filters.sort])

  const touched =
    filters.q !== '' ||
    filters.category !== ALL ||
    filters.brand !== ALL ||
    filters.min !== null ||
    filters.max !== null ||
    filters.sort !== ''

  return (
    <main className="relative z-20 bg-[#0C0D10] min-h-screen">
      <div className="max-w-7xl mx-auto px-5 pt-28 md:pt-36 pb-24 md:pb-32">
        <p className="text-xs tracking-[0.32em] text-[#7C838C]">КАТАЛОГ</p>
        <h1
          className="t-display text-[#F4F6F8] font-extralight mt-5"
        >
          Найдите свои
        </h1>
        <p className="text-[15px] md:text-base text-[#C3C8CE]/60 leading-relaxed max-w-lg mt-6">
          Отфильтруйте по бренду, цене или названию — покажу всё, что подходит. Не нашли нужную
          модель? Напишите, привезу под заказ.
        </p>

        {/* ── filters ─────────────────────────────────────────────── */}
        {!loading && !error && products.length > 0 && (
          <div className="filter-card mt-10 md:mt-12 border-y border-white/[0.09] py-8 space-y-7">
            {/* search */}
            <div className="search-field relative max-w-md">
              <Search
                size={16}
                className="search-icon transition-colors duration-300 absolute left-5 top-1/2 -translate-y-1/2 text-[#7C838C] pointer-events-none"
              />
              <input
                type="search"
                value={filters.q}
                onChange={(e) => set('q', e.target.value)}
                placeholder="Название или бренд"
                aria-label="Поиск по каталогу"
                className="w-full bg-white/[0.04] border border-white/15 rounded-full text-sm text-[#F4F6F8] placeholder:text-[#7C838C] pl-12 pr-11 py-3 outline-none focus:border-[#C9A86A]/60 transition-colors"
              />
              {filters.q && (
                <button
                  onClick={() => set('q', '')}
                  aria-label="Очистить поиск"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7C838C] hover:text-[#F4F6F8] transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {categories.length > 1 && (
              <div>
                <Label>КАТЕГОРИЯ</Label>
                <Chips
                  options={categories}
                  active={filters.category}
                  onPick={(v) => set('c', v)}
                />
              </div>
            )}

            {brands.length > 1 && (
              <div>
                <Label>БРЕНД</Label>
                <Chips options={brands} active={filters.brand} onPick={(v) => set('b', v)} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 sm:gap-8">
              {bounds && (
                <div className="min-w-0">
                  <Label>ЦЕНА, ₸</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={params.get('min') ?? ''}
                      onChange={(e) => set('min', e.target.value)}
                      placeholder={String(bounds.low)}
                      aria-label="Цена от"
                      className="w-full min-w-0 bg-white/[0.04] border border-white/15 rounded-full text-sm text-[#F4F6F8] placeholder:text-[#7C838C] px-5 py-3 outline-none focus:border-[#C9A86A]/60 transition-colors"
                    />
                    <span className="text-[#7C838C] shrink-0">—</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={params.get('max') ?? ''}
                      onChange={(e) => set('max', e.target.value)}
                      placeholder={String(bounds.high)}
                      aria-label="Цена до"
                      className="w-full min-w-0 bg-white/[0.04] border border-white/15 rounded-full text-sm text-[#F4F6F8] placeholder:text-[#7C838C] px-5 py-3 outline-none focus:border-[#C9A86A]/60 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-[#7C838C] mt-2.5">
                    В наличии от {formatPrice(bounds.low)} до {formatPrice(bounds.high)}
                  </p>
                </div>
              )}

              <div className="min-w-0">
                <Label>СОРТИРОВКА</Label>
                <Select
                  label="Сортировка"
                  value={filters.sort}
                  options={SORTS}
                  onChange={(key) => set('sort', key)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <p className="text-sm text-[#7C838C]">
                {shown.length === products.length
                  ? `Всего моделей: ${products.length}`
                  : `Найдено: ${shown.length} из ${products.length}`}
              </p>
              {touched && (
                <button
                  onClick={reset}
                  className="text-sm text-[#C9A86A] hover:text-[#F4F6F8] transition-colors"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          </div>
        )}

        {/* Two per row on a phone as well — the gap shrinks with the screen so
            the columns keep their width (see CLAUDE.md: gaps are what pushed
            the page sideways the last time). */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-12 mt-12 md:mt-16">
          {loading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} />)}
          {!loading &&
            shown.map((p) => (
              /* `rise` is a scroll-driven animation — no observer, no listener */
              <div key={p.id} className="rise">
                <ProductCard product={p} />
              </div>
            ))}
        </div>

        {loading && (
          <p className="text-sm text-[#7C838C] mt-10">
            Загружаю каталог. Сервер мог уснуть — первая загрузка занимает до минуты.
          </p>
        )}

        {!loading && error && (
          <div className="border border-white/10 rounded-3xl p-8 md:p-12 mt-4">
            <h2 className="text-2xl font-light text-[#F4F6F8]">Каталог сейчас не отвечает</h2>
            <p className="text-[15px] text-[#C3C8CE]/60 leading-relaxed mt-4 max-w-md">
              Скорее всего сервер уснул и не успел проснуться. Попробуйте ещё раз через минуту —
              или просто напишите, я отвечу и пришлю что есть.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={retry}
                className="text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors"
              >
                Попробовать снова
              </button>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors"
              >
                Написать в WhatsApp
              </a>
            </div>
          </div>
        )}

        {!loading && !error && shown.length === 0 && (
          <div className="mt-4">
            <p className="text-[15px] text-[#C3C8CE]/60 max-w-md leading-relaxed">
              {products.length === 0
                ? 'Каталог пока пуст. Напишите — расскажу, что едет в ближайшей партии.'
                : 'Под эти условия ничего не нашлось. Снимите часть фильтров или напишите — подберу под запрос.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              {touched && (
                <button
                  onClick={reset}
                  className="text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors"
                >
                  Сбросить фильтры
                </button>
              )}
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors"
              >
                Написать в WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
