import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_tasker_languages():
    client = AsyncIOMotorClient("mongodb+srv://ojasbisht1962_db_user:LdYXdQ3eO543G3Ka@clusterone.6a9q0rn.mongodb.net/")
    db = client.trustedhands
    
    print("=== CHECKING TASKER PROFILES ===\n")
    
    taskers = await db.users.find({"role": "tasker"}).to_list(length=50)
    
    if not taskers:
        print("No taskers found in database")
    else:
        print(f"Found {len(taskers)} tasker(s):\n")
        
        for i, tasker in enumerate(taskers, 1):
            print(f"{i}. Name: {tasker.get('name')}")
            print(f"   Email: {tasker.get('email')}")
            print(f"   Tasker Type: {tasker.get('tasker_type')}")
            print(f"   Languages Spoken: {tasker.get('languages_spoken', [])}")
            print(f"   Skills: {tasker.get('skills', [])}")
            print(f"   Phone: {tasker.get('phone')}")
            print(f"   Age: {tasker.get('age')}")
            print(f"   Address: {tasker.get('address')}")
            print(f"   Bio: {tasker.get('bio', 'No bio')[:50]}...")
            print(f"   Experience Years: {tasker.get('experience_years')}")
            print()
    
    client.close()

asyncio.run(check_tasker_languages())
