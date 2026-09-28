from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from database import Base
 
class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)

    brand: Mapped[str] = mapped_column(String(80))
    name: Mapped[str] = mapped_column(String(120))
    price: Mapped[int] = mapped_column()
    category: Mapped[str] = mapped_column(String(20))
    in_stock: Mapped[bool] = mapped_column(default=True)
    image: Mapped[str | None] = mapped_column(String(200))
    images: Mapped[str | None] = mapped_column(Text)
    old_price: Mapped[int | None] = mapped_column()
    description: Mapped[str | None] = mapped_column(Text)
    mechanism: Mapped[str | None] = mapped_column(String(60))
    case_material: Mapped[str | None] =  mapped_column(String(60))
    strap_material: Mapped[str | None] = mapped_column(String(60))

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)

    customer_name: Mapped[str] = mapped_column(String(80))
    phone: Mapped[str] = mapped_column(String(20))
    delivery_type: Mapped[str] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(String(200))
    comment: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20),default="new")
    created_at: Mapped[datetime] = mapped_column(default=datetime.now)
    idempotency_key: Mapped[str | None] = mapped_column(String(64),unique=True)
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    order: Mapped["Order"] = relationship(back_populates="items")
    quantity: Mapped[int] = mapped_column(default=1)
    


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    username: Mapped[str] = mapped_column(String(40), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))

    