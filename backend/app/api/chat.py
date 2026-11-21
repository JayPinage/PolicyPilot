from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connnection import get_db
from app.Auth.dependencies import get_current_user
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message
from app.schemas.chat import ChatCreate, ChatResponse
from app.schemas.message import MessageCreate, MessageResponse

router = APIRouter(prefix="/api/chat", tags=["Chat"])


# Create new chat
@router.post("/", response_model=ChatResponse)
async def create_chat(
    data: ChatCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "employee":
        raise HTTPException(403, "Employees only")

    chat = Chat(
        user_id=current_user.id,
        title=data.title
    )

    db.add(chat)
    await db.commit()
    await db.refresh(chat)

    return chat


# Send message
@router.post("/{chat_id}/messages", response_model=MessageResponse)
async def send_message(
    chat_id: int,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "employee":
        raise HTTPException(403, "Employees only")

    result = await db.execute(
        select(Chat).where(
            Chat.id == chat_id,
            Chat.user_id == current_user.id
        )
    )

    chat = result.scalar_one_or_none()

    if not chat:
        raise HTTPException(404, "Chat not found")

    message = Message(
        chat_id=chat.id,
        role="user",
        content=data.content
    )

    db.add(message)
    await db.commit()
    await db.refresh(message)

    return message


# Get all employee chats
@router.get("/", response_model=list[ChatResponse])
async def get_chats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Chat)
        .where(Chat.user_id == current_user.id)
        .order_by(Chat.updated_at.desc())
    )

    return result.scalars().all()


# Get messages of a specific chat
@router.get("/{chat_id}/messages",
            response_model=list[MessageResponse])
async def get_messages(
    chat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Chat).where(
            Chat.id == chat_id,
            Chat.user_id == current_user.id
        )
    )

    chat = result.scalar_one_or_none()

    if not chat:
        raise HTTPException(404, "Chat not found")

    messages = await db.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at)
    )

    return messages.scalars().all()


# Delete chat
@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Chat).where(
            Chat.id == chat_id,
            Chat.user_id == current_user.id
        )
    )

    chat = result.scalar_one_or_none()

    if not chat:
        raise HTTPException(404, "Chat not found")

    await db.delete(chat)
    await db.commit()

    return {"message": "Chat deleted successfully"}