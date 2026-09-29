import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import StudioBackdrop from './StudioBackdrop'
import Wordmark from './Wordmark'
import watchPoster from '../assets/watch-poster.jpg'
import { WHATSAPP } from '../lib/contacts'

/** Dissolves the black edges of the photo into the page. */
const EDGE_MASK = 'radial-gradient(50% 48% at 50% 46%, #000 68%, rgba(0,0,0,0) 100%)'

/** The white the dial opens into — the same value the next section is painted. */
export const DIAL_WHITE = '#F2F1EC'

/** Where the dial sits inside the photo. */
const DIAL_X = 0.5
const DIAL_Y = 0.44

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const smooth = (v: number) => v * v * (3 - 2 * v)

export default function Hero() {
  const runwayRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const circleRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const [still, setStill] = useState(false)

  useEffect(() => {
    setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  /**
   * One continuous move: scrolling pulls the camera into the dial until the
   * white face fills the screen and becomes the section underneath. The raw
   * scroll position is eased toward every frame, so the approach glides rather
   * than tracking the wheel step for step.
   */
  useEffect(() => {
    const runway = runwayRef.current
    const zoom = zoomRef.current
    const anchor = anchorRef.current
    const circle = circleRef.current
    const copy = copyRef.current
    if (!runway || !zoom || !anchor || !circle || !copy) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let current = 0
    let target = 0
    let frame = 0
    let running = false
    let dialOpen: boolean | null = null

    const apply = (p: number) => {
      const e = smooth(p)

      zoom.style.transform = `rotate(${(e * 10).toFixed(2)}deg) scale(${(1 + e * 2).toFixed(3)})`

      const fade = clamp01(1 - p / 0.3)
      copy.style.opacity = fade.toFixed(3)
      copy.style.transform = `translateY(${(-p * 46).toFixed(1)}px)`

      // the dial opens out from wherever it currently sits on screen
      // the flag only holds while the stage is still on screen, otherwise the
      // navbar would stay in light mode for the rest of the page
      const stageVisible = runway.getBoundingClientRect().bottom > 0
      const cp = smooth(clamp01((p - 0.26) / 0.56))
      const open = cp > 0.5 && stageVisible
      if (open !== dialOpen) {
        dialOpen = open
        document.documentElement.dataset.dial = open ? 'open' : ''
        // the navbar cannot rely on scroll order to notice this
        window.dispatchEvent(new Event('montiro:dial'))
      }
      if (cp <= 0) {
        circle.style.opacity = '0'
        return
      }
      const box = anchor.getBoundingClientRect()
      const cx = box.left
      const cy = box.top
      const w = window.innerWidth
      const h = window.innerHeight
      const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy))
      const r = cp * reach * 1.06
      // clip-path on a plain full-screen div: it can never stick out past the
      // viewport, and the compositor only re-clips instead of repainting a
      // full-screen gradient on every frame
      circle.style.opacity = '1'
      circle.style.clipPath = `circle(${r.toFixed(0)}px at ${cx.toFixed(0)}px ${cy.toFixed(0)}px)`
    }

    const tick = () => {
      current += (target - current) * 0.13
      apply(current)
      if (Math.abs(target - current) > 0.0003) {
        frame = requestAnimationFrame(tick)
      } else {
        current = target
        apply(current)
        running = false
        frame = 0
      }
    }

    const measure = () => {
      const rect = runway.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      target = travel > 0 ? clamp01(-rect.top / travel) : 0
      if (!running) {
        running = true
        frame = requestAnimationFrame(tick)
      }
    }

    measure()
    current = target
    apply(current)

    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      delete document.documentElement.dataset.dial
    }
  }, [])

  const mediaClass = 'h-[38vh] sm:h-[48vh] md:h-[82vh] w-auto max-w-full object-contain block'

  return (
    <div ref={runwayRef} className={`relative ${still ? '' : 'h-[180dvh]'}`}>
      <section
        className="sticky top-0 z-0 w-full overflow-hidden h-screen bg-[#0C0D10]"
        style={{ height: '100dvh' }}
      >
        <StudioBackdrop />

        <div className="relative z-10 h-full max-w-7xl mx-auto px-5">
          <div className="h-full grid grid-cols-1 md:grid-cols-2 items-center gap-2 md:gap-10 pt-16 pb-10 md:py-0 text-center md:text-left">
            {/* ── copy ──────────────────────────────────────────────── */}
            <div ref={copyRef} className="order-2 md:order-1">
              <p
                className="hero-anim hero-fade text-xs tracking-[0.32em] text-[#7C838C] mb-7"
                style={{ animationDelay: '0.15s' }}
              >
                ПЕТРОПАВЛОВСК
              </p>

              <h1 className="text-[#F4F6F8] leading-[1.05]">
                <span
                  className="hero-anim hero-reveal block text-4xl sm:text-6xl md:text-7xl"
                  style={{ animationDelay: '0.25s' }}
                >
                  <Wordmark tracking="0.1em" />
                </span>
                <span
                  className="hero-anim hero-reveal block font-extralight text-base sm:text-2xl tracking-[0.26em] sm:tracking-[0.34em] text-[#C3C8CE] mt-4 sm:mt-5"
                  style={{ animationDelay: '0.42s' }}
                >
                  НАРУЧНЫЕ ЧАСЫ
                </span>
              </h1>

              <p
                className="hero-anim hero-fade text-sm sm:text-base font-light text-[#C3C8CE]/65 leading-relaxed max-w-sm mt-6 sm:mt-8 mx-auto md:mx-0"
                style={{ animationDelay: '0.7s' }}
              >
                Небольшой магазин с личным отбором моделей. Доставка по Казахстану, оплата Kaspi
                или наличными.
              </p>

              <div
                className="hero-anim hero-fade flex flex-wrap gap-3 mt-7 sm:mt-9 justify-center md:justify-start"
                style={{ animationDelay: '0.85s' }}
              >
                <Link
                  to="/catalog"
                  className="bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-all hover:scale-[1.03] active:scale-95"
                >
                  Каталог
                </Link>
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors"
                >
                  Написать
                </a>
              </div>
            </div>

            {/* ── the piece ─────────────────────────────────────────── */}
            <div className="order-1 md:order-2 flex items-center justify-center min-h-0">
              <div
                ref={zoomRef}
                className="relative"
                style={{ transformOrigin: `${DIAL_X * 100}% ${DIAL_Y * 100}%` }}
              >
                <div style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}>
                  <img src={watchPoster} alt="Наручные часы Montiro" className={mediaClass} />
                </div>

                {/* marks the dial centre through every transform */}
                <span
                  ref={anchorRef}
                  aria-hidden="true"
                  className="absolute w-0 h-0"
                  style={{ left: `${DIAL_X * 100}%`, top: `${DIAL_Y * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* the dial opening up into the next section */}
        <div
          ref={circleRef}
          aria-hidden="true"
          className="absolute inset-0 z-20 pointer-events-none opacity-0"
          style={{ background: DIAL_WHITE, clipPath: 'circle(0px at 50% 50%)' }}
        />

        {/* scroll cue */}
        <div
          className="hero-anim hero-fade absolute bottom-5 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-3 pointer-events-none"
          style={{ animationDelay: '1.3s' }}
          aria-hidden="true"
        >
          <span className="text-[10px] tracking-[0.3em] text-[#7C838C]/60">ЛИСТАЙТЕ</span>
          <span className="h-10 w-px bg-gradient-to-b from-[#C3C8CE]/40 to-transparent" />
        </div>
      </section>
    </div>
  )
}
