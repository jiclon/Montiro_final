# Backend

Здесь твой Python / FastAPI. Папка пустая специально — фронт её не трогает.

Что от неё ждёт фронтенд:

| Метод | Путь             | Ответ                          |
| ----- | ---------------- | ------------------------------ |
| GET   | `/products`      | список товаров                 |
| GET   | `/products/{id}` | один товар, 404 если не найден |

Поля товара:

```
id, brand, name, price, category, in_stock,
image, images, old_price, description,
mechanism, case_material, strap_material
```

Цены: если `old_price` заполнен — фронт покажет его зачёркнутым рядом с `price`.
Если пустой — только `price`. Проценты скидки нигде не считаются, всё берётся
из твоей админки.

Холодный старт Render учтён на фронте: скелетоны, ретрай с таймаутом, фолбэк на
заглушки вместо пустой страницы.

Если раздаёшь собранный фронт (`frontend/dist`) через FastAPI на Windows —
зарегистрируй MIME-типы через `mimetypes.add_type` **до** монтирования
`StaticFiles`: `application/javascript` для `.js` и `.mjs`, `text/css` для
`.css`. Иначе браузер отвергнет модули с ошибкой про `application/octet-stream`.
