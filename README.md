# Montiro

Интернет-магазин наручных часов. Петропавловск, Казахстан.

```
montiro/
├── frontend/        React 18 + TypeScript + Vite + Tailwind — этот репозиторий
├── backend/         Python / FastAPI — твоя часть
├── CLAUDE.md        правила проекта: API, цены, оплата, палитра, анимация
└── README.md        этот файл
```

## Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build → frontend/dist
npm run preview
```

Подробности — в `frontend/README.md`: структура компонентов, как работает вход
в циферблат, где менять цитату и как подставить свои фото.

## Backend

Пустая папка под твой FastAPI. Фронт ждёт его по адресу
`https://montiro.onrender.com`:

| Метод | Путь             | Ответ                                |
| ----- | ---------------- | ------------------------------------ |
| GET   | `/products`      | список товаров                       |
| GET   | `/products/{id}` | один товар, 404 если не найден       |

Поля товара:

```
id, brand, name, price, category, in_stock,
image, images, old_price, description,
mechanism, case_material, strap_material
```

Тип `Product` во фронте (`frontend/src/components/Featured.tsx`) повторяет эти
поля один в один — когда бэк будет готов, секция подключается одним фетчем.

## Что помнить про оплату

Онлайн-эквайринга нет. Заказ оформляется на сайте, счёт выставляется в Kaspi на
номер телефона, покупатель подтверждает его в приложении. **Сайт не проводит
деньги** — только собирает заказ и номер. Подробнее в `CLAUDE.md`.
