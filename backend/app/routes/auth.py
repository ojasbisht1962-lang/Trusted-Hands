from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.services.google_auth import verify_google_token
from app.database import get_collection
from app.models.user import User, UserRole
from app.utils.auth import create_access_token
from app.middleware.auth import get_current_user
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
        
        current_role = existing_user.get("role")
        requested_role = request.role.value
        
        # Handle role management
        if current_role == UserRole.SUPERADMIN.value:
            # SuperAdmin role is locked - cannot change or add other roles
            update_operations = {
                "$set": {
                    "updated_at": datetime.utcnow(),
                    "name": google_user_info["name"],
                    "profile_picture": google_user_info.get("profile_picture", ""),
                    "role": UserRole.SUPERADMIN.value,
                    "roles": [UserRole.SUPERADMIN.value]
                }
            }
        else:
            # Initialize roles array if it doesn't exist (for backward compatibility)
            if "roles" not in existing_user or not existing_user.get("roles"):
                # First time migration: set roles to array containing current role
                initial_roles = [current_role] if current_role else []
                update_operations = {
                    "$set": {
                        "updated_at": datetime.utcnow(),
                        "name": google_user_info["name"],
                        "profile_picture": google_user_info.get("profile_picture", ""),
                        "role": requested_role,
                        "roles": initial_roles
                    },
                    "$addToSet": {"roles": requested_role}
                }
            else:
                # Normal flow: add new role using $addToSet (prevents duplicates)
                update_operations = {
                    "$set": {
                        "updated_at": datetime.utcnow(),
                        "name": google_user_info["name"],
                        "profile_picture": google_user_info.get("profile_picture", ""),
                        "role": requested_role
                    },
                    "$addToSet": {"roles": requested_role}
                }
        
        # Update user
        await users_collection.update_one(
            {"_id": existing_user["_id"]},
            update_operations
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
            roles=[request.role.value],  # Initialize with selected role
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

@router.post("/switch-role")
async def switch_role(role: UserRole, current_user: dict = Depends(get_current_user)):
    """Switch between user's available roles without re-logging in"""
    
    users_collection = await get_collection("users")
    user = await users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is blocked
    if user.get("is_blocked", False):
        raise HTTPException(
            status_code=403,
            detail="Your account has been blocked."
        )
    
    # Get user's available roles
    available_roles = user.get("roles", [user.get("role")])
    
    # Check if requested role is available
    if role.value not in available_roles:
        raise HTTPException(
            status_code=403,
            detail=f"You don't have access to {role.value} role. Please login as {role.value} first."
        )
    
    # SuperAdmin cannot switch roles
    if user.get("role") == UserRole.SUPERADMIN.value:
        raise HTTPException(
            status_code=403,
            detail="SuperAdmin role cannot be switched."
        )
    
    # Update current active role
    await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {
            "role": role.value,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Fetch updated user
    updated_user = await users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    updated_user["_id"] = str(updated_user["_id"])
    
    # Create new token with updated role
    access_token = create_access_token(
        data={"sub": str(current_user["_id"]), "role": role.value},
        expires_delta=timedelta(minutes=30)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": updated_user,
        "message": f"Switched to {role.value} role successfully"
    }
