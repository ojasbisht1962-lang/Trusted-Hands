import asyncio
from app.database import get_collection, connect_to_mongo
from app.models.user import UserRole
from datetime import datetime
import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

async def create_test_users():
    await connect_to_mongo()
    users_collection = await get_collection("users")
    
    # First, check existing users
    print("\n=== Existing Users ===")
    async for user in users_collection.find({}):
        print(f"Email: {user.get('email')}, Role: {user.get('role')}, Has Password: {'password' in user}")
    
    print("\n=== Creating/Updating Test Users ===")
    
    # Update existing customer with password
    customer_email = "gbisht2005@gmail.com"  # Existing customer
    await users_collection.update_one(
        {"email": customer_email},
        {"$set": {"password": hash_password("password123"), "updated_at": datetime.utcnow()}}
    )
    print(f"✓ Updated customer password: {customer_email} / password123")
    
    # Update existing tasker with password
    tasker_email = "5133.stpeterschd@gmail.com"  # Existing tasker
    await users_collection.update_one(
        {"email": tasker_email},
        {"$set": {"password": hash_password("password123"), "updated_at": datetime.utcnow()}}
    )
    print(f"✓ Updated tasker password: {tasker_email} / password123")
    
    print("\n=== Test Credentials ===")
    print(f"Customer: {customer_email} / password123")
    print(f"Tasker: {tasker_email} / password123")

if __name__ == "__main__":
    asyncio.run(create_test_users())
