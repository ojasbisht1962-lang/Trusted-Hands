"""
Script to check if an email is already registered
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def check_email():
    """Check if email exists in database"""
    
    # Get MongoDB connection string
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name = os.getenv("DATABASE_NAME", "trustedhands")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    users_collection = db["users"]
    
    email = input("Enter email to check: ").strip().lower()
    
    user = await users_collection.find_one({"email": email})
    
    if user:
        print(f"\n✅ Email EXISTS in database!")
        print(f"   User ID: {user['_id']}")
        print(f"   Name: {user.get('name', 'N/A')}")
        print(f"   Role: {user.get('role', 'N/A')}")
        print(f"   Roles: {user.get('roles', [user.get('role', 'N/A')])}")
        print(f"   Has Password: {'Yes' if user.get('password') else 'No (Google OAuth only)'}")
        print(f"   Google ID: {user.get('google_id', 'N/A')}")
        print(f"   Blocked: {user.get('is_blocked', False)}")
        
        print("\n💡 Solution: Use a different email OR login with this email")
    else:
        print(f"\n❌ Email NOT found - you can register with this email!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_email())
