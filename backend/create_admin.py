from database import SessionLocal
from models import User
from security import hash_password

login = "Montiro"
password = "ВПИСАТЬ_ПЕРЕД_ЗАПУСКОМ"


db = SessionLocal()

db_user = User(username=login, password_hash=hash_password(password))


db.add(db_user)
db.commit()
db.refresh(db_user)



print(f"Пользователь {db_user.username} создан, id={db_user.id}")
db.close()