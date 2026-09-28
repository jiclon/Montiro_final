import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { formatPrice, gallery, type Product } from '../../lib/api'
import { useProducts } from '../../hooks/useProducts'
import {
  ADMIN,
  changedFields,
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductDraft,
} from '../../lib/admin'
import { useAuth } from '../../lib/auth'
import fallbackPhoto from '../../assets/watch-still.jpg'

const EMPTY: ProductDraft = {
  brand: '',
  name: '',
  price: 0,
  category: '',
  in_stock: true,
  image: '',
  images: [],
  old_price: null,
  description: '',
  mechanism: '',
  case_material: '',
  strap_material: '',
}

const FIELD =
  'w-full bg-white/[0.04] border border-white/15 rounded-xl text-[15px] text-[#F4F6F8] ' +
  'placeholder:text-[#7C838C] px-4 py-3 outline-none focus:border-[#C9A86A]/60 transition-colors'

const LABEL = 'block text-[11px] tracking-[0.24em] text-[#7C838C] mb-2'

function toDraft(p: Product): ProductDraft {
  return {
    brand: p.brand,
    name: p.name,
    price: p.price,
    category: p.category,
    in_stock: p.in_stock,
    image: p.image,
    images: p.images,
    old_price: p.old_price,
    description: p.description,
    mechanism: p.mechanism,
    case_material: p.case_material,
    strap_material: p.strap_material,
  }
}

/** A picture you can see is a picture you know is not broken. */
function Preview({ url }: { url: string }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [url])

  if (!url) {
    return (
      <div className="w-full h-32 rounded-xl border border-dashed border-white/15 grid place-items-center text-[13px] text-[#7C838C]">
        Фото не указано — на сайте встанет заглушка
      </div>
    )
  }
  return (
    <div className="w-full h-32 rounded-xl border border-white/10 bg-black/40 grid place-items-center overflow-hidden">
      {broken ? (
        <p className="text-[13px] text-[#C9A86A] px-4 text-center">
          Не загружается. Проверьте адрес — он должен открываться в браузере.
        </p>
      ) : (
        <img
          src={url}
          alt=""
          onError={() => setBroken(true)}
          className="h-full w-auto object-contain"
        />
      )}
    </div>
  )
}

