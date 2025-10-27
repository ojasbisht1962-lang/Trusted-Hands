
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from app.middleware.auth import require_superadmin
from app.database import get_collection
from app.models.user import UserRole, VerificationStatus
from app.models.service import ServiceCategory, PriceRange
from app.services.notification_service import create_notification
from app.models.notification import NotificationType
from datetime import datetime
from bson import ObjectId
import secrets

router = APIRouter(prefix="/admin", tags=["Admin"])

# Delete user route for admin
@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_superadmin)):
    users_collection = await get_collection("users")
    result = await users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

class UpdateVerificationRequest(BaseModel):
    status: VerificationStatus
    notes: Optional[str] = None

class BlockUserRequest(BaseModel):
    reason: str

class UpdateTaskerTypeRequest(BaseModel):
    tasker_type: str

class PriceRangeRequest(BaseModel):
    category: ServiceCategory
    min_price: float
    max_price: float
    recommended_price: Optional[float] = None

@router.get("/stats")
async def get_admin_stats(current_user: dict = Depends(require_superadmin)):
    """Get overall platform statistics"""
    users_collection = await get_collection("users")
    bookings_collection = await get_collection("bookings")
    services_collection = await get_collection("services")
    amc_collection = await get_collection("amc")
    
    # Multi-role compatible queries - check both roles array and role field
    total_customers = await users_collection.count_documents({
        "$or": [{"roles": UserRole.CUSTOMER.value}, {"role": UserRole.CUSTOMER.value}]
    })
    total_taskers = await users_collection.count_documents({
        "$or": [{"roles": UserRole.TASKER.value}, {"role": UserRole.TASKER.value}]
    })
    total_professionals = await users_collection.count_documents({
        "$or": [{"roles": UserRole.TASKER.value}, {"role": UserRole.TASKER.value}],
        "professional_badge": True
    })
    total_helpers = await users_collection.count_documents({
        "$or": [{"roles": UserRole.TASKER.value}, {"role": UserRole.TASKER.value}],
        "tasker_type": "helper"
    })
    
    pending_verifications = await users_collection.count_documents({
        "$or": [{"roles": UserRole.TASKER.value}, {"role": UserRole.TASKER.value}],
        "verification_status": VerificationStatus.PENDING.value
    })
    
    total_bookings = await bookings_collection.count_documents({})
    pending_bookings = await bookings_collection.count_documents({"status": "pending"})
    completed_bookings = await bookings_collection.count_documents({"status": "completed"})
    
    total_services = await services_collection.count_documents({"is_active": True})
    
    total_amc_requests = await amc_collection.count_documents({})
    pending_amc = await amc_collection.count_documents({"status": "pending"})
    
    return {
        "users": {
            "total_customers": total_customers,
            "total_taskers": total_taskers,
            "professionals": total_professionals,
            "helpers": total_helpers
        },
        "verifications": {
            "pending": pending_verifications
        },
        "bookings": {
            "total": total_bookings,
            "pending": pending_bookings,
            "completed": completed_bookings
        },
        "services": {
            "total": total_services
        },
        "amc": {
            "total": total_amc_requests,
            "pending": pending_amc
        }
    }

