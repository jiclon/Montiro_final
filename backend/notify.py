import os
import httpx
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


def send_telegram(text: str) -> None:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        httpx.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": text}, timeout=5)
    except httpx.HTTPError:
        pass


def format_order(order, products: dict) -> str:
    lines = [
        f"🛒 Новый заказ №{order.id}",
        "",
        f"Имя: {order.customer_name}",
        f"Телефон: {order.phone}",
        f"Доставка: {order.delivery_type}",
    ]
    if order.address:
        lines.append(f"Адрес: {order.address}")
    if order.comment:
        lines.append(f"Комментарий: {order.comment}")

    lines.append("")
    total = 0
    for item in order.items:
        product = products[item.product_id]
        item_sum = product.price * item.quantity
        total += item_sum
        lines.append(f"• {product.brand} {product.name} × {item.quantity} — {item_sum} ₸")

    lines.append("")
    lines.append(f"Итого: {total} ₸")
    return "\n".join(lines)

