# Montiro — project rules

## Repository layout

```
montiro/
├── frontend/   React 18 + TS + Vite + Tailwind — mine
├── backend/    Python / FastAPI — the user's, do not write it
└── CLAUDE.md   this file
```

Every frontend path below is relative to `frontend/` (so `src/components/Hero.tsx`
means `frontend/src/components/Hero.tsx`). Never create files under `backend/`.

## Backend — NOT MINE. Never write Python.

The user writes the backend himself in Python/FastAPI. **Do not write any Python.**
If something is needed on the API side, describe what the endpoint should return
in plain language and let the user build it.

API base: `https://montiro.onrender.com`

| Method | Path             | Returns                       |
| ------ | ---------------- | ----------------------------- |
| GET    | `/products`      | list of products              |
| GET    | `/products/{id}` | one product, 404 if not found |

Product fields:

```
id, brand, name, price, category, in_stock,
image, images, old_price, description,
mechanism, case_material, strap_material
```

## Price rules

- `old_price` filled → render struck through next to `price`.
- `old_price` empty → render `price` only.
- **No hardcoded discount percentages anywhere.** Prices are managed in the
  user's admin panel. Never compute or display a "-30%" badge.

## Cold start handling (Render free tier)

The API sleeps after inactivity; the first request can take up to a minute.
Every fetch must: show a loading state (skeletons, never a blank screen), retry
with a timeout, and fall back to placeholder content rather than an empty page.

## Data layer — one file only

`src/lib/api.ts` is the **only** place that calls `fetch`. Pages and components
go through `src/hooks/useProducts.ts` (`useProducts()`, `useProduct(id)`), which
returns `{ data, loading, error: 'network' | 'notfound' | null, retry }`.
Never add a `fetch` anywhere else.

```ts
const API_BASE = VITE_API_BASE ?? (DEV ? '/api' : 'https://montiro.onrender.com')
```

In development the default is `/api`, which `vite.config.ts` proxies to
`http://127.0.0.1:8000` (override with `VITE_API_TARGET`). Same origin, so the
browser runs no CORS check and the user's local FastAPI needs no CORS config at
all — he hit that wall once and it cost a round trip. Production builds have no
proxy and go straight to the live API, so **CORS is still required on the
deployed backend**. `VITE_API_BASE` overrides the whole thing.

Every field is normalized defensively, because the admin panel can write messy
values: prices parse from strings (`"39 900"`), `in_stock` accepts `"true"` / `1`,
`images` accepts an array, a JSON string, a comma list or nothing. `old_price` is
kept **only if it is greater than `price`** — so a stray `0` or an equal value
never renders a fake discount. Broken image URLs fall back to
`src/assets/watch-still.jpg`. Retries: `ATTEMPT_TIMEOUTS = [12s, 25s, 45s]`;
a 404 throws `NotFoundError` immediately and is never retried.

## Routing

`BrowserRouter`, routes declared in `App.tsx`:

| Route          | Page                        |
| -------------- | --------------------------- |
| `/`            | `src/pages/Home.tsx`        |
| `/catalog`     | `src/pages/Catalog.tsx`     |
| `/product/:id` | `src/pages/ProductPage.tsx` |
| `/help`        | `src/pages/Help.tsx`        |
| `/cart`        | `src/pages/Cart.tsx`        |
| `/checkout`    | `src/pages/Checkout.tsx`    |
| `/order`       | `src/pages/OrderPlaced.tsx` |
| `/offer`       | `src/pages/Legal.tsx`       |
| `/privacy`     | `src/pages/Legal.tsx`       |
| `/admin/*`     | `src/pages/admin/Admin.tsx` |
| `*`            | `src/pages/NotFound.tsx`    |

`App.tsx` splits at the top: `/admin/*` renders the admin, everything else the
shop. The admin has no navbar, no footer and no Lenis — it is a tool.

**The whole catalog filter state lives in the URL**, so a filtered view can be
sent to a customer as a plain link:

| Param  | Meaning                                                  |
| ------ | -------------------------------------------------------- |
| `q`    | free text, matched against `brand + name`                 |
| `c`    | category                                                  |
| `b`    | brand                                                     |
| `min`  | lowest price                                              |
| `max`  | highest price                                             |
| `sort` | `price-asc` \| `price-desc` \| `name`, default in-stock first |

The grid is **two cards per row on a phone** (`grid-cols-2 lg:grid-cols-3`) —
the user asked for it directly. The gap shrinks with the screen
(`gap-x-3 sm:gap-x-6`) so the columns keep their width, and the card's own
container queries step the brand line, badge and price down for the narrower
card. Verified 320→1440: no overflow, two up to 1023px, three above.

