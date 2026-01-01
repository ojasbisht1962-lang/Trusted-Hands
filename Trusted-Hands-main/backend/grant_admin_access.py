"""
Quick script to grant superadmin access to the 3 authorized emails
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

MONGODB_URL = 'mongodb+srv://ojasbisht1962_db_user:Password123@clusterone.6a9q0rn.mongodb.net/?appName=ClusterOne'
DATABASE_NAME = 'trustedhands'

ADMIN_EMAILS = [
    'shobhitgupat8398@gmail.com',
    'aryaarora.bt24ece@pec.edu.in',
    'ojasbisht1962@gmail.com',
    'aryaarora032006@gmail.com',
    '5133.stpeterschd@gmail.com'
]

async def grant_admin_access():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users_collection = db.users
    
    print("=" * 60)
    print("🔐 Granting SuperAdmin Access")
    print("=" * 60)
    
    for email in ADMIN_EMAILS:
        email_lower = email.lower()
        
        # Find user
        user = await users_collection.find_one({"email": email_lower})
        
        if not user:
            print(f"⚠️  {email} - User not found (needs to register first)")
            continue
        
        # Update to superadmin
        await users_collection.update_one(
            {"email": email_lower},
            {
                "$set": {
                    "role": "superadmin",
                    "updated_at": datetime.utcnow()
                },
                "$addToSet": {
                    "roles": "superadmin"
                }
            }
        )
        
        print(f"✅ {email} - Granted SuperAdmin access")
        print(f"   Name: {user.get('name', 'N/A')}")
        print(f"   User ID: {user['_id']}")
    
    print("=" * 60)
    print("✅ Admin access granted successfully!")
    print("\nAuthorized admin emails:")
    for email in ADMIN_EMAILS:
        print(f"  - {email}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(grant_admin_access())
