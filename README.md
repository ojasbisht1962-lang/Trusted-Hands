# TrustedHands - Freelance/Gig Services Marketplace

A comprehensive marketplace platform connecting customers with professional taskers for various services including technical (electrician, plumber, AC servicing, etc.) and non-technical (car washing, cleaning, assignment writing, etc.) services.

## 🌟 Features

### For Customers
- **Service Discovery**: Browse and search for various services
- **Tasker Profiles**: View detailed profiles of taskers with ratings and reviews
- **Booking System**: Easy booking with time slot selection
- **Real-time Chat**: Communicate directly with taskers
- **AMC Requests**: Apply for Annual Maintenance Contracts for businesses
- **Dashboard**: Track bookings and service history

### For Taskers
- **Two-tier System**: 
  - **Helpers**: Can offer non-technical services
  - **Professionals**: Can offer all services (requires verification)
- **Service Management**: Create and manage service listings
- **Booking Management**: Accept/reject booking requests
- **Profile Verification**: Get verified as a professional
- **Referral System**: Professionals can refer other professionals
- **Dashboard**: Track earnings, bookings, and ratings

### For SuperAdmin
- **User Management**: View and manage all users
- **Verification Management**: Approve/reject professional verification requests
- **Price Range Control**: Set price ranges for different service categories
- **AMC Management**: Review and approve AMC requests
- **Analytics Dashboard**: Platform statistics and insights
- **Booking Oversight**: Monitor all bookings

### Additional Features
- **Google OAuth Login**: Secure authentication
- **Role-based Access Control**: Separate interfaces for customers, taskers, and admins
- **Notification System**: Real-time notifications for all activities
- **Rating & Review System**: Build trust through feedback
- **Gemini AI Chatbot**: Integrated support chatbot
- **Responsive Design**: Apple-inspired smooth UI

## 🆕 Recent Updates

### Map Integration Overhaul
- ✅ **Migrated from Google Maps to Leaflet/OpenStreetMap**: Complete replacement of Google Maps API with open-source Leaflet library
- 📊 **Split View Interface**: Services and Providers pages now display map and grid side-by-side for better browsing
- 🎯 **Smart Zoom Adjustment**: Automatic zoom level calculation based on search radius (1-10km)
- 🗺️ **Enhanced Location Markers**: Custom icons for different service categories and user location

