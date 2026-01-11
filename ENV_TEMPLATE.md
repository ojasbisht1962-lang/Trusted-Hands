# Environment Variables - Production Template

## Backend (.env for Render)

Copy these to Render dashboard → Environment variables:

```env
# MongoDB Atlas Connection
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/trustedhands?retryWrites=true&w=majority

# Security
SECRET_KEY=your-super-secret-key-at-least-32-characters-long-random-string

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx

# Gemini AI
GEMINI_API_KEY=AIzaSyA-6Aq8AUQfxpgHUKqq2J-w4iBiO0tMkAM

# CORS - Update with your Vercel URL
ALLOWED_ORIGINS=https://your-app-name.vercel.app,https://your-backend-name.onrender.com

# Database Settings
DATABASE_NAME=trustedhands
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## Frontend (.env.production for Vercel)

Copy these to Vercel dashboard → Environment Variables:

```env
# Backend API - Update with your Render URL
REACT_APP_API_BASE_URL=https://your-backend-name.onrender.com

# Google OAuth - Same client ID as backend
REACT_APP_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com

# Gemini AI - Same key as backend
REACT_APP_GEMINI_API_KEY=AIzaSyA-6Aq8AUQfxpgHUKqq2J-w4iBiO0tMkAM
```

---

## 📝 Important Notes

### For SECRET_KEY:
Generate a secure random key using:
```python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### For MONGODB_URL:
1. Go to MongoDB Atlas → Clusters → Connect
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<username>` and `<password>` with actual values
5. Add database name: `/trustedhands`

### For ALLOWED_ORIGINS:
- Must include both frontend and backend URLs
- Use https:// (not http://)
- No trailing slashes
- Comma-separated list

### For REACT_APP_API_BASE_URL:
- Your Render backend URL
- No trailing slash
- Example: `https://trustedhands-backend.onrender.com`

---

## 🔒 Security Checklist

- [ ] Never commit `.env` files to GitHub
- [ ] Use different keys for development and production
- [ ] SECRET_KEY should be at least 32 characters
- [ ] Rotate keys periodically
- [ ] Use MongoDB Atlas IP whitelist (0.0.0.0/0 for Render)
- [ ] Keep Google OAuth credentials secure
- [ ] Don't share Gemini API key publicly

---

## 🚀 Deployment Steps

1. **Render**: Add all backend variables in Environment tab
2. **Vercel**: Add all frontend variables before first deployment
3. **Test**: Verify all variables are correctly set
4. **Update**: Change ALLOWED_ORIGINS after getting Vercel URL

---

## 📞 Getting API Keys

### Google OAuth:
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID

### Gemini API:
1. [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key

### MongoDB:
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster → Connect → Get connection string
