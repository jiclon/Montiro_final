from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models import User
from security import read_token
from database import SessionLocal 

security_scheme = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security_scheme), db: Session = Depends(get_db)):
    username = read_token(creds.credentials)

    if not username:
        raise HTTPException(
            status_code=401,
            detail="Недействительный токен"
        )

    db_login = db.query(User).filter(User.username == username).first()

    if not db_login:
        raise HTTPException(
            status_code=401,
            detail="Недействительный токен"
        )

    return db_login


