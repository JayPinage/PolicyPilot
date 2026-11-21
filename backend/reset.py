import asyncio
from getpass import getpass
from sqlalchemy import select

from app.database.connnection import AsyncSessionLocal
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message
from app.Auth.security import hash_password, verify_password


async def main():
    email = input("Admin email: ").strip().lower()
    new_password = getpass("New admin password: ")

    if len(new_password) < 5:
        print("Password must contain at least 12 characters")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user:
            print("Admin not found")
            return

        user.hashed_password = hash_password(new_password)

        await db.commit()

        print("Password reset successfully!")
        print(
            "Verification:",
            verify_password(new_password, user.hashed_password)
        )


asyncio.run(main())