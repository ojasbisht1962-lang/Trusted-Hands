from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None
    
db = Database()

async def get_database():
    return db.client[settings.database_name]

async def connect_to_mongo():
    """Connect to MongoDB"""
    db.client = AsyncIOMotorClient(settings.mongodb_url)
    print("Connected to MongoDB")
    
async def close_mongo_connection():
    """Close MongoDB connection"""
    db.client.close()
    print("Closed MongoDB connection")

# Helper functions
async def get_collection(collection_name: str):
    database = await get_database()
    return database[collection_name]
