import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check_and_fix_user():
    client = AsyncIOMotorClient("mongodb+srv://ojasbisht1962_db_user:LdYXdQ3eO543G3Ka@clusterone.6a9q0rn.mongodb.net/")
    db = client.trustedhands
    
    print("=== ALL USERS ===")
    users = await db.users.find().to_list(length=50)
    
    for i, user in enumerate(users, 1):
        print(f"\n{i}. Name: {user.get('name')}")
        print(f"   _id: {user.get('_id')}")
        print(f"   Email: {user.get('email')}")
        print(f"   Role: {user.get('role')}")
        print(f"   Profile Complete: {user.get('profile_completed', False)}")
    
    print("\n" + "="*50)
    print("Which user ID should be updated to 'tasker' role?")
    print("(Leave blank if none)")
    
    # For automation, let's update Ojas Bisht (customer) to tasker
    # You can manually change this if needed
    customer_user = None
    for user in users:
        if user.get('role') == 'customer':
            customer_user = user
            break
    
    if customer_user:
        print(f"\n>>> Would update user: {customer_user.get('name')} ({customer_user.get('email')})")
        print(f"    Current role: {customer_user.get('role')}")
        print(f"    New role: tasker")
        
        # Uncomment to actually update
        # result = await db.users.update_one(
        #     {"_id": customer_user["_id"]},
        #     {"$set": {"role": "tasker"}}
        # )
        # print(f"\n✓ User role updated to 'tasker'")
        
        print("\n⚠️  Update commented out for safety. Uncomment lines in script to actually update.")
    else:
        print("\nNo customer user found to update")
    
    client.close()

asyncio.run(check_and_fix_user())