@router.get("/users")
async def get_all_users(
    role: Optional[UserRole] = None,
    is_blocked: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_superadmin)
):
    """Get all users with filters"""
    users_collection = await get_collection("users")
    
    query = {}
    if role:
        query["role"] = role.value
    if is_blocked is not None:
        query["is_blocked"] = is_blocked
    
    cursor = users_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    users = await cursor.to_list(length=limit)
    
    for user in users:
        user["_id"] = str(user["_id"])
    
    total = await users_collection.count_documents(query)
    
    return {
        "users": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/taskers/pending-verification")
async def get_pending_verifications(
    current_user: dict = Depends(require_superadmin)
):
    """Get taskers with pending verification"""
    users_collection = await get_collection("users")
    
    cursor = users_collection.find({
        "$or": [{"roles": UserRole.TASKER.value}, {"role": UserRole.TASKER.value}],
        "verification_status": VerificationStatus.PENDING.value
    }).sort("created_at", 1)
    
    taskers = await cursor.to_list(length=100)
    
    for tasker in taskers:
        tasker["_id"] = str(tasker["_id"])
    
    return taskers

@router.put("/taskers/{tasker_id}/verification")
async def update_verification_status(
    tasker_id: str,
    verification_data: UpdateVerificationRequest,
    current_user: dict = Depends(require_superadmin)
):
    """Approve or reject tasker verification"""
    users_collection = await get_collection("users")
    
    try:
        tasker = await users_collection.find_one({
            "_id": ObjectId(tasker_id),
            "$or": [{"roles": UserRole.TASKER.value}, {"role": UserRole.TASKER.value}]
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid tasker ID")
    
    if not tasker:
        raise HTTPException(status_code=404, detail="Tasker not found")
    
    update_data = {
        "verification_status": verification_data.status.value,
        "updated_at": datetime.utcnow()
    }
    
    if verification_data.status == VerificationStatus.APPROVED:
        update_data["professional_badge"] = True
    
    result = await users_collection.update_one(
        {"_id": ObjectId(tasker_id)},
        {"$set": update_data}
    )
    
    # Notify tasker
    notification_type = (
        NotificationType.VERIFICATION_APPROVED 
        if verification_data.status == VerificationStatus.APPROVED 
        else NotificationType.VERIFICATION_REJECTED
    )
    
    message = (
        "Congratulations! Your professional verification has been approved."
        if verification_data.status == VerificationStatus.APPROVED
        else f"Your professional verification has been rejected. {verification_data.notes or ''}"
    )
    
    await create_notification(
        user_id=tasker_id,
        notification_type=notification_type,
        title=f"Verification {verification_data.status.value.title()}",
        message=message,
        link="/tasker/profile"
    )
    
    updated_tasker = await users_collection.find_one({"_id": ObjectId(tasker_id)})
    updated_tasker["_id"] = str(updated_tasker["_id"])
    
    return updated_tasker

@router.put("/users/{user_id}/block")
async def block_user(
    user_id: str,
    block_data: BlockUserRequest,
    current_user: dict = Depends(require_superadmin)
):
    """Block a user"""
    users_collection = await get_collection("users")
    
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["role"] == UserRole.SUPERADMIN.value:
        raise HTTPException(status_code=403, detail="Cannot block superadmin")
    
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_blocked": True, "updated_at": datetime.utcnow()}}
    )
    
    # Notify user
    await create_notification(
        user_id=user_id,
        notification_type=NotificationType.ACCOUNT_BLOCKED,
        title="Account Blocked",
        message=f"Your account has been blocked. Reason: {block_data.reason}",
        link="/contact-support"
    )
    
    return {"message": "User blocked successfully"}

@router.put("/users/{user_id}/unblock")
async def unblock_user(
    user_id: str,
    current_user: dict = Depends(require_superadmin)
):
    """Unblock a user"""
    users_collection = await get_collection("users")
    
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_blocked": False, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "User unblocked successfully"}

@router.put("/users/{user_id}/tasker-type")
async def update_tasker_type(
    user_id: str,
    update_data: UpdateTaskerTypeRequest,
    current_user: dict = Depends(require_superadmin)
):
    """Change tasker type between helper and professional"""
    users_collection = await get_collection("users")
    
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["role"] != UserRole.TASKER.value:
        raise HTTPException(status_code=400, detail="User is not a tasker")
    
    if update_data.tasker_type not in ["helper", "professional"]:
        raise HTTPException(status_code=400, detail="Invalid tasker type")
    
    update_fields = {
        "tasker_type": update_data.tasker_type,
        "updated_at": datetime.utcnow()
    }
    
    # If upgrading to professional
    if update_data.tasker_type == "professional":
        update_fields["work_as_professional"] = True
        update_fields["professional_badge"] = True
        update_fields["verification_status"] = VerificationStatus.APPROVED.value
        
        # Generate referral code if doesn't exist
        if not user.get("referral_code"):
            update_fields["referral_code"] = f"TH{secrets.token_hex(4).upper()}"
        
        # Notify tasker
        await create_notification(
            user_id=user_id,
            notification_type=NotificationType.VERIFICATION_APPROVED,
            title="Upgraded to Professional",
            message="Congratulations! Your account has been upgraded to Professional status by admin.",
            link="/tasker/profile"
        )
    else:
        # Downgrading to helper
        update_fields["work_as_professional"] = False
        update_fields["professional_badge"] = False
        update_fields["verification_status"] = VerificationStatus.NOT_APPLIED.value
        
        # Notify tasker
        await create_notification(
            user_id=user_id,
            notification_type=NotificationType.VERIFICATION_REJECTED,
            title="Changed to Helper",
            message="Your account has been changed to Helper status by admin.",
            link="/tasker/profile"
        )
    
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update tasker type")
    
    updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    updated_user["_id"] = str(updated_user["_id"])
    
    return updated_user

@router.get("/price-ranges")
async def get_price_ranges(current_user: dict = Depends(require_superadmin)):
    """Get all price ranges"""
    price_ranges_collection = await get_collection("price_ranges")
    
    cursor = price_ranges_collection.find({})
    price_ranges = await cursor.to_list(length=100)
    
    for pr in price_ranges:
        pr["_id"] = str(pr["_id"])
    
    return price_ranges

@router.post("/price-ranges")
async def create_price_range(
    price_range_data: PriceRangeRequest,
    current_user: dict = Depends(require_superadmin)
):
    """Create or update price range for a service category"""
    price_ranges_collection = await get_collection("price_ranges")
    
    if price_range_data.min_price >= price_range_data.max_price:
        raise HTTPException(status_code=400, detail="Min price must be less than max price")
    
    # Check if price range already exists
    existing = await price_ranges_collection.find_one({
        "category": price_range_data.category.value
    })
    
    if existing:
        # Update existing
        result = await price_ranges_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "min_price": price_range_data.min_price,
                "max_price": price_range_data.max_price,
                "recommended_price": price_range_data.recommended_price,
                "updated_at": datetime.utcnow()
            }}
        )
        price_range_id = str(existing["_id"])
    else:
        # Create new
        new_price_range = PriceRange(
            category=price_range_data.category,
            min_price=price_range_data.min_price,
            max_price=price_range_data.max_price,
            recommended_price=price_range_data.recommended_price,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        result = await price_ranges_collection.insert_one(
            new_price_range.dict(by_alias=True, exclude={"id"})
        )
        price_range_id = str(result.inserted_id)
    
    price_range = await price_ranges_collection.find_one({"_id": ObjectId(price_range_id)})
    price_range["_id"] = str(price_range["_id"])
    
    return price_range

@router.delete("/price-ranges/{category}")
async def delete_price_range(
    category: ServiceCategory,
    current_user: dict = Depends(require_superadmin)
):
    """Delete price range for a category"""
    price_ranges_collection = await get_collection("price_ranges")
    
    result = await price_ranges_collection.delete_one({"category": category.value})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Price range not found")
    
    return {"message": "Price range deleted successfully"}

@router.get("/bookings")
async def get_all_bookings(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_superadmin)
):
    """Get all bookings"""
    bookings_collection = await get_collection("bookings")
    
    query = {}
    if status:
        query["status"] = status
    
    cursor = bookings_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
    bookings = await cursor.to_list(length=limit)
    
    # Get additional details
    users_collection = await get_collection("users")
    services_collection = await get_collection("services")
    
    for booking in bookings:
        booking["_id"] = str(booking["_id"])
        
        # Get customer
        customer = await users_collection.find_one({"_id": ObjectId(booking["customer_id"])})
        if customer:
            booking["customer"] = {
                "_id": str(customer["_id"]),
                "name": customer["name"],
                "email": customer["email"]
            }
            # Add flattened fields
            booking["customer_name"] = customer["name"]
            booking["customer_email"] = customer["email"]
        
        # Get tasker
        tasker = await users_collection.find_one({"_id": ObjectId(booking["tasker_id"])})
        if tasker:
            booking["tasker"] = {
                "_id": str(tasker["_id"]),
                "name": tasker["name"],
                "email": tasker["email"]
            }
            # Add flattened fields
            booking["tasker_name"] = tasker["name"]
            booking["tasker_email"] = tasker["email"]
        
        # Get service
        service = await services_collection.find_one({"_id": ObjectId(booking["service_id"])})
        if service:
            booking["service"] = {
                "_id": str(service["_id"]),
                "title": service["title"],
                "category": service["category"]
            }
            # Add flattened fields
            booking["service_name"] = service["title"]
            booking["service_category"] = service["category"]
        
        # Map backend fields to frontend expected fields
        booking["total_price"] = booking.get("total_amount", 0)
        booking["booking_date"] = booking.get("date")
        booking["scheduled_date"] = booking.get("date")
        booking["booking_time"] = booking.get("time_slot")
        booking["scheduled_time"] = booking.get("time_slot")
        
        # Ensure status is preserved - MongoDB should store it as string already
        # But explicitly ensure it's a string value in case it's stored differently
        if "status" not in booking or booking["status"] is None:
            booking["status"] = "pending"  # Default fallback
        else:
            # Convert to string and ensure lowercase
            booking["status"] = str(booking["status"]).lower()
    
    total = await bookings_collection.count_documents(query)
    
    return {
        "bookings": bookings,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/services")
async def get_all_services(
    current_user: dict = Depends(require_superadmin)
):
    """Get all services"""
    services_collection = await get_collection("services")
    
    cursor = services_collection.find({}).sort("created_at", -1)
    services = await cursor.to_list(length=200)
    
    # Get tasker details
    users_collection = await get_collection("users")
    
    for service in services:
        service["_id"] = str(service["_id"])
        
        tasker = await users_collection.find_one({"_id": ObjectId(service["tasker_id"])})
        if tasker:
            service["tasker"] = {
                "_id": str(tasker["_id"]),
                "name": tasker["name"],
                "email": tasker["email"]
            }
    
    return services
