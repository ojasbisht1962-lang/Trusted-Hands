from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.services.google_auth import verify_google_token
from app.database import get_collection
from app.models.user import User, UserRole
from app.utils.auth import create_access_token
from datetime import datetime, timedelta
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])

class GoogleLoginRequest(BaseModel):
    token: str
    role: UserRole

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/google-login", response_model=LoginResponse)
async def google_login(request: GoogleLoginRequest):
    """Login or register user with Google OAuth"""
    
    # Get user info from Google using access token
    from app.services.google_auth import get_google_user_info
    google_user_info = await get_google_user_info(request.token)
    if not google_user_info:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    # Debug logging
    print(f"Google user info received: {google_user_info}")
    print(f"Profile picture URL: {google_user_info.get('profile_picture')}")
    
    users_collection = await get_collection("users")
    
    # Check if user exists by google_id OR email
    existing_user = await users_collection.find_one({
        "$or": [
            {"google_id": google_user_info["google_id"]},
            {"email": google_user_info["email"]}
        ]
    })
    
    if existing_user:
        # Check if user is blocked
        if existing_user.get("is_blocked", False):
            raise HTTPException(
                status_code=403,
                detail="Your account has been blocked. Please contact support."
            )
        
        # Allow role update if user is trying to become a tasker
        # Keep superadmin role fixed, but allow customer <-> tasker switching
        update_data = {
            "updated_at": datetime.utcnow(),
            "name": google_user_info["name"],
            "profile_picture": google_user_info.get("profile_picture", "")
        }
        
        current_role = existing_user.get("role")
        requested_role = request.role.value
        
        # Allow role changes except for superadmin (which should remain fixed)
        if current_role != UserRole.SUPERADMIN.value:
            # Allow customer to become tasker or vice versa
            if requested_role in [UserRole.CUSTOMER.value, UserRole.TASKER.value]:
                update_data["role"] = requested_role
        
        # Update user
        await users_collection.update_one(
            {"_id": existing_user["_id"]},
            {"$set": update_data}
        )
        
        # Set user_id and fetch updated user_data
        user_id = str(existing_user["_id"])
        user_data = await users_collection.find_one({"_id": existing_user["_id"]})
    else:
        # Create new user
        new_user = User(
            google_id=google_user_info["google_id"],
            email=google_user_info["email"],
            name=google_user_info["name"],
            profile_picture=google_user_info.get("profile_picture", ""),
            role=request.role,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        print(f"Creating new user with profile_picture: {new_user.profile_picture}")
        
        result = await users_collection.insert_one(new_user.dict(by_alias=True, exclude={"id"}))
        user_id = str(result.inserted_id)
        
        user_data = await users_collection.find_one({"_id": result.inserted_id})
        print(f"User data from DB: {user_data}")
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_id, "role": user_data["role"]},
        expires_delta=timedelta(minutes=30)
    )
    
    # Prepare user data for response
    user_data["_id"] = str(user_data["_id"])
    
    return LoginResponse(
        access_token=access_token,
        user=user_data
    )

@router.post("/refresh-token")
async def refresh_token(current_user: dict = Depends(lambda: None)):
    """Refresh access token"""
    # This would typically use a refresh token
    # For now, just create a new access token
    pass
