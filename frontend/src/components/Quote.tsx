import { useEffect, useRef, useState } from 'react'

const QUOTE = 'Время не ждёт. Его можно только носить с собой.'
const WORDS = QUOTE.split(' ')

/** How many words are in the middle of lighting up at any moment. */
const SPREAD = 4

function LiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span className="text-[#C9A86A] tabular-nums">
      {now.toLocaleTimeString('ru-RU', { hour12: false })}
    </span>
  )
}

export default function Quote() {
  const blockRef = useRef<HTMLQuoteElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const block = blockRef.current
    if (!block) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const el of wordRefs.current) if (el) el.style.opacity = '1'
      return
    }

    let frame = 0
    const update = () => {
      frame = 0
      const rect = block.getBoundingClientRect()
      const viewport = window.innerHeight
      const travel = viewport * 0.55 + rect.height
      const progress = Math.min(Math.max((viewport * 0.82 - rect.top) / travel, 0), 1)
      const head = progress * (WORDS.length + SPREAD)

      wordRefs.current.forEach((el, i) => {
        if (!el) return
        const local = (head - i) / SPREAD
        el.style.opacity = String(Math.min(Math.max(local, 0.08), 1))
      })
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
  }, [])

  return (
    <section className="py-20 md:py-44 px-5 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs tracking-[0.25em] text-[#7C838C]/70 mb-7 md:mb-10">О времени</p>

        <blockquote
          ref={blockRef}
          className="font-extralight text-[1.7rem] sm:text-5xl md:text-[4.2rem] leading-[1.2] sm:leading-[1.16] text-[#F4F6F8]"
          style={{ letterSpacing: '-0.02em' }}
        >
          {WORDS.map((word, i) => (
            <span
              key={`${word}-${i}`}
              ref={(el) => {
                wordRefs.current[i] = el
              }}
              className="qword"
            >
              {word}
              {i < WORDS.length - 1 ? ' ' : ''}
            </span>
          ))}
        </blockquote>

        <div className="mt-10 md:mt-14 flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="h-px w-16 bg-[#C9A86A]/50" />
          <p className="text-sm text-[#7C838C]/85">
            Сейчас в Петропавловске <LiveClock />
          </p>
        </div>
      </div>
    </section>
  )
}