function Form({
  initial,
  editingId,
  onDone,
  onCancel,
}: {
  initial: ProductDraft
  editingId: string | null
  onDone: () => void
  onCancel: () => void
}) {
  const { guard } = useAuth()
  const [draft, setDraft] = useState<ProductDraft>(initial)
  const [extra, setExtra] = useState(initial.images.join('\n'))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const disabled = editingId ? !ADMIN.updateProduct : !ADMIN.createProduct

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy || disabled) return
    setError('')
    setBusy(true)
    const body: ProductDraft = {
      ...draft,
      brand: draft.brand.trim(),
      name: draft.name.trim(),
      category: draft.category.trim(),
      image: draft.image.trim(),
      images: extra
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
      old_price: draft.old_price && draft.old_price > draft.price ? draft.old_price : null,
    }
    try {
      if (editingId) {
        // PATCH: only what the owner actually touched goes over the wire.
        const patch = changedFields(initial, body)
        if (Object.keys(patch).length === 0) {
          onDone()
          return
        }
        await guard((token) => updateProduct(token, editingId, patch))
      } else {
        await guard((token) => createProduct(token, body))
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="border border-white/10 rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-light text-[#F4F6F8]">
          {editingId ? 'Изменить товар' : 'Новый товар'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Закрыть"
          className="p-2 text-[#7C838C] hover:text-[#F4F6F8] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {disabled && (
        <p className="text-[13px] text-[#C9A86A] leading-relaxed mt-4">
          {editingId
            ? 'Изменение требует PATCH /products/{id} — эндпоинта ещё нет.'
            : 'Создание требует POST /products.'}{' '}
          Форму можно заполнить, но сохранить не выйдет.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
        <div>
          <label className={LABEL} htmlFor="p-brand">
            БРЕНД
          </label>
          <input
            id="p-brand"
            value={draft.brand}
            onChange={(e) => set('brand', e.target.value)}
            placeholder="Tissot"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="p-name">
            НАЗВАНИЕ
          </label>
          <input
            id="p-name"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="PRX Powermatic 80"
            className={FIELD}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="p-price">
            ЦЕНА, ₸
          </label>
          <input
            id="p-price"
            type="number"
            min={0}
            value={draft.price || ''}
            onChange={(e) => set('price', Number(e.target.value) || 0)}
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="p-old">
            СТАРАЯ ЦЕНА, ₸
          </label>
          <input
            id="p-old"
            type="number"
            min={0}
            value={draft.old_price ?? ''}
            onChange={(e) => set('old_price', e.target.value ? Number(e.target.value) : null)}
            className={FIELD}
          />
          <p className="text-[12px] text-[#7C838C] mt-2">
            Пусто, если скидки нет. Показывается зачёркнутой, только если больше цены.
          </p>
        </div>

        <div>
          <label className={LABEL} htmlFor="p-category">
            КАТЕГОРИЯ
          </label>
          <input
            id="p-category"
            value={draft.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="Классика"
            className={FIELD}
          />
          <p className="text-[12px] text-[#7C838C] mt-2">Из неё строятся фильтры каталога.</p>
        </div>
        <div>
          <span className={LABEL}>НАЛИЧИЕ</span>
          <div className="flex gap-2">
            {[
              [true, 'В наличии'],
              [false, 'Под заказ'],
            ].map(([value, label]) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => set('in_stock', value as boolean)}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  draft.in_stock === value
                    ? 'border-[#C9A86A]/60 bg-white/[0.05] text-[#F4F6F8]'
                    : 'border-white/15 text-[#C3C8CE]/70 hover:border-white/30'
                }`}
              >
                {label as string}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <div>
          <label className={LABEL} htmlFor="p-image">
            ГЛАВНОЕ ФОТО — АДРЕС
          </label>
          <input
            id="p-image"
            value={draft.image}
            onChange={(e) => set('image', e.target.value)}
            placeholder="/watches/prx.jpg"
            className={FIELD}
          />
          <p className="text-[12px] text-[#7C838C] mt-2 leading-relaxed">
            Файл из папки <code className="text-[#C3C8CE]">public/watches</code> — пишите со
            слэша: <code className="text-[#C3C8CE]">/watches/prx.jpg</code>. Либо полный
            https-адрес.
          </p>
        </div>
        <div>
          <span className={LABEL}>КАК БУДЕТ ВЫГЛЯДЕТЬ</span>
          <Preview url={draft.image.trim()} />
        </div>
      </div>

      <div className="mt-5">
        <label className={LABEL} htmlFor="p-images">
          ОСТАЛЬНЫЕ ФОТО
        </label>
        <textarea
          id="p-images"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          rows={3}
          placeholder={'/watches/prx-2.jpg\n/watches/prx-3.jpg'}
          className={`${FIELD} resize-none`}
        />
        <p className="text-[12px] text-[#7C838C] mt-2">Каждое с новой строки.</p>
      </div>

      <div className="mt-5">
        <label className={LABEL} htmlFor="p-description">
          ОПИСАНИЕ
        </label>
        <textarea
          id="p-description"
          value={draft.description}
          onChange={(e) => set('description', e.target.value)}
          rows={4}
          className={`${FIELD} resize-none`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
        {(
          [
            ['mechanism', 'МЕХАНИЗМ', 'Кварцевый'],
            ['case_material', 'КОРПУС', 'Сталь 316L, 40 мм'],
            ['strap_material', 'РЕМЕНЬ', 'Натуральная кожа'],
          ] as const
        ).map(([key, label, placeholder]) => (
          <div key={key}>
            <label className={LABEL} htmlFor={`p-${key}`}>
              {label}
            </label>
            <input
              id={`p-${key}`}
              value={draft[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              className={FIELD}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-[13px] text-[#C9A86A] leading-relaxed mt-5">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 mt-7">
        <button
          type="submit"
          disabled={busy || disabled || !draft.name.trim() || draft.price <= 0}
          className="bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors disabled:opacity-40 disabled:hover:bg-[#F4F6F8] disabled:cursor-not-allowed"
        >
          {busy ? 'Сохраняю…' : editingId ? 'Сохранить' : 'Добавить товар'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-white/40 transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}

export default function AdminProducts() {
  const { products, loading, error, retry } = useProducts()
  const { guard } = useAuth()
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    document.title = 'Товары — MONTIRO'
    return () => {
      document.title = 'MONTIRO — наручные часы'
    }
  }, [])

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.brand.localeCompare(b.brand, 'ru') || a.name.localeCompare(b.name, 'ru')),
    [products],
  )

  const remove = async (p: Product) => {
    if (!ADMIN.deleteProduct) return
    if (!confirm(`Удалить «${p.brand} ${p.name}»? Это нельзя отменить.`)) return
    setRemoving(p.id)
    setNotice('')
    try {
      await guard((token) => deleteProduct(token, p.id))
      retry()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Не удалось удалить.')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-[#F4F6F8]">Товары</h1>
          <p className="text-sm text-[#7C838C] mt-1.5">
            {loading ? 'Загружаю…' : `${products.length} в каталоге`}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-2 bg-[#F4F6F8] text-[#0C0D10] text-sm px-6 py-3 rounded-full hover:bg-[#C9A86A] transition-colors"
          >
            <Plus size={16} />
            Добавить
          </button>
        )}
      </div>

      {notice && <p className="text-[13px] text-[#C9A86A] mt-5">{notice}</p>}

      {editing && (
        <div className="mt-7">
          <Form
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? EMPTY : toDraft(editing)}
            editingId={editing === 'new' ? null : editing.id}
            onDone={() => {
              setEditing(null)
              retry()
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {error && !loading && (
        <div className="border border-white/10 rounded-2xl p-7 mt-7 max-w-xl">
          <p className="text-[15px] text-[#C3C8CE]/70 leading-relaxed">
            Каталог не загрузился — сервер не ответил.
          </p>
          <button
            onClick={retry}
            className="border border-white/20 text-[#F4F6F8] text-sm px-6 py-3 rounded-full hover:border-white/40 transition-colors mt-5"
          >
            Попробовать снова
          </button>
        </div>
      )}

      <ul className="mt-8 border-t border-white/[0.09]">
        {sorted.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-4 sm:gap-5 py-4 border-b border-white/[0.09]"
          >
            <img
              src={gallery(p)[0] || fallbackPhoto}
              alt=""
              loading="lazy"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src = fallbackPhoto
              }}
              className="w-14 h-14 rounded-xl object-contain bg-black/40 border border-white/10 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="text-[11px] tracking-[0.2em] text-[#7C838C]">
                {p.brand.toUpperCase()}
                {p.category && <span className="text-[#7C838C]/60"> · {p.category}</span>}
              </p>
              <p className="text-[15px] text-[#F4F6F8] mt-1 break-words">{p.name}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="figure text-sm text-[#C3C8CE]">{formatPrice(p.price)}</p>
              {!p.in_stock && (
                <p className="text-[10px] tracking-[0.2em] text-[#7C838C] mt-1">ПОД ЗАКАЗ</p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditing(p)}
                aria-label={`Изменить ${p.name}`}
                title={
                  ADMIN.updateProduct ? 'Изменить' : 'Эндпоинт PATCH /products/{id} ещё не готов'
                }
                className="p-2.5 rounded-full text-[#7C838C] hover:text-[#F4F6F8] hover:bg-white/[0.07] transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => remove(p)}
                disabled={!ADMIN.deleteProduct || removing === p.id}
                aria-label={`Удалить ${p.name}`}
                title={
                  ADMIN.deleteProduct ? 'Удалить' : 'Эндпоинт DELETE /products/{id} ещё не готов'
                }
                className="p-2.5 rounded-full text-[#7C838C] hover:text-[#C9A86A] hover:bg-white/[0.07] transition-colors disabled:opacity-30 disabled:hover:text-[#7C838C] disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!loading && !error && products.length === 0 && (
        <p className="text-[15px] text-[#C3C8CE]/60 mt-8">
          Каталог пуст. Нажмите «Добавить» — первый товар появится на сайте сразу.
        </p>
      )}
    </div>
  )
}
