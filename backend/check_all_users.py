import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_all_users():
    client = AsyncIOMotorClient("mongodb+srv://ojasbisht1962_db_user:LdYXdQ3eO543G3Ka@clusterone.6a9q0rn.mongodb.net/")
    db = client.trustedhands
    
    print("=== ALL USERS IN DATABASE ===")
    users = await db.users.find().to_list(length=50)
    print(f"Total users found: {len(users)}\n")
    
    for user in users:
        print(f"Name: {user.get('name')}")
        print(f"  _id: {user.get('_id')}")
        print(f"  Role: {user.get('role')}")
        print(f"  Email: {user.get('email')}")
        print(f"  Profile complete: {user.get('profile_completed', False)}")
        print()
    
    client.close()

asyncio.run(check_all_users())
