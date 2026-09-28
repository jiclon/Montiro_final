import useReveal from '../hooks/useReveal'
import PillButton from './PillButton'
import { WHATSAPP } from '../lib/contacts'

const MARQUEE = [
  'MONTIRO',
  'НАРУЧНЫЕ ЧАСЫ',
  'ПЕТРОПАВЛОВСК',
  'ДОСТАВКА ПО КАЗАХСТАНУ',
  'ОПЛАТА KASPI',
  'ЛИЧНЫЙ ОТБОР',
]

function MarqueeBand() {
  const run = [...MARQUEE, ...MARQUEE]
  return (
    <div className="relative overflow-hidden border-y border-white/[0.07] py-6 scrollbar-hide">
      <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-10" aria-hidden={copy === 1}>
            {run.slice(0, MARQUEE.length).map((word, i) => (
              <span key={`${copy}-${i}`} className="flex items-center gap-10">
                <span className="font-extralight text-lg sm:text-xl text-[#7C838C]/60 tracking-[0.22em]">
                  {word}
                </span>
                <span className="text-[#C9A86A]/35">·</span>
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0C0D10] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0C0D10] to-transparent pointer-events-none" />
    </div>
  )
}

export default function CTA() {
  const block = useReveal<HTMLDivElement>(0.2)

  return (
    <section id="catalog" className="overflow-hidden">
      <MarqueeBand />

      <div className="max-w-7xl mx-auto px-5 py-20 md:py-40">
        <div
          ref={block.ref}
          className={`hero-anim ${block.inView ? 'hero-fade' : ''} relative rounded-3xl border border-white/10 overflow-hidden`}
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #16181C 0%, #0A0B0E 68%)' }}
        >
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[70%] h-48 rounded-[50%] bg-[#C3C8CE] opacity-[0.05] blur-2xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative px-5 sm:px-12 py-16 md:py-28 text-center">
            <p className="text-xs tracking-[0.25em] text-[#7C838C]/85 mb-5 md:mb-7">Подбор</p>
            <h2 className="text-[#F4F6F8] text-3xl sm:text-5xl md:text-6xl leading-[1.08] sm:leading-[1.05]">
              <span className="block font-light" style={{ letterSpacing: '-0.04em' }}>
                Напишите, что ищете —
              </span>
              <span
                className="block font-extralight text-[#C3C8CE] mt-2"
                style={{ letterSpacing: '-0.03em' }}
              >
                подберу под запрос
              </span>
            </h2>

            <p className="text-[15px] md:text-base text-[#C3C8CE]/70 leading-relaxed max-w-md mx-auto mt-6 md:mt-8">
              Расскажите про бюджет и стиль — пришлю пару вариантов из наличия с живыми фото и
              видео хода.
            </p>

            <div className="mt-9 md:mt-11 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-center">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-all hover:scale-[1.03] active:scale-95"
              >
                Написать в WhatsApp
              </a>
              <PillButton label="Смотреть каталог" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
