import asyncio
from app.database import get_collection, connect_to_mongo

async def check_services():
    await connect_to_mongo()
    services_collection = await get_collection("services")
    
    print("\n=== Services and Professional Badge Requirements ===\n")
    
    services = await services_collection.find({}).sort("name", 1).to_list(length=None)
    
    if not services:
        print("No services found in database")
        return
    
    requires_badge = []
    no_badge = []
    not_specified = []
    
    for service in services:
        name = service.get('name', 'Unknown')
        category = service.get('category', 'N/A')
        requires = service.get('requires_professional_badge')
        
        if requires is True:
            requires_badge.append(f"  • {name} ({category})")
        elif requires is False:
            no_badge.append(f"  • {name} ({category})")
        else:
            not_specified.append(f"  • {name} ({category}) - Field missing")
    
    print("✅ REQUIRES PROFESSIONAL BADGE:")
    if requires_badge:
        for item in requires_badge:
            print(item)
    else:
        print("  None")
    
    print("\n❌ DOES NOT REQUIRE PROFESSIONAL BADGE:")
    if no_badge:
        for item in no_badge:
            print(item)
    else:
        print("  None")
    
    print("\n⚠️  NOT SPECIFIED (field missing):")
    if not_specified:
        for item in not_specified:
            print(item)
    else:
        print("  None")
    
    print(f"\n📊 Total Services: {len(services)}")

if __name__ == "__main__":
    asyncio.run(check_services())
