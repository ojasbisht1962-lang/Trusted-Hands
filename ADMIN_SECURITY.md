# 🔐 Admin Access Security System

## Overview
TrustedHands implements a strict domain-based authentication system for admin access to ensure platform security.

## Security Features

### ✅ Implemented Security Measures

1. **Email Domain Whitelisting**
   - Only users with authorized email domains can access admin panel
   - Configured in `.env` file: `admin_allowed_domains`
   - Default authorized domains:
     - `trustedhands.com`
     - `admin.trustedhands.com`

2. **Role Switching Disabled**
   - Users cannot switch between customer/tasker roles
   - Users cannot switch to admin role
   - Each user must register separately for different roles
   - Prevents unauthorized privilege escalation

3. **Backend Validation**
   - `require_superadmin` middleware checks email domain
   - Returns 403 error if domain not authorized
   - Validates on every admin API request

4. **Frontend Removal**
   - `RoleSwitcher` component completely removed
   - No UI option to switch roles
   - Clean and secure user interface

## Configuration

### 1. Set Authorized Admin Domains

Edit `backend/.env`:
```env
admin_allowed_domains=trustedhands.com,admin.trustedhands.com,yourdomain.com
```

### 2. Make a User SuperAdmin

Only users with authorized email domains can be made superadmin.

**Method 1: Using Management Script (Recommended)**
```bash
cd backend
python manage_superadmin.py
```

The script will:
- Show current superadmins
- Validate email domain before granting access
- Update user role safely

**Method 2: Manual Database Update**
```bash
cd backend
python make_superadmin.py
```

Enter email address when prompted.

## Admin Access Flow

1. **Registration**
   - User registers with authorized email domain
   - Example: `admin@trustedhands.com`

2. **Admin Promotion**
   - Platform owner runs `manage_superadmin.py`
   - User role updated to `superadmin`

3. **Login & Access**
   - User logs in normally
   - Backend validates email domain
   - Admin panel accessible only if domain authorized

## Security Checks

### Backend Validation (middleware/auth.py)
```python
async def require_superadmin(current_user: dict):
    # Check role
    if current_user.get("role") != "superadmin":
        raise HTTPException(403, "SuperAdmin access required")
    
    # Validate email domain
    email_domain = user_email.split("@")[-1]
    if email_domain not in settings.admin_domains_list:
        raise HTTPException(403, "Admin access denied")
```

### Protected Routes
All admin routes use `require_superadmin` dependency:
```python
@router.get("/admin/analytics/dashboard")
async def get_dashboard(admin: dict = Depends(require_superadmin)):
    # Only authorized admins can access
```

## Migration Notes

### What Changed

**Removed:**
- ❌ Role switching functionality
- ❌ `RoleSwitcher` component from UI
- ❌ `/auth/switch-role` endpoint
- ❌ Multi-role support in AuthContext

**Added:**
- ✅ Domain-based admin validation
- ✅ `admin_allowed_domains` configuration
- ✅ `manage_superadmin.py` script
- ✅ Enhanced security middleware

### Impact on Existing Users

- **Customers & Taskers**: No impact, works as before
- **Admin Users**: 
  - Must have authorized email domain
  - Cannot switch to other roles
  - Existing admins validated on next login

## Testing Admin Access

### Valid Admin Login
```
Email: admin@trustedhands.com ✅
Role: superadmin
Access: Granted
```

### Invalid Admin Login
```
Email: user@gmail.com ❌
Role: superadmin (in database)
Access: Denied - unauthorized domain
Error: "Admin access denied. Only authorized email domains are allowed."
```

## Troubleshooting

### Issue: "Admin access denied"
**Cause**: Email domain not in whitelist  
**Solution**: 
1. Check `.env` file for `admin_allowed_domains`
2. Add your domain to the list
3. Restart backend server

### Issue: User can't access admin panel
**Cause**: User role not set to superadmin  
**Solution**: 
1. Run `python manage_superadmin.py`
2. Enter user's email
3. Script will upgrade if domain is authorized

### Issue: Need to add new admin domain
**Solution**:
1. Edit `backend/.env`
2. Update `admin_allowed_domains=domain1.com,domain2.com`
3. Restart backend: `py main.py`

## Best Practices

1. **Use Corporate Email Domains**
   - Use company domain (e.g., `@yourcompany.com`)
   - Avoid public domains (gmail.com, yahoo.com)

2. **Limit Admin Access**
   - Only add necessary domains
   - Review admin list regularly
   - Remove inactive admins

3. **Monitor Admin Activity**
   - Check admin logs in database
   - Track admin actions
   - Set up alerts for admin operations

4. **Regular Security Audits**
   - Review authorized domains monthly
   - Audit admin user accounts
   - Update access policies as needed

## Production Deployment

### Environment Variables
```env
# Required in production
admin_allowed_domains=company.com,admin.company.com

# MongoDB connection
mongodb_url=your_production_mongodb_url

# JWT secret (change this!)
secret_key=your_strong_secret_key_here
```

### Deployment Checklist
- [ ] Update `admin_allowed_domains` with company domain
- [ ] Change `secret_key` to strong random value
- [ ] Create first superadmin using management script
- [ ] Test admin login with authorized email
- [ ] Verify unauthorized emails are blocked
- [ ] Document admin email format for team

## Support

For security issues or questions:
- Check this documentation first
- Review `backend/app/middleware/auth.py`
- Contact platform administrator
- Never share admin credentials

---

**Security First!** 🔐  
This system ensures only authorized personnel can access the admin panel, protecting your platform and users.
