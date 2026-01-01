"""
Script to create or upgrade a user to SuperAdmin role
Only works for users with authorized email addresses
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from datetime import datetime

# Get MongoDB URL from environment or use default
MONGODB_URL = os.getenv('mongodb_url', 'mongodb+srv://ojasbisht1962_db_user:Password123@clusterone.6a9q0rn.mongodb.net/?appName=ClusterOne')
DATABASE_NAME = 'trustedhands'

# Authorized admin emails
ADMIN_ALLOWED_EMAILS = [
    'shobhitgupat8398@gmail.com',
    'aryaarora.bt24ece@pec.edu.in',
    'ojasbisht1962@gmail.com',
    "aryaarora032006@gmail.com",
    "5133.stpeterschd@gmail.com"
]

async def make_superadmin(email: str):
    """
    Make a user superadmin if their email is authorized
    """
    email = email.strip().lower()
    
    # Validate email is in whitelist
    if email not in ADMIN_ALLOWED_EMAILS:
        print(f"❌ Email '{email}' is not authorized for admin access")
        print(f"   Allowed emails:")
        for allowed_email in ADMIN_ALLOWED_EMAILS:
            print(f"   - {allowed_email}")
        return False
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users_collection = db.users
    
    try:
        # Find user by email
        user = await users_collection.find_one({"email": email})
        
        if not user:
            print(f"❌ User not found with email: {email}")
            print(f"   Please register first at the platform")
            return False
        
        # Update user to superadmin
        result = await users_collection.update_one(
            {"email": email},
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
        
        if result.modified_count > 0:
            print(f"✅ Successfully upgraded {email} to SuperAdmin!")
            print(f"   User ID: {user['_id']}")
            print(f"   Name: {user.get('name', 'N/A')}")
            return True
        else:
            print(f"ℹ️  User {email} is already a SuperAdmin")
            return True
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        client.close()

async def list_superadmins():
    """
    List all current superadmins
    """
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    users_collection = db.users
    
    try:
        admins = await users_collection.find({"role": "superadmin"}).to_list(length=None)
        
        if not admins:
            print("No superadmins found in the database")
            return
        
        print(f"\n📋 Current SuperAdmins ({len(admins)}):")
        print("-" * 60)
        for admin in admins:
            email = admin.get('email', 'N/A').lower()
            authorized = "✅" if email in ADMIN_ALLOWED_EMAILS else "⚠️  UNAUTHORIZED"
            print(f"{authorized} {admin.get('name', 'N/A'):20} | {email:30}")
        print("-" * 60)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        client.close()

async def main():
    print("=" * 60)
    print("🔐 TrustedHands SuperAdmin Management")
    print("=" * 60)
    print(f"Authorized emails:")
    for email in ADMIN_ALLOWED_EMAILS:
        print(f"  - {email}")
    print("=" * 60)
    
    # List current admins
    await list_superadmins()
    
    print("\nOptions:")
    print("1. Make a user SuperAdmin")
    print("2. List all SuperAdmins")
    print("3. Exit")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        email = input("\nEnter user email: ").strip().lower()
        await make_superadmin(email)
    elif choice == "2":
        await list_superadmins()
    elif choice == "3":
        print("Goodbye!")
        return
    else:
        print("Invalid choice")

if __name__ == "__main__":
    asyncio.run(main())
