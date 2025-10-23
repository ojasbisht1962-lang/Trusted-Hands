"""
Database Initialization Script
This script creates the MongoDB database, collections, indexes, and a SuperAdmin user.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from app.config import settings

# SuperAdmin credentials - Change these after first login!
SUPERADMIN_EMAIL = "admin@trustedhands.com"
SUPERADMIN_GOOGLE_ID = "superadmin_initial_001"
SUPERADMIN_NAME = "Super Admin"

async def init_database():
    """Initialize the database with collections and indexes"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    print(f"🔌 Connecting to MongoDB: {settings.database_name}")
    
    # Create collections
    collections = [
        "users",
        "services",
        "bookings",
        "chats",
        "messages",
        "notifications",
        "amc_contracts",
        "price_ranges"
    ]
    
    existing_collections = await db.list_collection_names()
    
    for collection_name in collections:
        if collection_name not in existing_collections:
            await db.create_collection(collection_name)
            print(f"✅ Created collection: {collection_name}")
        else:
            print(f"ℹ️  Collection already exists: {collection_name}")
    
    # Create indexes
    print("\n📊 Creating indexes...")
    
    # Users collection indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("google_id", unique=True)
    await db.users.create_index("role")
    await db.users.create_index("is_blocked")
    await db.users.create_index("verification_status")
    print("✅ Users indexes created")
    
    # Services collection indexes
    await db.services.create_index("tasker_id")
    await db.services.create_index("category")
    await db.services.create_index("is_active")
    print("✅ Services indexes created")
    
    # Bookings collection indexes
    await db.bookings.create_index("customer_id")
    await db.bookings.create_index("tasker_id")
    await db.bookings.create_index("service_id")
    await db.bookings.create_index("status")
    await db.bookings.create_index("booking_date")
    print("✅ Bookings indexes created")
    
    # Chats collection indexes
    await db.chats.create_index([("participants", 1)])
    print("✅ Chats indexes created")
    
    # Messages collection indexes
    await db.messages.create_index("chat_id")
    await db.messages.create_index("created_at")
    print("✅ Messages indexes created")
    
    # Notifications collection indexes
    await db.notifications.create_index("user_id")
    await db.notifications.create_index("is_read")
    await db.notifications.create_index("created_at")
    print("✅ Notifications indexes created")
    
    # AMC contracts collection indexes
    await db.amc_contracts.create_index("customer_id")
    await db.amc_contracts.create_index("status")
    print("✅ AMC contracts indexes created")
    
    # Price ranges collection indexes
    await db.price_ranges.create_index("service_category", unique=True)
    print("✅ Price ranges indexes created")
    
    # Check if SuperAdmin already exists
    existing_admin = await db.users.find_one({"role": "superadmin"})
    
    if existing_admin:
        print(f"\n⚠️  SuperAdmin already exists: {existing_admin.get('email')}")
        print(f"   Name: {existing_admin.get('name')}")
    else:
        # Create SuperAdmin user
        superadmin_user = {
            "google_id": SUPERADMIN_GOOGLE_ID,
            "email": SUPERADMIN_EMAIL,
            "name": SUPERADMIN_NAME,
            "profile_picture": None,
            "role": "superadmin",
            "phone": None,
            "address": None,
            "is_blocked": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "tasker_type": None,
            "age": None,
            "languages_spoken": [],
            "criminal_record": None,
            "work_as_professional": False,
            "verification_status": "not_applied",
            "referral_code": None,
            "referred_by": None,
            "professional_badge": False,
            "bio": "System SuperAdmin",
            "experience_years": None,
            "skills": [],
            "rating": 0.0,
            "total_jobs": 0
        }
        
        result = await db.users.insert_one(superadmin_user)
        print(f"\n🎉 SuperAdmin user created successfully!")
        print(f"   Email: {SUPERADMIN_EMAIL}")
        print(f"   Name: {SUPERADMIN_NAME}")
        print(f"   Google ID: {SUPERADMIN_GOOGLE_ID}")
        print(f"   User ID: {result.inserted_id}")
        print("\n⚠️  IMPORTANT: To login as SuperAdmin:")
        print("   1. Login with Google using any account")
        print(f"   2. Update that user's role to 'superadmin' in MongoDB")
        print("   3. Or use the pre-created credentials above for testing")
    
    # Insert default price ranges if not exist
    print("\n💰 Setting up default price ranges...")
    
    default_price_ranges = [
        {
            "service_category": "Cleaning",
            "min_price": 500,
            "max_price": 5000,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "service_category": "Plumbing",
            "min_price": 300,
            "max_price": 3000,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "service_category": "Electrical",
            "min_price": 400,
            "max_price": 4000,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "service_category": "Carpentry",
            "min_price": 600,
            "max_price": 6000,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "service_category": "Painting",
            "min_price": 1000,
            "max_price": 10000,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "service_category": "Moving & Packing",
            "min_price": 2000,
            "max_price": 20000,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "service_category": "Appliance Repair",
            "min_price": 300,
            "max_price": 3000,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "service_category": "Pest Control",
            "min_price": 800,
            "max_price": 5000,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "service_category": "Gardening",
            "min_price": 500,
            "max_price": 4000,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "service_category": "Other",
            "min_price": 200,
            "max_price": 10000,
            "currency": "INR",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for price_range in default_price_ranges:
        existing = await db.price_ranges.find_one({"service_category": price_range["service_category"]})
        if not existing:
            await db.price_ranges.insert_one(price_range)
            print(f"✅ Added price range for: {price_range['service_category']}")
        else:
            print(f"ℹ️  Price range already exists: {price_range['service_category']}")
    
    print("\n" + "="*60)
    print("🎉 Database initialization completed successfully!")
    print("="*60)
    print(f"\n📊 Database: {settings.database_name}")
    print(f"📦 Collections: {len(collections)}")
    print(f"💰 Price Ranges: {len(default_price_ranges)}")
    print("\n✨ Your TrustedHands database is ready to use!")
    print("\n🔐 Next Steps:")
    print("   1. Start the backend server: python main.py")
    print("   2. Start the frontend: npm start")
    print("   3. Visit http://localhost:3000")
    print("   4. Login with Google")
    print(f"   5. To make yourself SuperAdmin, update your user role in MongoDB")
    print("\n")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    print("🚀 Starting database initialization...\n")
    asyncio.run(init_database())
