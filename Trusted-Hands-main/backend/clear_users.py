"""
Script to view and optionally clear users from the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def main():
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    users_collection = db["users"]
    
    # Get all users
    users = await users_collection.find({}).to_list(length=None)
    
    print(f"\n{'='*60}")
    print(f"Total users in database: {len(users)}")
    print(f"{'='*60}\n")
    
    for i, user in enumerate(users, 1):
        print(f"{i}. {user.get('name', 'N/A')} - {user.get('email', 'N/A')} - Role: {user.get('role', 'N/A')}")
    
    print(f"\n{'='*60}")
    choice = input("\nDo you want to delete all non-admin users? (yes/no): ").strip().lower()
    
    if choice == 'yes':
        # Delete all users except superadmins
        result = await users_collection.delete_many({"role": {"$ne": "superadmin"}})
        print(f"\n✅ Deleted {result.deleted_count} non-admin users")
        
        # Show remaining users
        remaining = await users_collection.count_documents({})
        print(f"Remaining users: {remaining}")
    else:
        print("\n❌ No users deleted")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
