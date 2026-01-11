# CORS Error Fix Guide

## Problem
The frontend at `https://trusted-hands.vercel.app` is being blocked from accessing the backend at `https://trustedhands-backend.onrender.com` due to CORS policy.

## Root Cause
The `ALLOWED_ORIGINS` environment variable on Render is not set correctly.

## Immediate Fix on Render Dashboard

1. **Go to Render Dashboard**
   - Navigate to https://dashboard.render.com
   - Select your `trustedhands-backend` service

2. **Update Environment Variables**
   - Go to "Environment" tab
   - Find or add the `ALLOWED_ORIGINS` variable
   - Set its value to:
     ```
     https://trusted-hands.vercel.app,https://trustedhands-backend.onrender.com,http://localhost:3000
     ```

3. **Add Additional Environment Variables (if missing)**
   - `BACKEND_URL`: `https://trustedhands-backend.onrender.com`
   - `FRONTEND_URL`: `https://trusted-hands.vercel.app`

4. **Redeploy the Service**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete (usually 2-5 minutes)

## Verify the Fix

After deployment, test these endpoints:

### 1. Check CORS Configuration
```bash
curl https://trustedhands-backend.onrender.com/health
```
Should return:
```json
{
  "status": "healthy",
  "cors_configured": true,
  "allowed_origins": [
    "https://trusted-hands.vercel.app",
    "https://trustedhands-backend.onrender.com",
    "http://localhost:3000"
  ]
}
```

### 2. Test CORS Preflight
```bash
curl -X OPTIONS https://trustedhands-backend.onrender.com/auth/google-login \
  -H "Origin: https://trusted-hands.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```
Should return headers including:
- `Access-Control-Allow-Origin: https://trusted-hands.vercel.app`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Credentials: true`

## Code Changes Made

### 1. `backend/main.py`
- Added logging for CORS configuration
- Explicitly listed allowed headers
- Added CORS info to health check endpoint

### 2. `backend/app/config.py`
- Improved `origins_list` property to ensure frontend/backend URLs are always included
- Added automatic deduplication

### 3. `backend/render.yaml`
- Updated `ALLOWED_ORIGINS` with correct production URLs
- Added `BACKEND_URL` and `FRONTEND_URL` environment variables

## Additional Troubleshooting

### If CORS errors persist:

1. **Clear browser cache and reload**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

2. **Check browser console for exact error**
   - The error should now show the allowed origins

3. **Verify environment variables are loaded**
   - Check Render logs for: `INFO: CORS Origins: ['https://trusted-hands.vercel.app', ...]`

4. **Check for typos in URLs**
   - Ensure no trailing slashes
   - Verify HTTPS vs HTTP
   - Check for extra spaces

### Test with curl
```bash
# Test from command line
curl -X POST https://trustedhands-backend.onrender.com/auth/google-login \
  -H "Origin: https://trusted-hands.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"token": "test", "role": "customer"}' \
  -v
```

## Next Steps

1. Deploy the updated code to Render
2. Test the login flow from your frontend
3. Monitor Render logs for any CORS-related messages
4. If issues persist, check that all environment variables are set correctly

## Environment Variables Checklist

Make sure these are set on Render:

- ✅ `MONGODB_URL` - Your MongoDB connection string
- ✅ `SECRET_KEY` - JWT secret key
- ✅ `GOOGLE_CLIENT_ID` - Google OAuth client ID
- ✅ `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- ✅ `GEMINI_API_KEY` - Gemini API key
- ✅ `ALLOWED_ORIGINS` - CORS allowed origins
- ✅ `BACKEND_URL` - Backend URL
- ✅ `FRONTEND_URL` - Frontend URL

## Contact
If the issue persists after following these steps, please check:
1. Render deployment logs
2. Browser developer console (Network tab)
3. Verify all environment variables are correctly set
