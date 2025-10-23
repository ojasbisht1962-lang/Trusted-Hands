"""
Script to create a SuperAdmin user in the database
Run this once to create your first SuperAdmin account
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId

# MongoDB connection string
MONGODB_URI = "mongodb+srv://testUser:testPassword123@clusterone.6a9q0rn.mongodb.net/trustedhands?retryWrites=true&w=majority"

async def create_superadmin():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.trustedhands
    users_collection = db.users
    
    # SuperAdmin details (you can customize these)
    superadmin_email = "admin@trustedhands.com"
    
    # Check if superadmin already exists
    existing_admin = await users_collection.find_one({"email": superadmin_email})
    
    if existing_admin:
        print(f"✓ SuperAdmin already exists with email: {superadmin_email}")
        print(f"  User ID: {existing_admin['_id']}")
        print(f"  Name: {existing_admin.get('name', 'N/A')}")
        return
    
    # Create SuperAdmin user
    superadmin = {
        "google_id": "superadmin_" + str(ObjectId()),  # Unique ID
        "email": superadmin_email,
        "name": "Super Admin",
        "role": "superadmin",
        "profile_picture": None,
        "phone": None,
        "is_blocked": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(superadmin)
    
    print("\n✓ SuperAdmin account created successfully!")
    print(f"\nSuperAdmin Details:")
    print(f"  Email: {superadmin_email}")
    print(f"  Name: Super Admin")
    print(f"  Role: superadmin")
    print(f"  User ID: {result.inserted_id}")
    print(f"\nTo access the admin panel:")
    print(f"  1. You'll need to manually set this user in your browser")
    print(f"  2. Or modify the login flow to allow email/password for admins")
    print(f"  3. URL: http://localhost:3000/admin/dashboard")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_superadmin())
