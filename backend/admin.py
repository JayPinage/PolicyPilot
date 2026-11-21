
import asyncio
from getpass import getpass
from sqlalchemy import select

from app.database.connnection import AsyncSessionLocal, engine, Base
from app.models.user import User
from app.Auth.security import hash_password

from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message



async def create_admin():

    email = input("Admin email: ").strip().lower()
    full_name = input("Admin name: ").strip()
    password = getpass("Admin password: ")

    if len(password) < 12:
        print("Password must contain at least 12 characters")
        return

    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(User).where(User.email == email)
        )

        if result.scalar_one_or_none():
            print("User already exists")
            return

        admin = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(password),
            role="admin"
        )

        db.add(admin)
        await db.commit()

        print("Admin created successfully!")


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await create_admin()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
