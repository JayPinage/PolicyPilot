from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message

from app.Auth.routes import router as auth_router
from app.api.chat import router as chat_router
from app.api.document import router as documents_router

app = FastAPI(title="PolicyPilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(documents_router)

app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {"message": "PolicyPilot API is running"}