A key is dropped from the URL when it returns to its default, so a clean view
has a clean address. **Categories, brands and the price bounds are all derived
from the returned data, never hardcoded** — a new brand in the admin panel
appears on its own. An unknown value in the URL falls back to "Все" rather than
rendering an empty page. Default sort puts what can actually be bought today
first; `in_stock: false` sinks to the bottom.

Lenis is created once in `App.tsx` and kept in a ref; a `Scrolling` component
jumps to the top (or to a hash target) one rAF after a route change — letting
the browser do it fights Lenis and lands halfway.

Deploying needs an SPA rewrite so `/catalog` and `/product/5` serve
`index.html`. `public/_redirects` covers Netlify/Cloudflare; nginx needs
`try_files $uri /index.html;`, `vite preview` needs `--single`.

## Payment & checkout — NOT BUILT YET (remember, build later)

There is **no online payment gateway**. Payment runs through Kaspi:

1. Customer places an order on the site.
2. The owner sends them a Kaspi invoice request to their phone number.
3. Customer confirms it in the Kaspi app.
4. Owner ships.

So the site **never processes money**. Checkout collects the order and the phone
number the invoice will be sent to. Nothing else.

Built on 22 Sep 2026. The cart lives in `src/lib/cart.tsx` (React context),
persists through `localStorage` under `montiro.cart.v1`, and every read and
write is wrapped — a private window or blocked storage just means the cart
lasts one visit. The original "React state only, no localStorage" rule was
true of the chat preview, not of the real site; the user chose persistence on
12 Sep 2026.

Pages: `/cart`, `/checkout`, `/order` (confirmation), plus a real `/404`.
Adding works from the product card (a round button on the plate — it must
`preventDefault`, the card is a `<Link>`) and from the product page.

### The order goes to the server, WhatsApp is the rescue

`src/lib/orders.ts` holds **the switch**, and it is the only thing to touch
when the backend is ready:

```ts
export const ORDERS = { enabled: false, path: '/orders', timeout: 20_000 }
```

- `enabled: false` — no request is made at all; the order opens as a ready
  WhatsApp message. This is the state while the user is still writing the
  endpoint.
- `enabled: true` — `POST {API_BASE}/orders` with exactly this body:

```json
{ "customer_name": "", "phone": "", "delivery_type": "pickup" | "delivery",
  "address": null, "comment": null, "items": [{ "product_id": 1, "quantity": 1 }] }
```

Numeric ids are sent as numbers. 201 returns the order, and `id` becomes the
number shown on the confirmation. **400 and 422 are not retried** — the data
is wrong, repeating it changes nothing. Anything else (timeout, 5xx, no
answer) means the order reached nobody, and only then does the checkout show
"Не удалось оформить заказ" with a WhatsApp button carrying the whole order as
text, keeping the cart so the buyer can retry.

WhatsApp is **not** an ordering path anywhere else: no "Заказать в WhatsApp"
on the card, the product page or the confirmation screen.

### Wording the user specified, do not paraphrase

- The phone field is labelled **НОМЕР KASPI**, never "Телефон" — otherwise
  people leave any number and the invoice goes to the wrong phone. Hint under
  it: "На этот номер придёт счёт в Kaspi".
- Above the submit button: "После оформления я отправлю счёт на ваш номер
  Kaspi. Подтвердите оплату в приложении — и я отправлю заказ."
- Confirmation heading "Заказ принят", the server's number, and "Счёт придёт
  на ваш номер в Kaspi в течение дня. Подтвердите оплату в приложении."

### Still missing

An order that is placed exists only in the server's database and in the
confirmation's navigation state — reloading `/order` loses the details (the
screen says so). There is no order lookup for the buyer, and no admin panel;
the user enters products through `/docs` and has no photo upload, so `image`
holds a ready HTTPS link.

## Admin panel — `/admin`

Built 26 Sep 2026, inside the same app (the user chose that over a separate
build). `src/lib/auth.tsx` holds the token in `localStorage`
(`montiro.admin.token`); `guard()` runs a call and signs out when the server
answers 401/403.

`src/lib/admin.ts` holds **the second switch — one flag per endpoint**:

