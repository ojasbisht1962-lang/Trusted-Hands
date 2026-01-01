# TrustedHands - Deployment Quick Reference

## 🚀 Quick Deployment Commands

### Backend (Render)
1. Push code to GitHub: `git push origin main`
2. Go to [render.com](https://render.com) → New Web Service
3. Connect GitHub repo → Select `Trusted-Hands`
4. Root Directory: `backend`
5. Build: `pip install -r requirements.txt`
6. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import GitHub repo → Select `Trusted-Hands`
3. Root Directory: `frontend`
4. Deploy (auto-configured for Create React App)

---

## 📋 Environment Variables

### Backend (Render)
```
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/trustedhands
SECRET_KEY=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GEMINI_API_KEY=AIzaSy...
ALLOWED_ORIGINS=https://your-app.vercel.app,https://backend.onrender.com
DATABASE_NAME=trustedhands
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (Vercel)
```
REACT_APP_API_BASE_URL=https://your-backend.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
REACT_APP_GEMINI_API_KEY=AIzaSy...
```

---

## 🔗 URLs to Update

### Google OAuth Console
- Add to **Authorized JavaScript origins**:
  - `https://your-backend.onrender.com`
  - `https://your-app.vercel.app`
- Add to **Authorized redirect URIs**:
  - `https://your-app.vercel.app`
  - `https://your-app.vercel.app/auth/callback`

---

## 📚 Full Documentation

- **Backend Deployment**: See `DEPLOYMENT.md` (Part 1)
- **Frontend Deployment**: See `frontend/DEPLOYMENT_VERCEL.md`

---

## ✅ Deployment Order

1. ✅ MongoDB Atlas setup
2. ✅ Deploy Backend on Render
3. ✅ Deploy Frontend on Vercel
4. ✅ Update CORS in Backend
5. ✅ Update Google OAuth
6. ✅ Test complete application

---

## 🆘 Quick Troubleshooting

**API calls fail?**
→ Check REACT_APP_API_BASE_URL and CORS settings

**Google login not working?**
→ Update OAuth URLs in Google Cloud Console

**502 Error?**
→ Check Render logs, verify environment variables

**Build fails?**
→ Check build logs for missing dependencies

---

## 📞 Support

- **Render**: [docs.render.com](https://docs.render.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
