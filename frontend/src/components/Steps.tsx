import useReveal from '../hooks/useReveal'

/** The actual order flow — no gateway, the invoice goes out through Kaspi. */
const STEPS = [
  {
    n: '01',
    title: 'Пишете',
    text: 'В WhatsApp — что ищете, под какой бюджет и стиль. Отвечаю в тот же день.',
  },
  {
    n: '02',
    title: 'Смотрите',
    text: 'Присылаю живые фото и видео хода тех моделей, что есть в наличии.',
  },
  {
    n: '03',
    title: 'Забираете',
    text: 'Выставляю счёт в Kaspi на ваш номер, вы подтверждаете — и я отправляю.',
  },
]

export default function Steps() {
  const block = useReveal<HTMLDivElement>(0.2)

  return (
    <section id="how" className="py-6">
      <div ref={block.ref} className="max-w-7xl mx-auto px-5 border-y border-white/[0.07]">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`hero-anim ${block.inView ? 'hero-fade' : ''} py-9 md:py-14 sm:px-6 first:sm:pl-0 ${
                i > 0
                  ? 'border-t sm:border-t-0 sm:border-l border-white/[0.07]'
                  : ''
              }`}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <span className="text-xs tracking-[0.3em] text-[#C9A86A]">{step.n}</span>
              <h3 className="text-2xl md:text-3xl font-light text-[#F4F6F8] mt-4">{step.title}</h3>
              <p className="text-[13px] sm:text-sm text-[#7C838C] mt-3 leading-relaxed max-w-xs">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
