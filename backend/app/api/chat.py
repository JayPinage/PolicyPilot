from fastapi import APIRouter, Depends, HTTPException
from langfuse import observe, propagate_attributes
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import json
from fastapi.responses import StreamingResponse

from app.database.connnection import get_db
from app.Auth.dependencies import get_current_user
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message
from app.schemas.chat import ChatCreate, ChatResponse
from app.schemas.message import MessageCreate, MessageResponse
from app.Rag.graph import rag_graph

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


@observe(
    name="policypilot-chat",
    as_type="span",
    capture_input=False,
    capture_output=False
)
async def run_policy_graph(
    question: str,
    chat_history: list,
    user_id: str,
    chat_id: str
):
    with propagate_attributes(
        user_id=user_id,
        session_id=chat_id,
        metadata={"chat_id": chat_id},
        tags=["policypilot", "rag"]
    ):
        return await rag_graph.ainvoke({
            "question": question,
            "search_query": "",
            "context": [],
            "answer": "",
            "chat_history": chat_history,
            "cache_hit": False
        })




@router.post("/{chat_id}/stream")
async def stream_chat(
    chat_id: int,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Employee authentication
    if current_user.role != "employee":
        raise HTTPException(403, "Employees only")

    # 2. Verify chat ownership
    result = await db.execute(
        select(Chat).where(
            Chat.id == chat_id,
            Chat.user_id == current_user.id
        )
    )

    chat = result.scalar_one_or_none()

    if not chat:
        raise HTTPException(404, "Chat not found")

    # 3. Fetch previous conversation
    history_result = await db.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.desc())
        .limit(10)
    )

    previous_messages = list(
        reversed(history_result.scalars().all())
    )

    chat_history = [
        {
            "role": message.role,
            "content": message.content
        }
        for message in previous_messages
    ]

    # 4. Save employee question
    user_message = Message(
        chat_id=chat.id,
        role="user",
        content=data.content
    )

    db.add(user_message)
    await db.commit()

    # 5. Generate and validate complete answer
    try:
        result = await run_policy_graph(
    question=data.content,
    chat_history=chat_history,
    user_id=str(current_user.id),
    chat_id=str(chat.id)
)

        answer = result["answer"]

        if not answer or not answer.strip():
            raise ValueError("Empty generated response")

        # Graph should already perform output and
        # citation validation inside generate_node.

        # 6. Save verified assistant response
        assistant_message = Message(
            chat_id=chat.id,
            role="assistant",
            content=answer
        )

        db.add(assistant_message)
        await db.commit()

    except Exception as e:
        await db.rollback()
        print(f"Error during policy graph execution: {e}")
        fallback_answer = "I'm sorry, but I was unable to verify a policy-grounded response for your inquiry. Please consult the company policy documentation or your HR administrator directly."
        assistant_message = Message(
            chat_id=chat.id,
            role="assistant",
            content=fallback_answer
        )
        db.add(assistant_message)
        await db.commit()
        answer = fallback_answer

    # 7. Stream the verified answer using SSE
    async def generate():

        chunk_size = 20

        for i in range(0, len(answer), chunk_size):

            chunk = answer[i:i + chunk_size]

            yield (
                f"data: {json.dumps({
                    'type': 'token',
                    'content': chunk
                })}\n\n"
            )

        yield (
            f"data: {json.dumps({
                'type': 'done'
            })}\n\n"
        )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )





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