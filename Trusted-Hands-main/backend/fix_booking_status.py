"""
Migration script to add status field to all bookings that don't have it
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_booking_status():
    # Connect to MongoDB
    mongodb_uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client.get_database("trustedhands")
    bookings_collection = db.get_collection("bookings")
    
    # Find all bookings without a status field or with null status
    query = {"$or": [{"status": {"$exists": False}}, {"status": None}]}
    bookings_without_status = await bookings_collection.count_documents(query)
    
    print(f"Found {bookings_without_status} bookings without status field")
    
    if bookings_without_status > 0:
        # Update all bookings without status to have "pending" status
        result = await bookings_collection.update_many(
            query,
            {"$set": {"status": "pending"}}
        )
        print(f"Updated {result.modified_count} bookings with status='pending'")
    else:
        print("All bookings already have status field!")
    
    # Show all bookings with their status
    print("\nAll bookings status:")
    cursor = bookings_collection.find({})
    bookings = await cursor.to_list(length=100)
    
    for booking in bookings:
        print(f"Booking {str(booking['_id'])[-6:]}: status = {booking.get('status', 'MISSING')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_booking_status())
