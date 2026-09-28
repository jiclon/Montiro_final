from pydantic import BaseModel
from datetime import datetime

class ProductRead(BaseModel):
    id: int
    brand: str
    name: str
    price: int
    category: str
    in_stock: bool
    image: str | None
    images: str | None
    old_price: int | None
    description: str | None
    mechanism: str | None
    case_material: str | None
    strap_material: str | None
    model_config = {"from_attributes": True}

class ProductUpdate(BaseModel):
    brand: str | None = None
    name: str | None = None
    price: int | None = None
    category: str | None = None
    in_stock: bool | None = None
    image: str | None = None
    images: str | None = None
    old_price: int | None = None
    description: str | None = None
    mechanism: str | None = None
    case_material: str | None = None
    strap_material: str | None = None

class ProductCreate(BaseModel):
    brand: str
    name: str
    price: int
    category: str
    in_stock: bool = True
    image: str | None = None
    images: str | None = None
    old_price: int | None = None
    description: str | None = None
    mechanism: str | None = None
    case_material: str | None = None
    strap_material: str | None = None

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    customer_name: str
    phone: str
    delivery_type: str
    address: str | None = None
    comment: str | None = None
    items: list[OrderItemCreate]
    idempotency_key: str | None = None

class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    model_config = {"from_attributes": True}

class OrderRead(BaseModel):
    id: int
    customer_name: str
    phone: str
    delivery_type: str
    status: str
    address: str | None = None
    comment: str | None = None
    created_at: datetime
    items: list[OrderItemRead]
    model_config = {"from_attributes": True}

class OrderStatusUpdate(BaseModel):
    status: str

class UserCreate(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str