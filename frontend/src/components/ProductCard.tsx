import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { formatPrice, gallery, type Product } from '../lib/api'
import { useCart } from '../lib/cart'
import fallbackPhoto from '../assets/watch-still.jpg'

export default function ProductCard({ product }: { product: Product }) {
  const [src, setSrc] = useState(gallery(product)[0] || fallbackPhoto)
  const { add, has } = useCart()
  const inCart = has(product.id)

  return (
    /* `card` opens a container query context — the plate sizes itself to the
       card's own width, not the viewport's (see index.css) */
    <Link to={`/product/${product.id}`} className="card group block">
      <div className="card-plate relative rounded-3xl overflow-hidden border border-white/10">
        {/* No edge mask: a real photo would lose its corners. See ProductPage. */}
        <div className="h-full flex items-center justify-center p-3">
          <img
            src={src}
            alt={`${product.brand} ${product.name}`}
            loading="lazy"
            onError={() => setSrc(fallbackPhoto)}
            className="max-h-full max-w-full w-auto object-contain transition-transform duration-700 group-hover:scale-[1.04]"
          />
        </div>

        {!product.in_stock && (
          <span className="card-badge absolute top-3 left-3 text-[#C3C8CE]/70 border border-white/15 rounded-full bg-black/40">
            ПОД ЗАКАЗ
          </span>
        )}

        {/* the card is a link, so adding must not navigate */}
        <button
          type="button"
          aria-label={inCart ? 'Уже в корзине' : `Добавить ${product.name} в корзину`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            add(product)
          }}
          className={`absolute bottom-3 right-3 w-9 h-9 grid place-items-center rounded-full
                      border transition-colors ${
                        inCart
                          ? 'border-[#C9A86A]/60 text-[#C9A86A] bg-black/50'
                          : 'border-white/20 text-[#C3C8CE] bg-black/40 hover:border-[#C9A86A]/60 hover:text-[#C9A86A]'
                      }`}
        >
          {inCart ? <Check size={15} /> : <Plus size={15} />}
        </button>
      </div>

      <div className="mt-4">
        {product.brand && (
          <p className="card-brand text-[#7C838C]">
            {product.brand.toUpperCase()}
          </p>
        )}
        <h3 className="card-name clamp-2 font-light text-[#F4F6F8] mt-2 transition-colors duration-300 group-hover:text-[#C9A86A]">
          {product.name}
        </h3>
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 mt-2">
          <span className="figure card-price text-[#C3C8CE]">{formatPrice(product.price)}</span>
          {product.old_price && (
            <span className="figure card-oldprice text-[#7C838C]/70 line-through">
              {formatPrice(product.old_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