```ts
export const ADMIN = {
  login: true,         // POST   /login
  createProduct: true, // POST   /products          (Bearer)
  updateProduct: true, // PATCH  /products/{id}     (Bearer)
  deleteProduct: true, // DELETE /products/{id}     (Bearer)
  orders: true,        // GET    /orders            (Bearer)
  orderStatus: true,   // PATCH  /orders/{id}       (Bearer)
}
```

A false flag does not hide the screen — it disables the control and says which
endpoint is missing, so the owner can see what he is waiting for. Flip to true
when that endpoint answers; all six were tested against a mock that implements
them exactly as specified.

- **Login is JSON only**: `{"username": "...", "password": "..."}` →
  `{"access_token": "...", "token_type": "bearer"}`. The form-encoded attempt
  that was here first is gone — the user's endpoint does not take it. On
  `/login` a 401 means wrong password, **not** an expired session.
- **Updating a product is `PATCH`, not `PUT`, and partial.**
  `changedFields()` in `admin.ts` diffs the form against how it opened and
  sends only what moved — editing a price sends `{"price": 77700}` and nothing
  else. Saving an untouched form sends no request at all.
- **Products** (`AdminProducts.tsx`): list, create, edit, delete. The image
  field is a URL with a live preview beside it that says outright when the
  address does not load — the user lost a day to `src/assets/…` in a database
  row, and this is what stops that repeating.
- **Orders** (`AdminOrders.tsx`): list, expand one, change status. Names and
  prices are joined from the catalog by `product_id`; a product since deleted
  shows as "нет в каталоге" rather than breaking the total.
- Statuses are exactly the six the backend stores, and these keys are not
  negotiable — **`awaiting`, and `canceled` with one L**:

  | key | подпись |
  | --- | --- |
  | `new` | Новый |
  | `awaiting` | Счёт выставлен |
  | `paid` | Оплачен |
  | `shipped` | Отправлен |
  | `done` | Завершён |
  | `canceled` | Отменён |

  `PATCH /orders/{id}` takes `{"status": "..."}`. `GET /orders` returns
  `OrderRead`: `id, customer_name, phone, delivery_type, status, address,
  comment, created_at, items[{id, product_id, quantity}]`. Names and prices are
  joined from the catalog by `product_id` — the order itself carries neither.

The guard is only about what to render — **the real protection is the backend
refusing writes without a valid Bearer token.**

## Legal pages

`/offer` and `/privacy`, both from `src/pages/Legal.tsx`, linked in the footer.
Written plainly and matched to how the shop actually works (no gateway, Kaspi
invoice, 14 days, 6 months, replicas stated openly).

**`SELLER` at the top of that file still has placeholders** — ИИН/БИН and email.
They must be filled in before the site goes live, and the text is not a
lawyer's draft.

## Frontend stack

React 18 + TypeScript + Vite + Tailwind CSS 3 + lucide-react + lenis, all under
`frontend/`. Run everything from that directory.

## Mobile

The user called the adaptive layout out once — keep checking it. Phone-side
rules already in place: the fixed bar takes a blurred background once scrolled
and has a working slide-down menu; section padding drops to roughly half on
small screens; the footer contact column goes full width so the phone numbers
fit; CTA and Featured buttons stack full width. Verify at 390px before shipping
anything new.

## Identity — matches the printed business card

- Wordmark: **MONTIRO**, light geometric sans, wide tracking, uppercase, with the
  first **O replaced by a clock face**. Sub-line `WATCH`, location
  `PETROPAVLOVSK`. Implemented in `src/components/Wordmark.tsx`.
- Typeface: **Jost** throughout (200/300 for display, wide letter-spacing).
  Bodoni Moda is still imported and `.font-bodoni` still exists, but the brand
  does **not** use it — the card is geometric, not editorial.

## Palette — near-black studio, warmed by gold

The blue experiment was rejected: it did not sit with the black-and-white
business card. The site is dark again, but lit like a product shoot rather than
painted flat black.

```
--ink    #0C0D10   page base
--deep   #08090B   deeper pools, vignette
--raise  #16181C   cards, raised surfaces
--line   #262A30   borders
--mist   #7C838C   muted text
--steel  #C3C8CE   secondary text
--bright #F4F6F8   headings
--gold   #C9A86A   accent
```

- **No orange. No blue. No pure black, no pure white.** Depth comes from the
  studio lighting in `StudioBackdrop`, not from lightening the base colour.
- Gold is the only warm colour: dial wordmark, second hand, subdial hands, lume
  on the markers, small numerals, thin accent rules, hover states.

## Watch media — real footage, no more SVG

