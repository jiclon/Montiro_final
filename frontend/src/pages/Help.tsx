import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { INSTAGRAM, TIKTOK, WHATSAPP, WHATSAPP_SECOND } from '../lib/contacts'

/**
 * One page for everything a buyer asks before paying: delivery, how the Kaspi
 * invoice works, warranty, returns. The navbar links straight to the delivery
 * block (`/help#delivery`), so each section carries its own id.
 *
 * All of this is plain copy — nothing here talks to the API.
 */
const SECTIONS = [
  {
    id: 'delivery',
    title: 'Доставка',
    items: [
      ['По Петропавловску', 'Встречаемся лично — можно посмотреть и примерить перед оплатой. Бесплатно.'],
      ['По Казахстану', 'Отправляю Kazpost или Казпочтой EMS, 2–5 дней в зависимости от города. Стоимость считаю при заказе — она зависит только от тарифа службы, сверху ничего не накидываю.'],
      ['Трек-номер', 'Присылаю в WhatsApp в день отправки.'],
    ],
  },
  {
    id: 'payment',
    title: 'Оплата',
    items: [
      ['Только Kaspi', 'Онлайн-оплаты на сайте нет и карту вводить негде. Вы пишете в WhatsApp, я выставляю счёт в Kaspi на ваш номер, вы подтверждаете его в приложении — и я отправляю.'],
      ['Ничего не списывается само', 'Пока вы не нажали подтверждение в Kaspi, деньги не уходят. Счёт можно просто не принимать.'],
      ['Сайт не хранит платёжные данные', 'Ни номера карты, ни реквизитов — их тут физически негде ввести.'],
    ],
  },
  {
    id: 'warranty',
    title: 'Гарантия',
    items: [
      ['Полгода на механизм', 'Если часы встали не по вашей вине — меняю или чиню за свой счёт.'],
      ['Батарейка', 'На кварцевых меняется бесплатно в течение гарантийного срока, если обратитесь ко мне.'],
      ['Не покрывается', 'Вода в моделях без водозащиты, трещины на стекле, потёртости корпуса и ремня от носки.'],
    ],
  },
  {
    id: 'return',
    title: 'Обмен и возврат',
    items: [
      ['14 дней', 'Если не подошли — обмениваю на другую модель или возвращаю деньги. Часы должны быть без следов носки, с коробкой.'],
      ['Как вернуть', 'Напишите в WhatsApp, договоримся об отправке. Обратную пересылку при возврате по вашему желанию оплачивает покупатель, при браке — я.'],
    ],
  },
  {
    id: 'about',
    title: 'О товаре',
    items: [
      ['Честно о том, что продаю', 'Это реплики, не оригинальная продукция брендов. Я не выдаю их за оригиналы и не продаю с документами оригинала.'],
      ['Каждые проверяю сам', 'Беру небольшими партиями и перед отправкой смотрю ход, завод, ремень и застёжку.'],
    ],
  },
]

export default function Help() {
  useEffect(() => {
    document.title = 'Поддержка — MONTIRO'
    return () => {
      document.title = 'MONTIRO — наручные часы'
    }
  }, [])

  return (
    <main className="relative z-20 bg-[#0C0D10] min-h-screen">
      <div className="max-w-7xl mx-auto px-5 pt-28 md:pt-36 pb-24 md:pb-32">
        <p className="text-xs tracking-[0.32em] text-[#7C838C]">ПОДДЕРЖКА</p>
        <h1
          className="t-display text-[#F4F6F8] font-extralight mt-5"
        >
          Как это работает
        </h1>
        <p className="text-[15px] md:text-base text-[#C3C8CE]/60 leading-relaxed max-w-md mt-6">
          Магазин небольшой, поэтому всё просто и без мелкого шрифта. Если ответа тут нет — просто
          напишите, отвечаю сам.
        </p>

        {/* quick jump */}
        <div className="flex flex-wrap gap-2 mt-10">
          {/* router Links, not bare `#id` anchors — the smooth-scroll instance
              in App.tsx handles the jump, and a native anchor would fight it */}
          {SECTIONS.map((s) => (
            <Link
              key={s.id}
              to={`/help#${s.id}`}
              className="text-sm px-5 py-2 rounded-full border border-white/15 text-[#C3C8CE]/75 hover:border-white/35 hover:text-[#F4F6F8] transition-colors"
            >
              {s.title}
            </Link>
          ))}
        </div>

        <div className="mt-14 md:mt-20 space-y-14 md:space-y-20">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12">
                <h2
                  className="md:col-span-4 min-w-0 text-2xl md:text-3xl font-light text-[#F4F6F8]"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {section.title}
                </h2>

                <dl className="md:col-span-8 min-w-0 border-t border-white/[0.09]">
                  {section.items.map(([term, text]) => (
                    <div key={term} className="py-5 border-b border-white/[0.09]">
                      <dt className="text-[15px] text-[#F4F6F8]">{term}</dt>
                      <dd className="text-sm md:text-[15px] text-[#C3C8CE]/60 leading-relaxed mt-2 max-w-2xl">
                        {text}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          ))}
        </div>

        {/* contacts */}
        <section id="contacts" className="scroll-mt-28 mt-16 md:mt-24">
          <div className="border border-white/10 rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-light text-[#F4F6F8]">Остались вопросы</h2>
            <p className="text-[15px] text-[#C3C8CE]/60 leading-relaxed mt-4 max-w-md">
              Пишите в WhatsApp — отвечаю в тот же день. Живые фото и видео хода любой модели
              пришлю по запросу.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-8">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors"
              >
                +7 705 912 6313
              </a>
              <a
                href={WHATSAPP_SECOND}
                target="_blank"
                rel="noreferrer"
                className="text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors"
              >
                +7 776 139 9741
              </a>
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noreferrer"
                className="text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors"
              >
                Instagram
              </a>
              <a
                href={TIKTOK}
                target="_blank"
                rel="noreferrer"
                className="text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors"
              >
                TikTok
              </a>
            </div>

            <Link
              to="/catalog"
              className="inline-block text-sm text-[#7C838C] hover:text-[#F4F6F8] transition-colors mt-8"
            >
              ← Вернуться в каталог
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
