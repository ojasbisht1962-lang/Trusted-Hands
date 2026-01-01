"""
Fix MongoDB index issue - make google_id sparse so multiple null values are allowed
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def main():
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    users_collection = db["users"]
    
    print("Fixing google_id index...")
    
    # Drop the old index
    try:
        await users_collection.drop_index("google_id_1")
        print("✅ Dropped old google_id index")
    except Exception as e:
        print(f"⚠️  Could not drop index (may not exist): {e}")
    
    # Create sparse unique index (allows multiple null values)
    await users_collection.create_index("google_id", unique=True, sparse=True)
    print("✅ Created new sparse unique index on google_id")
    
    # Ensure email is unique
    try:
        await users_collection.create_index("email", unique=True)
        print("✅ Email index already exists or created")
    except Exception as e:
        print(f"⚠️  Email index: {e}")
    
    print("\n✅ Database indexes fixed! You can now signup with email.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
