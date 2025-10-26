from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.middleware.auth import get_current_user, require_tasker, require_superadmin
from app.database import get_collection
from app.models.user import User, UserRole, TaskerType, VerificationStatus
from app.services.notification_service import create_notification
from app.models.notification import NotificationType
from datetime import datetime
from bson import ObjectId
import secrets

router = APIRouter(prefix="/users", tags=["Users"])

class UpdateUserProfile(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    languages_spoken: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    tasker_type: Optional[str] = None
    work_as_professional: Optional[bool] = None
    experience_years: Optional[int] = None

class TaskerDetailsRequest(BaseModel):
    age: int
    phone: Optional[str] = None
    address: Optional[str] = None
    languages_spoken: List[str]
    criminal_record: bool
    work_as_professional: bool
    tasker_type: str
    referral_code: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = []

@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    current_user["_id"] = str(current_user["_id"])
    return current_user

@router.get("/{user_id}")
async def get_user_by_id(user_id: str):
    """Get any user by ID"""
    users_collection = await get_collection("users")
    
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="This user is not available")
    
    user["_id"] = str(user["_id"])
    
    # Remove sensitive information
    user.pop("password", None)
    user.pop("google_id", None)
    
    return user

@router.put("/me")
async def update_current_user_profile(
    profile_data: UpdateUserProfile,
    current_user: dict = Depends(get_current_user)
):
    """Update current user profile"""
    users_collection = await get_collection("users")
    
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # If upgrading to professional, set verification status to pending
    if profile_data.tasker_type == "professional" and current_user.get("tasker_type") == "helper":
        update_data["verification_status"] = VerificationStatus.PENDING.value
        
        # Generate referral code if upgrading to professional
        if not current_user.get("referral_code"):
            update_data["referral_code"] = f"TH{secrets.token_hex(4).upper()}"
        
        # Create notification for admin
        await create_notification(
            user_id=str(current_user["_id"]),
            notification_type=NotificationType.VERIFICATION_APPROVED,
            title="Professional Upgrade Request",
            message="Your request to upgrade to professional status has been submitted for review."
        )
    
    result = await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        # Check if no changes were made
        if not update_data:
            raise HTTPException(status_code=400, detail="No changes to update")
    
    updated_user = await users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    updated_user["_id"] = str(updated_user["_id"])
    
    return updated_user

@router.post("/tasker/complete-profile")
async def complete_tasker_profile(
    details: TaskerDetailsRequest,
    current_user: dict = Depends(require_tasker)
):
    """Complete tasker profile with additional details"""
    users_collection = await get_collection("users")
    
    # Validate referral code if professional work is requested
    if details.work_as_professional and details.referral_code:
        referrer = await users_collection.find_one({
            "$or": [{"roles": UserRole.TASKER.value}, {"role": UserRole.TASKER.value}],
            "professional_badge": True,
            "referral_code": details.referral_code
        })
        
        if not referrer:
            raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Determine tasker type and verification status
    tasker_type = details.tasker_type
    verification_status = VerificationStatus.PENDING if details.work_as_professional else VerificationStatus.NOT_APPLIED
    
    # Generate unique referral code for this tasker
    referral_code = f"TH{secrets.token_hex(4).upper()}"
    
    update_data = {
        "age": details.age,
        "phone": details.phone,
        "address": details.address,
        "languages_spoken": details.languages_spoken,
        "criminal_record": details.criminal_record,
        "work_as_professional": details.work_as_professional,
        "tasker_type": tasker_type,
        "verification_status": verification_status.value,
        "bio": details.bio,
        "experience_years": details.experience_years,
        "skills": details.skills,
        "referral_code": referral_code,
        "updated_at": datetime.utcnow()
    }
    
    if details.referral_code:
        update_data["referred_by"] = str(referrer["_id"])
        # If referred by a professional, auto-approve
        update_data["professional_badge"] = True
        update_data["verification_status"] = VerificationStatus.APPROVED.value
    
    result = await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update profile")
    
    # Create notification if verification is pending
    if verification_status == VerificationStatus.PENDING and not details.referral_code:
        await create_notification(
            user_id=str(current_user["_id"]),
            notification_type=NotificationType.VERIFICATION_APPROVED,
            title="Verification Request Submitted",
            message="Your professional verification request has been submitted and is pending review."
        )
    
    updated_user = await users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    updated_user["_id"] = str(updated_user["_id"])
    
    return updated_user

@router.get("/taskers")
async def get_taskers(
    tasker_type: Optional[str] = None,
    location: Optional[str] = None,
    min_rating: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get list of taskers with filters"""
    try:
        users_collection = await get_collection("users")
        
        # Query for users who have tasker in their roles array OR have role=tasker
        query = {
            "$or": [
                {"roles": UserRole.TASKER.value},  # Multi-role users
                {"role": UserRole.TASKER.value}    # Single-role users (backwards compat)
            ],
            "is_blocked": {"$ne": True}
        }
        
        if tasker_type:
            query["tasker_type"] = tasker_type
        
        if location:
            query["address"] = {"$regex": location, "$options": "i"}
        
        if min_rating:
            query["rating"] = {"$gte": min_rating}
        
        cursor = users_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
        taskers = await cursor.to_list(length=limit)
        
        for tasker in taskers:
            tasker["_id"] = str(tasker["_id"])
            # Remove sensitive information
            tasker.pop("password", None)
            tasker.pop("google_id", None)
        
        return taskers
    except Exception as e:
        print(f"Error in get_taskers: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/taskers/{tasker_id}")
async def get_tasker_details(tasker_id: str):
    """Get detailed information about a specific tasker"""
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
    
    if tasker.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="This tasker is not available")
    
    tasker["_id"] = str(tasker["_id"])
    
    # Get tasker's services
    services_collection = await get_collection("services")
    services_cursor = services_collection.find({
        "tasker_id": tasker_id,
        "is_active": True
    })
    services = await services_cursor.to_list(length=100)
    
    for service in services:
        service["_id"] = str(service["_id"])
    
    tasker["services"] = services
    
    return tasker
