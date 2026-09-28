import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WHATSAPP } from '../lib/contacts'

/**
 * One page: how the shop handles the four things it asks for.
 *
 * ┌─ ЗАПОЛНИТЬ ПЕРЕД ПУБЛИКАЦИЕЙ ──────────────────────────────────┐
 * │ Имя и контакт — это всё, что здесь нужно. Без ИИН и БИН.       │
 * └────────────────────────────────────────────────────────────────┘
 */
const SELLER = {
  name: 'Укажите ваше имя',
  phone: '+7 705 912 63 13',
  email: 'укажите почту',
}

const UPDATED = '27 сентября 2026'

const BLOCKS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: 'Кто обрабатывает данные',
    paragraphs: [
      `${SELLER.name}, магазин наручных часов MONTIRO, Петропавловск.`,
      `Связаться: ${SELLER.phone} (WhatsApp), ${SELLER.email}.`,
    ],
  },
  {
    heading: 'Какие данные собираем',
    paragraphs: [
      'Только то, что вы указываете при оформлении заказа: имя, номер телефона, адрес доставки и комментарий к заказу.',
      'Платёжные данные мы не собираем — оплата проходит в Kaspi, карта вводится там, а не на сайте.',
    ],
  },
  {
    heading: 'Зачем они нужны',
    paragraphs: [
      'Чтобы оформить заказ, связаться с вами, выставить счёт в Kaspi и доставить посылку. Для рассылок и рекламы данные не используются.',
    ],
  },
  {
    heading: 'Кому передаём',
    paragraphs: [
      'Никому, кроме службы доставки — ей уходит имя, телефон и адрес получателя, без этого посылку не отправить.',
      'Рекламных трекеров на сайте нет.',
    ],
  },
  {
    heading: 'Как удалить свои данные',
    paragraphs: [
      `Напишите на ${SELLER.phone} или ${SELLER.email} — удалим по запросу.`,
      'Корзина хранится в вашем же браузере и никуда не отправляется, пока вы не оформили заказ. Очистка данных сайта в браузере стирает её полностью.',
    ],
  },
]

export default function Legal() {
  useEffect(() => {
    document.title = 'Политика конфиденциальности — MONTIRO'
    return () => {
      document.title = 'MONTIRO — наручные часы'
    }
  }, [])

  return (
    <main className="relative z-20 bg-[#0C0D10] min-h-screen">
      <div className="max-w-7xl mx-auto px-5 pt-28 md:pt-36 pb-24 md:pb-32">
        <p className="text-xs tracking-[0.32em] text-[#7C838C]">ДОКУМЕНТЫ</p>
        <h1 className="t-display text-[#F4F6F8] font-extralight mt-5">
          Политика конфиденциальности
        </h1>
        <p className="text-[13px] text-[#7C838C] mt-5">Редакция от {UPDATED}</p>

        <div className="mt-12 md:mt-16 space-y-11 md:space-y-14 max-w-3xl">
          {BLOCKS.map((block, i) => (
            <section key={block.heading}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-10">
                <div className="md:col-span-1">
                  <span className="figure text-xs tracking-[0.2em] text-[#C9A86A]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="md:col-span-11 min-w-0">
                  <h2 className="text-xl md:text-2xl font-light text-[#F4F6F8]">
                    {block.heading}
                  </h2>
                  {block.paragraphs.map((text) => (
                    <p
                      key={text.slice(0, 40)}
                      className="text-[15px] text-[#C3C8CE]/65 leading-relaxed mt-4"
                    >
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="border border-white/10 rounded-3xl p-7 md:p-9 mt-16 max-w-3xl">
          <p className="text-[15px] text-[#C3C8CE]/65 leading-relaxed">
            Вопрос по данным — напишите, отвечу лично.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="text-center bg-[#F4F6F8] text-[#0C0D10] text-sm px-8 py-3.5 rounded-full hover:bg-[#C9A86A] transition-colors"
            >
              WhatsApp
            </a>
            <Link
              to="/catalog"
              className="text-center border border-white/20 text-[#F4F6F8] text-sm px-8 py-3.5 rounded-full hover:border-[#C9A86A]/70 hover:text-[#C9A86A] transition-colors"
            >
              В каталог
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