### UI/UX Improvements
- 🎨 **Distinct Role Themes**: 
  - Customer interface: Golden/orange theme (#FDB913)
  - Tasker interface: Blue/cyan professional theme (#00adb5, #00d4ff)
- 🧭 **Unified Navigation**: Navbar now appears on all tasker pages including Profile
- 📍 **Service Location Mapping**: Services now properly display on map with accurate coordinates

### Features & Fixes
- 🌆 **New Service City**: Added Chandigarh to available service locations
- 🔧 **Fixed Navigation**: Corrected provider profile navigation from map popups
- 💾 **Location Save Fix**: Resolved 400 Bad Request error when updating customer location
- 🔍 **Radius Search Enhancement**: Improved search radius options (1km, 3km, 5km, 10km) with circular area visualization

## 🛠️ Technology Stack

### Backend (FastAPI/Python)
- **FastAPI**: Modern, fast web framework
- **MongoDB**: NoSQL database with Motor (async driver)
- **Pydantic**: Data validation
- **JWT**: Authentication
- **Google OAuth**: Social login
- **Python 3.9+**

### Frontend (React)
- **React 18**: UI library
- **React Router**: Navigation
- **Axios**: API calls
- **Leaflet 1.7.1 + react-leaflet**: Interactive maps with OpenStreetMap
- **Google OAuth**: Authentication
- **Framer Motion**: Animations
- **React Toastify**: Notifications
- **CSS3**: Apple-inspired styling with role-based themes

## 📁 Project Structure

```
TrustedHands/
├── backend/
│   ├── app/
│   │   ├── models/          # Pydantic models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth middleware
│   │   ├── utils/           # Utility functions
│   │   ├── schemas/         # Request/Response schemas
│   │   ├── config.py        # Configuration
│   │   └── database.py      # Database connection
│   ├── main.py              # FastAPI app entry point
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── pages/           # Page components
    │   │   ├── Common/      # Public pages
    │   │   ├── Customer/    # Customer pages
    │   │   ├── Tasker/      # Tasker pages
    │   │   └── SuperAdmin/  # Admin pages
    │   ├── services/        # API services
    │   ├── context/         # React context
    │   ├── utils/           # Utility functions
    │   ├── styles/          # CSS files
    │   ├── App.js           # Main app component
    │   ├── index.js         # Entry point
    │   └── config.js        # Configuration
    └── package.json         # Dependencies
```

## 🚀 Setup Instructions

### Prerequisites
- **Python 3.9+**
- **Node.js 16+** and npm
- **MongoDB** (local or Atlas)
- **Google Cloud Account** (for OAuth)
- **Gemini API Key** (optional, for chatbot)

### Backend Setup

1. **Navigate to backend directory**
   ```powershell
   cd backend
   ```

2. **Create virtual environment**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   - Copy `.env.example` to `.env`
   ```powershell
   Copy-Item .env.example .env
   ```
   - Edit `.env` and fill in your values:
     - `MONGODB_URL`: Your MongoDB connection string
     - `SECRET_KEY`: Generate a secure random key
     - `GOOGLE_CLIENT_ID`: From Google Cloud Console
     - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
     - `GEMINI_API_KEY`: Your Gemini API key

5. **Run the backend server**
   ```powershell
   python main.py
   ```
   or
   ```powershell
   uvicorn main:app --reload
   ```

   Backend will run on `http://localhost:8000`
   API docs available at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```powershell
   cd frontend
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```
   
   *Key packages include: React 18, react-router-dom, axios, leaflet, react-leaflet, framer-motion, react-toastify*

3. **Set up environment variables**
   - Create `.env` file in frontend directory:
   ```
   REACT_APP_API_BASE_URL=http://localhost:8000
   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
   REACT_APP_GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Run the frontend**
   ```powershell
   npm start
   ```

   Frontend will run on `http://localhost:3000`

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Add authorized origins:
   - `http://localhost:3000`
   - `http://localhost:8000`
6. Add authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:3000/auth/callback`
7. Copy **Client ID** and **Client Secret**

### MongoDB Setup

#### Local MongoDB
```powershell
# Install MongoDB on Windows
# Download from https://www.mongodb.com/try/download/community
# Or use MongoDB Atlas (cloud)

# Start MongoDB service
net start MongoDB
```

#### MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URL` in `.env`

### Create SuperAdmin Account

1. After first login with Google, your user will be created
2. Manually update the user in MongoDB to make them superadmin:
   ```javascript
   // In MongoDB shell or Compass
   db.users.updateOne(
     { email: "your-email@gmail.com" },
     { $set: { role: "superadmin" } }
   )
   ```

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🎯 Usage Guide

### As a Customer
1. Login with Google selecting "Customer" role
2. Browse services or search for taskers
3. View tasker profiles and ratings
4. Book a service with your preferred time slot
5. Chat with taskers before booking
6. Rate and review after service completion
7. Apply for AMC for business needs

### As a Tasker
1. Login with Google selecting "Tasker" role
2. Complete your profile (age, languages, experience, etc.)
3. Choose Helper or Professional path
   - **Helper**: Can post non-technical services immediately
   - **Professional**: Need verification or referral code
4. Create service listings with prices (within admin-set ranges)
5. Receive and manage booking requests
6. Chat with customers
7. Build your rating and reputation

### As SuperAdmin
1. Login with Google (account must be set as superadmin)
2. View platform statistics
3. Manage user accounts
4. Approve/reject professional verifications
5. Set price ranges for service categories
6. Review AMC requests
7. Monitor all bookings and services

## 🔧 Configuration

### Backend Configuration (`backend/.env`)
```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=trustedhands

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend Configuration (`frontend/.env`)
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-client-id
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

## 🧪 Testing

### Backend Tests
```powershell
cd backend
pytest
```

### Frontend Tests
```powershell
cd frontend
npm test
```

## 🚢 Deployment

### Backend Deployment (Example: Heroku/Railway/Render)
1. Set environment variables
2. Use `requirements.txt` for dependencies
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment (Example: Vercel/Netlify)
1. Build the app: `npm run build`
2. Deploy `build` folder
3. Set environment variables

### Database
- Use MongoDB Atlas for production
- Update connection string in environment variables

## 📝 License

This project is proprietary software.

## 👥 Support

For support, email support@trustedhands.com

## 🤝 Contributing

This is a private project. Contact the team for contribution guidelines.

---

**Built with ❤️ using FastAPI and React**

