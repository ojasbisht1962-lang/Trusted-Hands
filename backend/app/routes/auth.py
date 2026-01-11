from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.database import get_collection
from app.models.user import User, UserRole
from app.utils.auth import create_access_token
from app.middleware.auth import get_current_user
from datetime import datetime, timedelta
from bson import ObjectId
from app.services.google_auth import get_google_user_info
from app.config import settings
import bcrypt

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Password hashing functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    # Truncate to 72 bytes if needed (bcrypt limitation)
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

class GoogleLoginRequest(BaseModel):
    token: str
    role: UserRole

class EmailSignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole

class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str
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
    
    # Prevent unauthorized users from logging in as superadmin
    if request.role == UserRole.SUPERADMIN:
        user_email = google_user_info["email"].lower()
        if user_email not in settings.admin_emails_list:
            raise HTTPException(
                status_code=403, 
                detail="Access denied. You are not authorized to access the admin panel."
            )
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

@router.post("/email-signup", response_model=LoginResponse)
async def email_signup(request: EmailSignupRequest):
    """Register a new user with email and password"""
    users_collection = await get_collection("users")
    
    # Prevent users from signing up as superadmin
    if request.role == UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=403, 
            detail="Cannot register as admin. Admin access is restricted to authorized personnel only."
        )
    
    # Check if email already exists
    existing_user = await users_collection.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password
    hashed_password = hash_password(request.password)
    
    # Create new user
    new_user = User(
        email=request.email,
        name=request.name,
        password=hashed_password,
        role=request.role,
        roles=[request.role.value],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    result = await users_collection.insert_one(new_user.dict(by_alias=True, exclude={"id"}))
    user_id = str(result.inserted_id)
    user_data = await users_collection.find_one({"_id": result.inserted_id})
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_id, "role": user_data["role"]},
        expires_delta=timedelta(minutes=30)
    )
    
    user_data["_id"] = str(user_data["_id"])
    # Remove password from response
    user_data.pop("password", None)
    
    return LoginResponse(access_token=access_token, user=user_data)

@router.post("/email-login", response_model=LoginResponse)
async def email_login(request: EmailLoginRequest):
    """Login with email and password"""
    users_collection = await get_collection("users")
    
    # Prevent unauthorized users from logging in as superadmin
    if request.role == UserRole.SUPERADMIN:
        user_email = request.email.lower()
        if user_email not in settings.admin_emails_list:
            raise HTTPException(
                status_code=403, 
                detail="Access denied. You are not authorized to access the admin panel."
            )
    
    # Find user by email
    user = await users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="Account not found. You haven't registered yet. Please sign up to create an account."
        )
    
    # Check if account is blocked
    if user.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="Your account has been blocked. Please contact support.")
    
    # Verify password
    if not user.get("password") or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update role if needed
    user_id = str(user["_id"])
    current_role = user.get("role")
    requested_role = request.role.value
    
    if current_role != requested_role:
        # Check if user has this role
        available_roles = user.get("roles", [current_role])
        if requested_role not in available_roles:
            # Add the role if not present
            await users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {"role": requested_role, "updated_at": datetime.utcnow()},
                    "$addToSet": {"roles": requested_role}
                }
            )
        else:
            # Just switch to the role
            await users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"role": requested_role, "updated_at": datetime.utcnow()}}
            )
        
        user = await users_collection.find_one({"_id": user["_id"]})
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_id, "role": user["role"]},
        expires_delta=timedelta(minutes=30)
    )
    
    user["_id"] = str(user["_id"])
    # Remove password from response
    user.pop("password", None)
    
    return LoginResponse(access_token=access_token, user=user)

@router.post("/refresh-token")
async def refresh_token(current_user: dict = Depends(lambda: None)):
    pass

# Role switching disabled for security
# Users must register separately for different roles
# @router.post("/switch-role")
# async def switch_role(role: UserRole, current_user: dict = Depends(get_current_user)):
#     raise HTTPException(status_code=403, detail="Role switching has been disabled for security reasons. Please register separately for different roles.")

