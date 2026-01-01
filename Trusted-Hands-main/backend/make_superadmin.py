"""
Script to promote an existing user to SuperAdmin
Run this to make yourself a SuperAdmin using your email
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB connection string
MONGODB_URI = "mongodb+srv://testUser:testPassword123@clusterone.6a9q0rn.mongodb.net/trustedhands?retryWrites=true&w=majority"

async def make_superadmin():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.trustedhands
    users_collection = db.users
    
    print("\n=== Make User SuperAdmin ===\n")
    print("Enter the email of the user you want to promote to SuperAdmin:")
    user_email = input("Email: ").strip()
    
    if not user_email:
        print("❌ Email cannot be empty!")
        client.close()
        return
    
    # Find the user
    user = await users_collection.find_one({"email": user_email})
    
    if not user:
        print(f"\n❌ No user found with email: {user_email}")
        print("\nAvailable users in database:")
        cursor = users_collection.find({})
        async for u in cursor:
            print(f"  - {u.get('email')} (Role: {u.get('role')})")
        client.close()
        return
    
    print(f"\n✓ Found user:")
    print(f"  Name: {user.get('name')}")
    print(f"  Email: {user.get('email')}")
    print(f"  Current Role: {user.get('role')}")
    
    # Update to superadmin
    result = await users_collection.update_one(
        {"email": user_email},
        {
            "$set": {
                "role": "superadmin",
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        print(f"\n✅ Successfully promoted {user_email} to SuperAdmin!")
        print(f"\nYou can now:")
        print(f"  1. Log out from the application")
        print(f"  2. Log back in with this Google account")
        print(f"  3. Access the SuperAdmin dashboard at http://localhost:3000/admin/dashboard")
    else:
        print(f"\n⚠️  User was already a SuperAdmin or update failed")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(make_superadmin())