The hand-drawn SVG watch is gone. It read as an illustration and the user
rejected it. The hero now plays a real 4.5s loop of a black-cased, white-dial
watch (`src/assets/watch-loop.mp4`, 347 KB, muted/looped/playsinline, poster
`watch-poster.jpg`); `Story.tsx` uses the matching still (`watch-still.jpg`).

Both were generated in Kling from a text prompt, then processed here: Kling
watermarks painted out / cropped off, the loop given a 0.5s cross-dissolve from
tail to head so it repeats seamlessly, audio stripped.

- The dial is deliberately **blank** — AI mangles lettering. A MONTIRO wordmark
  can be overlaid in code if wanted; it is not there yet.
- Media sits under an elliptical `mask-image` (`EDGE_MASK` in `Hero.tsx`) so its
  black background dissolves into the page instead of showing a rectangle. The
  mask radius must stay at/below 50% of the box or the fade never completes and
  a hard edge appears.
- `prefers-reduced-motion` swaps the video for the poster still.
- When the user supplies photography of his own stock, it replaces the same two
  files.

## CSS — use the modern features, not the 2018 workarounds

The user asked for this explicitly and knows the modern syntax, so do not
reach for the old workaround. The bottom of `index.css` is the "modern CSS
layer". What is in use, and what each thing replaced:

| Feature | Where | Replaced |
| --- | --- | --- |
| `oklch()` palette | `:root` | hex, which told you nothing about relative lightness |
| `color-mix(in oklab, …)` | accents, focus ring | hand-picked rgba values |
| `:has()` | `.filter-card`, `.card` | lifting state into React to style a parent |
| `:focus-within` | `.search-field` | a focus/blur handler |
| `:focus-visible` | global ring | `:focus`, which fired on mouse clicks too |
| container queries + `cqw` | `.card`, `.card-name` | viewport breakpoints inside a grid |
| `aspect-ratio` | `.card-plate` | fixed pixel heights per breakpoint |
| `clamp()` | `.t-display` | `text-4xl sm:text-5xl md:text-6xl` |
| `text-wrap: balance` / `pretty` | headings, paragraphs | manual `<br>` and shrugging |
| `line-clamp` | `.clamp-2` | JS truncation |
| `tabular-nums`, `slashed-zero` | `.figure` (all prices) | prices drifting out of line |
| `@property` | `--pool` on the card plate | a gradient that snapped instead of moving |
| `animation-timeline: view()` | `.rise` on catalog cards | IntersectionObserver |
| `linear()` easing | `.menu-pop` | `cubic-bezier`, which cannot overshoot and settle |
| `mix-blend-mode` | giant footer wordmark | a flat grey tint |
| `dvh` | hero runway | `vh`, which the mobile URL bar desyncs |

Rules that come with this:

- Anything not yet everywhere gets an `@supports` fallback. This is a shop;
  someone will open it on an old phone.
- **A scroll-driven `animation-range` must finish inside `entry`.** A range
  reaching into `cover` never completes for an element that is already on
  screen and cannot be scrolled past — with one product in the catalog the card
  would stay invisible for good. Verified at viewport heights 700–2400 with one
  product and with six.
- Native `@layer` is deliberately **not** used. Tailwind v3 emits its utilities
  unlayered, and unlayered CSS beats layered CSS no matter the order — putting
  this file in a layer would silently lose every override (`.filter-card:has()`
  vs `border-white/[0.09]`, and so on). Revisit if the project moves to
  Tailwind v4.
- `@scope` and `color-contrast()` are skipped for now: `@scope` is not in every
  browser the shop needs, `color-contrast()` has not shipped at all.

## Motion

Everything respects `prefers-reduced-motion`.

- **Nothing jumps.** No somersault, no bounce, no hover animation that moves the
  watch. The user rejected all of it twice — do not reintroduce.
- **The hero scrolls *into* the dial.** `Hero.tsx` is a 170vh runway with a
  sticky 100vh stage. Scrolling turns the watch and pulls the camera toward the
  dial; from ~32% a circle of `DIAL_WHITE` grows out of the dial centre (tracked
  by a zero-size anchor inside the transformed box, so it follows every
  transform) until it fills the screen. The screen is then *inside* the dial,
  and `Featured.tsx` is painted that same white — the two are seamless.
  The raw scroll position is eased toward each frame (lerp) so it glides rather
  than tracking the wheel step for step.
- The hands move because the footage is real. There is no `--spin` mechanism any
  more — it only existed for the SVG.
