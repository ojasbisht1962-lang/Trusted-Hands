from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_collection
from app.models.user import User, UserRole
from app.utils.auth import create_access_token
from app.middleware.auth import get_current_user
from datetime import datetime, timedelta
from bson import ObjectId
from app.services.google_auth import get_google_user_info

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
    from app.services.google_auth import get_google_user_info
    google_user_info = await get_google_user_info(request.token)
    if not google_user_info:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    users_collection = await get_collection("users")
    existing_user = await users_collection.find_one({
        "$or": [
            {"google_id": google_user_info["google_id"]},
            {"email": google_user_info["email"]}
        ]
    })
    if existing_user:
        if existing_user.get("is_blocked", False):
            raise HTTPException(status_code=403, detail="Your account has been blocked. Please contact support.")
        current_role = existing_user.get("role")
        requested_role = request.role.value
        if current_role == UserRole.SUPERADMIN.value:
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
            if "roles" not in existing_user or not existing_user.get("roles"):
                initial_roles = []
                if current_role:
                    initial_roles.append(current_role)
                if requested_role not in initial_roles:
                    initial_roles.append(requested_role)
                update_operations = {
                    "$set": {
                        "updated_at": datetime.utcnow(),
                        "name": google_user_info["name"],
                        "profile_picture": google_user_info.get("profile_picture", ""),
                        "role": requested_role,
                        "roles": initial_roles
                    }
                }
            else:
                update_operations = {
                    "$set": {
                        "updated_at": datetime.utcnow(),
                        "name": google_user_info["name"],
                        "profile_picture": google_user_info.get("profile_picture", ""),
                        "role": requested_role
                    },
                    "$addToSet": {"roles": requested_role}
                }
        await users_collection.update_one({"_id": existing_user["_id"]}, update_operations)
        user_id = str(existing_user["_id"])
        user_data = await users_collection.find_one({"_id": existing_user["_id"]})
    else:
        new_user = User(
            google_id=google_user_info["google_id"],
            email=google_user_info["email"],
            name=google_user_info["name"],
            profile_picture=google_user_info.get("profile_picture", ""),
            role=request.role,
            roles=[request.role.value],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        result = await users_collection.insert_one(new_user.dict(by_alias=True, exclude={"id"}))
        user_id = str(result.inserted_id)
        user_data = await users_collection.find_one({"_id": result.inserted_id})
    access_token = create_access_token(
        data={"sub": user_id, "role": user_data["role"]},
        expires_delta=timedelta(minutes=30)
    )
    user_data["_id"] = str(user_data["_id"])
    return LoginResponse(access_token=access_token, user=user_data)

@router.post("/refresh-token")
async def refresh_token(current_user: dict = Depends(lambda: None)):
    pass

@router.post("/switch-role")
async def switch_role(role: UserRole, current_user: dict = Depends(get_current_user)):
    users_collection = await get_collection("users")
    user = await users_collection.find_one({"_id": ObjectId(current_user["_id"])});
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="Your account has been blocked.")
    available_roles = user.get("roles", [user.get("role")])
    if role.value not in available_roles:
        raise HTTPException(status_code=403, detail=f"You don't have access to {role.value} role. Please login as {role.value} first.")
    if user.get("role") == UserRole.SUPERADMIN.value:
        raise HTTPException(status_code=403, detail="SuperAdmin role cannot be switched.")
    await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {
            "role": role.value,
            "updated_at": datetime.utcnow()
        }}
    )
    updated_user = await users_collection.find_one({"_id": ObjectId(current_user["_id"])});
    updated_user["_id"] = str(updated_user["_id"])
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
