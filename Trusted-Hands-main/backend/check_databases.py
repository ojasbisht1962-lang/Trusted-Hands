import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables
BACKEND_DIR = Path(__file__).resolve().parent
ENV_FILE = BACKEND_DIR / ".env"
load_dotenv(ENV_FILE)

mongodb_url = os.getenv("mongodb_url")

async def check_databases():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(mongodb_url)
    
    try:
        # List all databases
        db_list = await client.list_database_names()
        print(f"\n📁 Found {len(db_list)} databases:\n")
        
        for db_name in db_list:
            if db_name in ['admin', 'local', 'config']:
                continue
                
            print(f"  📊 Database: {db_name}")
            db = client[db_name]
            
            # List collections in this database
            collections = await db.list_collection_names()
            print(f"     Collections: {', '.join(collections) if collections else 'None'}")
            
            # Check for services collection
            if 'services' in collections:
                services_count = await db.services.count_documents({})
                print(f"     ✨ SERVICES FOUND: {services_count} services")
                
                # Show first service as sample
                if services_count > 0:
                    sample = await db.services.find_one()
                    if sample:
                        print(f"     Sample service: {sample.get('title', 'N/A')}")
            
            # Check for users collection
            if 'users' in collections:
                users_count = await db.users.count_documents({})
                print(f"     👥 Users: {users_count}")
            
            # Check for bookings collection
            if 'bookings' in collections:
                bookings_count = await db.bookings.count_documents({})
                print(f"     📅 Bookings: {bookings_count}")
            
            print()
        
        # Check current configured database
        print(f"🔧 Currently configured database: 'trustedhands'")
        current_db = client['trustedhands']
        services_count = await current_db.services.count_documents({})
        print(f"   Services in 'trustedhands': {services_count}\n")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_databases())
