from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db, get_current_user
from schemas import ProductRead, ProductCreate, ProductUpdate
from models import Product, User

router = APIRouter()

@router.get("/products", response_model=list[ProductRead])
def get_product(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.get("/products/{id}", response_model=ProductRead)
def get_id_product(id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == id).first()

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Товар не найден"
        )

    return db_product


@router.post("/products", response_model=ProductRead, status_code=201)
def create_products(data: ProductCreate,db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if data.price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Цена должна быть больше нуля"
        )

    db_product = Product(**data.model_dump())

    db.add(db_product)
    db.commit()  
    db.refresh(db_product)

    return db_product

@router.patch("/products/{id}", response_model=ProductRead)
def updata_product(id: int, data: ProductUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_search = db.query(Product).filter(Product.id == id).first()

    if not db_search: 
        raise HTTPException(
            status_code=404,
            detail="Товар не найден"
        )

    updates = data.model_dump(exclude_unset=True)

    if "price" in updates and updates["price"] <= 0:
        raise HTTPException(
            status_code=400,
            detail="Цена должна быть больше нуля"
        )
    
    for key, value in updates.items():
        setattr(db_search, key, value)

    db.commit()
    db.refresh(db_search)

    return db_search

@router.delete("/products/{id}", status_code=204)
def delete_product(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_product = db.query(Product).filter(Product.id == id).first()

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="товар не найден"
        )

    db.delete(db_product)
    db.commit()




