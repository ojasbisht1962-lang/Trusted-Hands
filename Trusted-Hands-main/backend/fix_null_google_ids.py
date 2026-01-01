"""
Fix users with null google_id - remove google_id field from email-based users
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def fix_null_google_ids():
    """Remove google_id field from all email-based users (where google_id is null)"""
    
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    users_collection = db.users
    
    print("Fixing users with null google_id...")
    
    # Find all users with google_id = null
    users_with_null = await users_collection.count_documents({"google_id": None})
    print(f"Found {users_with_null} users with google_id=null")
    
    if users_with_null > 0:
        # Remove the google_id field from these users
        result = await users_collection.update_many(
            {"google_id": None},
            {"$unset": {"google_id": ""}}
        )
        print(f"✅ Updated {result.modified_count} users - removed google_id field")
    else:
        print("✅ No users with null google_id found")
    
    client.close()
    print("\n✅ Database fixed! Email signup should now work.")

if __name__ == "__main__":
    asyncio.run(fix_null_google_ids())
