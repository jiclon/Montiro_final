import { useEffect, useState } from 'react'
import useReveal from '../hooks/useReveal'

type Stat = {
  value: number
  suffix: string
  label: string
  decimals?: number
}

const STATS: Stat[] = [
  { value: 15, suffix: '+', label: 'часов у клиентов' },
  { value: 3, suffix: '', label: 'месяца работы' },
  { value: 1, suffix: '', label: 'день на ответ' },
  { value: 100, suffix: '%', label: 'проверено перед отправкой' },
]

const DURATION = 1800

function Counter({ stat, start }: { stat: Stat; start: boolean }) {
  const [value, setValue] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!start || done) return
    setDone(true)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(stat.value)
      return
    }

    let frame = 0
    const from = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - from) / DURATION, 1)
      const eased = 1 - Math.pow(1 - p, 4)
      setValue(stat.value * eased)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [start, done, stat.value])

  const formatted = stat.decimals
    ? value.toFixed(stat.decimals)
    : Math.round(value).toLocaleString('ru-RU')

  return (
    <>
      {formatted}
      <span className="text-[#C9A86A]">{stat.suffix}</span>
    </>
  )
}

export default function Stats() {
  const block = useReveal<HTMLDivElement>(0.3)

  return (
    <section className="py-6">
      <div ref={block.ref} className="max-w-7xl mx-auto px-5 border-y border-white/[0.07]">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`hero-anim ${block.inView ? 'hero-fade' : ''} py-9 md:py-16 px-2 sm:px-6 ${
                i > 0 ? 'lg:border-l lg:border-white/[0.07]' : ''
              } ${i % 2 === 1 ? 'border-l border-white/[0.07] lg:border-l' : ''}`}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div
                className="font-extralight text-4xl sm:text-5xl md:text-6xl text-[#F4F6F8]/90"
                style={{ letterSpacing: '-0.03em' }}
              >
                <Counter stat={stat} start={block.inView} />
              </div>
              <p className="text-[13px] sm:text-sm text-[#7C838C] mt-3 md:mt-4 leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
