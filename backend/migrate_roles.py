"""
Migration script to add 'roles' array field to existing users
This will convert the single 'role' field to a 'roles' array for backward compatibility
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def migrate_user_roles():
    """Add roles array to all users who don't have it"""
    # Initialize database connection
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    users_collection = db.users
    
    # Find all users without a roles field or with empty roles
    users_without_roles = await users_collection.find({
        "$or": [
            {"roles": {"$exists": False}},
            {"roles": []},
            {"roles": None}
        ]
    }).to_list(length=None)
    
    print(f"Found {len(users_without_roles)} users without roles array")
    
    updated_count = 0
    for user in users_without_roles:
        user_id = user["_id"]
        current_role = user.get("role")
        
        if current_role:
            # Set roles array to contain the current role
            await users_collection.update_one(
                {"_id": user_id},
                {"$set": {"roles": [current_role]}}
            )
            print(f"Updated user {user.get('email')}: role={current_role}, roles=[{current_role}]")
            updated_count += 1
        else:
            # No role set, initialize as empty array
            await users_collection.update_one(
                {"_id": user_id},
                {"$set": {"roles": []}}
            )
            print(f"Updated user {user.get('email')}: no role, roles=[]")
            updated_count += 1
    
    print(f"\nMigration complete! Updated {updated_count} users")
    
    # Verify the migration
    print("\nVerifying migration...")
    all_users = await users_collection.find({}).to_list(length=None)
    for user in all_users:
        email = user.get("email")
        role = user.get("role")
        roles = user.get("roles", [])
        print(f"  {email}: role={role}, roles={roles}")
    
    # Close the connection
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_user_roles())
