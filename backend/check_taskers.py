import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_tasker_data():
    client = AsyncIOMotorClient("mongodb+srv://ojasbisht1962_db_user:LdYXdQ3eO543G3Ka@clusterone.6a9q0rn.mongodb.net/")
    db = client.trustedhands
    
    # Check services
    print("=== SERVICES ===")
    services = await db.services.find().to_list(length=5)
    for service in services:
        print(f"\nService: {service.get('title')}")
        print(f"  tasker_id: {service.get('tasker_id')}")
        print(f"  tasker_id type: {type(service.get('tasker_id'))}")
    
    # Check users with role tasker
    print("\n\n=== TASKERS IN USERS COLLECTION ===")
    taskers = await db.users.find({"role": "tasker"}).to_list(length=10)
    print(f"Found {len(taskers)} taskers")
    for tasker in taskers:
        print(f"\nTasker: {tasker.get('name')}")
        print(f"  _id: {tasker.get('_id')}")
        print(f"  _id type: {type(tasker.get('_id'))}")
    
    # Try to find the specific tasker_id from your service
    if services:
        print("\n\n=== CHECKING SPECIFIC TASKER ID ===")
        problem_id = services[0].get('tasker_id')
        print(f"Looking for: {problem_id}")
        
        # Try as string
        user_by_string = await db.users.find_one({"_id": problem_id})
        print(f"Found by string search: {user_by_string is not None}")
        
        # Try converting to ObjectId
        try:
            if isinstance(problem_id, str):
                obj_id = ObjectId(problem_id)
                user_by_objectid = await db.users.find_one({"_id": obj_id})
                print(f"Found by ObjectId search: {user_by_objectid is not None}")
                if user_by_objectid:
                    print(f"User found: {user_by_objectid.get('name')}")
        except Exception as e:
            print(f"Error converting to ObjectId: {e}")
    
    client.close()

asyncio.run(check_tasker_data())
