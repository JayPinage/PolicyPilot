import asyncio
from getpass import getpass
from sqlalchemy import select

from app.database.connnection import AsyncSessionLocal
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message
from app.Auth.security import verify_password


async def main():
    email = input("Admin email: ").strip().lower()
    password = getpass("Admin password: ")

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == email)
        )

        user = result.scalar_one_or_none()

        if not user:
            print("Admin not found")
            return

        print("Email found:", user.email)
        print("Role:", user.role)
        print("Active:", user.is_active)

        print(
            "Password verification:",
            verify_password(password, user.hashed_password)
        )


asyncio.run(main())