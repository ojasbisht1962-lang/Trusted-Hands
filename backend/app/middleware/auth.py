from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.auth import verify_token
from app.database import get_collection
from app.models.user import UserRole
from bson import ObjectId

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    users_collection = await get_collection("users")
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="Your account has been blocked. Please contact support.")
    
    return user

async def require_role(required_roles: list[UserRole]):
    """Dependency to require specific user roles"""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in [role.value for role in required_roles]:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {', '.join([r.value for r in required_roles])}"
            )
        return current_user
    return role_checker

# Specific role dependencies
async def require_customer(current_user: dict = Depends(get_current_user)):
    """Require customer role"""
    if current_user.get("role") != UserRole.CUSTOMER.value:
        raise HTTPException(status_code=403, detail="Customer access required")
    return current_user

async def require_tasker(current_user: dict = Depends(get_current_user)):
    """Require tasker role"""
    if current_user.get("role") != UserRole.TASKER.value:
        raise HTTPException(status_code=403, detail="Tasker access required")
    return current_user

async def require_superadmin(current_user: dict = Depends(get_current_user)):
    """Require superadmin role"""
    if current_user.get("role") != UserRole.SUPERADMIN.value:
        raise HTTPException(status_code=403, detail="SuperAdmin access required")
    return current_user

async def require_professional_badge(current_user: dict = Depends(require_tasker)):
    """Require professional badge for taskers"""
    if not current_user.get("professional_badge", False):
        raise HTTPException(
            status_code=403,
            detail="Professional badge required. Please apply for verification."
        )
    return current_user
