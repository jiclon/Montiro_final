import { useEffect, useRef } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductPage from './pages/ProductPage'
import Help from './pages/Help'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderPlaced from './pages/OrderPlaced'
import NotFound from './pages/NotFound'
import Legal from './pages/Legal'
import Admin from './pages/admin/Admin'
import { CartProvider } from './lib/cart'
import { AuthProvider } from './lib/auth'

/**
 * Smooth scrolling lives at the root so it survives navigation, and the same
 * instance is what jumps to the top (or to a hash target) on a route change —
 * letting the browser do it fights Lenis and lands halfway.
 */
function Scrolling({ lenis }: { lenis: React.MutableRefObject<Lenis | null> }) {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const jump = () => {
      const target = hash ? document.querySelector(hash) : null
      if (target instanceof HTMLElement) {
        if (lenis.current) lenis.current.scrollTo(target, { offset: -80 })
        else target.scrollIntoView()
        return
      }
      if (lenis.current) lenis.current.scrollTo(0, { immediate: true })
      else window.scrollTo(0, 0)
    }
    // one frame, so the new route has laid out before we measure it
    const id = requestAnimationFrame(jump)
    return () => cancelAnimationFrame(id)
  }, [pathname, hash, lenis])

  return null
}

/** The shop: navbar, smooth scrolling, footer. */
function Shop() {
  const lenis = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const instance = new Lenis({ duration: 1.1, smoothWheel: true })
    lenis.current = instance

    let frame = requestAnimationFrame(function raf(time) {
      instance.raf(time)
      frame = requestAnimationFrame(raf)
    })

    return () => {
      cancelAnimationFrame(frame)
      instance.destroy()
      lenis.current = null
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0C0D10] tracking-[-0.02em]">
      <Scrolling lenis={lenis} />
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/help" element={<Help />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order" element={<OrderPlaced />} />
        <Route path="/privacy" element={<Legal />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <div className="relative z-20 bg-[#0C0D10]">
        <Footer />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          {/* The admin is its own world — no shop chrome, no Lenis, and it
              must not mount the cart's storage listeners either. */}
          <Routes>
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<Shop />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
