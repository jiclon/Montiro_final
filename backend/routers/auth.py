from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db
from models import User
from schemas import LoginRequest, TokenResponse
from security import check_password, create_token

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == data.username).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Неверный логин или пароль"
        )
    
    if not check_password(data.password, db_user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Неверный логин или пароль"
        )
    
    token = create_token(db_user.username)
    return {"access_token": token, "token_type": "bearer"}


    
    