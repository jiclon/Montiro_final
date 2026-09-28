import { useEffect, useRef } from 'react'
import useReveal from '../hooks/useReveal'
import PillButton from './PillButton'
import watchStill from '../assets/watch-still.jpg'

/** Drifts an element against the scroll. Disabled when motion is reduced. */
function useParallax<T extends HTMLElement>(factor: number) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * factor
      el.style.transform = `translateY(${offset.toFixed(2)}px)`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [factor])

  return ref
}

/** Product plate: the photograph on its own pool of studio light. */
function WatchPlate({ size }: { size: 'big' | 'small' }) {
  const isBig = size === 'big'
  return (
    <div
      className={`w-full ${isBig ? 'h-[320px] sm:h-[420px] md:h-[560px]' : 'h-[220px]'} flex items-center justify-center overflow-hidden`}
      style={{ background: 'radial-gradient(ellipse at 50% 42%, #0A0B0D 0%, #050607 76%)' }}
    >
      <img
        src={watchStill}
        alt="Наручные часы Montiro"
        loading="lazy"
        className={`${isBig ? 'h-[92%]' : 'h-[94%]'} w-auto object-contain`}
        style={{
          maskImage: 'radial-gradient(112% 92% at 50% 50%, #000 60%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'radial-gradient(112% 92% at 50% 50%, #000 60%, rgba(0,0,0,0) 100%)',
        }}
      />
    </div>
  )
}

export default function Story() {
  const header = useReveal<HTMLDivElement>()
  const body = useReveal<HTMLDivElement>()
  const media = useReveal<HTMLDivElement>(0.2)
  const bigImg = useParallax<HTMLDivElement>(-0.05)
  const smallImg = useParallax<HTMLDivElement>(0.04)

  return (
    <section className="py-20 md:py-40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5">
        <div
          ref={header.ref}
          className={`hero-anim ${header.inView ? 'hero-fade' : ''} max-w-3xl`}
        >
          <p className="text-xs tracking-[0.25em] text-[#7C838C] mb-6">Как выбрать</p>
          <h2 className="text-[#F4F6F8] text-3xl sm:text-5xl md:text-7xl leading-[1.06] sm:leading-[1.02]">
            <span className="block font-light" style={{ letterSpacing: '-0.04em' }}>
              Часы выбирают
            </span>
            <span className="block font-extralight text-[#C9A86A]" style={{ letterSpacing: '-0.03em' }}>
              не по картинке
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-10 md:mt-24 items-start">
          <div className="md:col-span-7 min-w-0" ref={media.ref}>
            <div ref={bigImg} className="">
              <div
                className={`img-anim ${media.inView ? 'img-reveal' : ''} relative rounded-3xl overflow-hidden border border-white/10`}
              >
                <WatchPlate size="big" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06070A]/85 via-[#06070A]/20 to-[#06070A]/35" />
                <p className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 text-[11px] md:text-xs text-[#C3C8CE]/70 tracking-wide">
                  Автоматический механизм, сапфировое стекло, сталь 316L
                </p>
              </div>
            </div>
          </div>

          <div
            ref={body.ref}
            className={`md:col-span-5 min-w-0 md:pl-8 lg:pl-14 md:pt-10 hero-anim ${body.inView ? 'hero-fade' : ''}`}
            style={{ animationDelay: '0.15s' }}
          >
            <p className="text-base md:text-xl text-[#C3C8CE]/75 leading-relaxed">
              Каталожное фото не скажет, как часы сидят на руке, сколько весят и как ловят свет.
              Поэтому на любую модель пришлю живое видео — ход секундной стрелки, корпус со всех
              сторон, застёжку крупным планом.
            </p>
            <p className="text-base md:text-xl text-[#C3C8CE]/75 leading-relaxed mt-5 md:mt-6">
              А если вы в Петропавловске — встретимся, примерите и решите на месте.
            </p>

            <div className="mt-8 md:mt-10">
              <PillButton label="Смотреть каталог" />
            </div>

            <div
              ref={smallImg}
              className="mt-10 md:mt-16 md:-ml-24 lg:-ml-32 relative z-10 max-w-[260px] sm:max-w-[320px]"
            >
              <div
                className={`img-anim ${media.inView ? 'img-reveal' : ''} relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]`}
                style={{ animationDelay: '0.25s' }}
              >
                <WatchPlate size="small" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06070A]/85 to-[#06070A]/25" />
                <p className="absolute bottom-4 left-4 text-[11px] text-[#C3C8CE]/70">
                  Живое видео любой модели — по запросу
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
