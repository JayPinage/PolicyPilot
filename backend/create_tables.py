import asyncio

from app.database.connnection import Base, engine

# Import all models
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message
from app.models.documents import Document


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Database tables created successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_tables())