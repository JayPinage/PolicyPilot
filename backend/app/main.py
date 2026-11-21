from fastapi import FastAPI
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message

from app.Auth.routes import router as auth_router
from app.api.chat import router as chat_router
from app.api.document import router as documents_router

app = FastAPI(title="PolicyPilot")


app.include_router(documents_router)

app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {"message": "PolicyPilot API is running"}