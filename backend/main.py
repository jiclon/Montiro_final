import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import products,auth,orders
import models

Base.metadata.create_all(bind=engine)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


app = FastAPI(title="Montiro API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URL.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(auth.router)
app.include_router(orders.router)