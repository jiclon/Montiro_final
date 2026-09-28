from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from models import User, Product, Order, OrderItem
from schemas import OrderCreate, OrderRead, OrderStatusUpdate
from dependencies import get_current_user, get_db
from notify import send_telegram, format_order

router = APIRouter()
ALLOWED_STATUSES = {"new", "awaiting", "paid", "shipped", "done", "canceled"}

@router.post("/orders", response_model=OrderRead, status_code=201)
def create_order(
    data: OrderCreate,
    background_tasks: BackgroundTasks,                     
    db: Session = Depends(get_db),
):
    if data.idempotency_key:
        existing = db.query(Order).filter(Order.idempotency_key == data.idempotency_key).first()
        if existing:
            return existing

    if not data.items:
        raise HTTPException(status_code=400, detail="Корзина пуста")

    products = {}                                         

    for item in data.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Неверное количество")

        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Товар не найден")

        if not product.in_stock:
            raise HTTPException(status_code=400, detail="Товара нет в наличии")

        products[item.product_id] = product                

    order = Order(**data.model_dump(exclude={"items"}))

    for item in data.items:
        order_item = OrderItem(product_id=item.product_id, quantity=item.quantity)
        order.items.append(order_item)

    db.add(order)
    db.commit()
    db.refresh(order)

    text = format_order(order, products)                   #
    background_tasks.add_task(send_telegram, text)        

    return order

@router.get("/orders", response_model=list[OrderRead])
def get_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Order).order_by(Order.created_at.desc()).all()


@router.get("/orders/{id}", response_model=OrderRead)
def get_order_id(id: int,db: Session = Depends(get_db), user: User = Depends(get_current_user)):

    db_order = db.query(Order).filter(Order.id == id).first()

    if not db_order:
        raise HTTPException(
            status_code=404,
            detail="Заказ не найден"
        )

    return db_order

@router.patch("/orders/{id}", response_model=OrderRead)
def update_order(id:int,data: OrderStatusUpdate,db: Session = Depends(get_db), user: User = Depends(get_current_user)):

    db_order = db.query(Order).filter(Order.id == id).first()

    if not db_order:
        raise HTTPException(
            status_code=404,
            detail="Заказ не найден"
        )
    if data.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Неизвестный статус"
        )

    db_order.status = data.status
    db.commit()
    db.refresh(db_order)
    return db_order