- Section reveals, marquee, giant footer wordmark.
- **Never let anything overflow horizontally — the real cause was the grids.**
  A `grid-cols-12` with `gap-8` needs 11 × 32px = 352px for its gaps alone. On a
  351px phone the columns collapse and the row itself becomes 352px wide, which
  pushed the page sideways and left a dark strip down the right edge. Every
  12-column grid is now `grid-cols-1 md:grid-cols-12` (Footer: `grid-cols-2`),
  and children carry only `md:col-span-*`. **Never put `grid-cols-12` on a
  mobile breakpoint.**
  Two things that are *not* the fix and must not come back:
  - `overflow-x: hidden` on `<html>`. It forces `overflow-y` to compute to
    `auto`, reserving a scrollbar gutter — the fixed navbar still spans the full
    viewport while every section stops short of it, which looks exactly like the
    bug it was meant to hide.
  - `overflow-x: clip` on a wrapper. It silently cut the right half of the page
    off with no way to scroll to it.
  The dial overlay uses `clip-path: circle()` on a plain `absolute inset-0` div —
  it cannot overflow, so nothing needs clipping.
- The hero runway is sized in `dvh` to match its `100dvh` child, or the mobile
  URL bar desyncs the two and the dial stops covering the screen. 180dvh gives
  roughly 80dvh of travel, which reads well on both a phone and a wide desktop.

## Page order

Hero (dark) → **Featured** (light, the inside of the dial) → dark curtain with
Story, Steps, Quote, CTA, Footer.

Copy on the **left**, watch on the **right** in the hero (mobile: watch above,
text below, centred).

`Featured.tsx` is the light section. It now pulls the real catalog and shows the
first product that is in stock, linking to its page. `PLACEHOLDER` in that file
is only the fallback for while the server is asleep — the section must never
collapse into an empty white screen, since it is what the dial transition lands
on. Price rules are implemented there as everywhere else (struck-through
`old_price`, no discount percentages).

`DIAL_WHITE` (`#F2F1EC`) is exported from `Hero.tsx` and must stay identical in
both files or the transition shows a seam.

The navbar flips to dark ink over the light section. It reads
`document.documentElement.dataset.dial === 'open'`, which `Hero.tsx` sets while
the dial is covering the screen, and falls back to the `#featured` rect.
When there is no `#featured` on the page (every route except home) it **must**
reset to the light skin — an early `return` there left the bar in dark ink after
navigating away from home, i.e. black on black: the user reported the logo
missing on the catalog page.

Navbar links are **sections of the site, not catalog categories**: Главная,
Каталог, Доставка (`/help#delivery`), Поддержка (`/help`). The hardcoded
Классика / Спорт / Новинки were removed — the user disliked them and categories
belong on the catalog page, derived from the data. The filled pill follows the
current route (`activeIndex` in `Navbar.tsx`).

`Select.tsx` is the site's own dropdown. A native `<select>` was used first and
the user rejected it on sight — the OS renders that list itself, grey and
square, and it looked nothing like the page. Use this component for any future
dropdown: solid `#16181C` panel (no `backdrop-filter`), gold check on the
selected row, closes on outside click and Escape, arrows and Enter work.

`PillButton.tsx` ("Смотреть каталог" in `Story` and `CTA`) rendered a bare
`<button>` with no handler — it looked like a call to action and did nothing.
It is a router `Link` now (`to`, default `/catalog`, or `href` for external).
**Every clickable thing must lead somewhere** — check new ones before shipping.
WhatsApp addresses come from `src/lib/contacts.ts`, never inline.

`Help.tsx` is plain copy, no API: доставка, оплата через Kaspi, гарантия, обмен
и возврат, о товаре (honest note that these are replicas), контакты. Each block
carries an `id` so the navbar and footer can link straight into it. Footer links
all point at real routes now — they used to be dead `#catalog` anchors.

## Sections

Hero → Featured (light) → Story → **Steps** → Quote → CTA → Footer.

`Steps.tsx` replaced an earlier `Stats.tsx` counter strip: the numbers were
placeholders that read as zeros and the user asked for it gone. Steps spells out
the real order flow instead — write, look, Kaspi invoice — which matches how the
shop actually works. Do not bring the counters back.

## Contacts — from the business card

- WhatsApp: +7 705 912 6313 → https://wa.me/77059126313
- WhatsApp: +7 776 139 9741 → https://wa.me/77761399741
- Instagram: @montiro.store → https://instagram.com/montiro.store
- TikTok: @montiro_watches → https://tiktok.com/@montiro_watches

No Telegram — the card does not list one.
