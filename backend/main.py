from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, users, services, bookings, chat, notifications, amc, admin
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="TrustedHands API",
    description="API for TrustedHands - Freelance/Gig Services Marketplace",
    version="1.0.0"
)

# Log CORS configuration
logger.info(f"CORS Origins: {settings.origins_list}")

# CORS middleware - Configure before other middleware
# Using allow_origin_regex as a more permissive approach
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily to fix the issue
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Event handlers
@app.on_event("startup")
async def startup_db_client():
    """Connect to MongoDB on startup"""
    await connect_to_mongo()
    
    # Setup indexes for optimal performance
    try:
        from app.database import get_collection
        users_collection = await get_collection("users")
        
        logger.info("Setting up MongoDB indexes...")
        
        # 1. Multikey index on roles array for fast filtering
        await users_collection.create_index("roles")
        logger.info("✓ Created index on 'roles' array")
        
        # 2. Compound index on role + is_blocked
        await users_collection.create_index([("role", 1), ("is_blocked", 1)])
        logger.info("✓ Created compound index on 'role' + 'is_blocked'")
        
        # 3. Compound index on roles array + is_blocked
        await users_collection.create_index([("roles", 1), ("is_blocked", 1)])
        logger.info("✓ Created compound index on 'roles' + 'is_blocked'")
        
        # 4. Unique index on email
        await users_collection.create_index("email", unique=True)
        logger.info("✓ Created unique index on 'email'")
        
        # 5. Unique index on google_id
        await users_collection.create_index("google_id", unique=True)
        logger.info("✓ Created unique index on 'google_id'")
        
        # 6. Compound index for admin filtering
        await users_collection.create_index([
            ("roles", 1), 
            ("tasker_type", 1), 
            ("verification_status", 1)
        ])
        logger.info("✓ Created compound index for admin filtering")
        
        # 7. Index on verification_status for admin queries
        await users_collection.create_index("verification_status")
        logger.info("✓ Created index on 'verification_status'")
        
        logger.info("✅ All MongoDB indexes created successfully!")
        
        # Setup indexes for other collections
        logger.info("Setting up indexes for other collections...")
        
        # Services collection
        services_collection = await get_collection("services")
        await services_collection.create_index("tasker_id")
        await services_collection.create_index([("category", 1), ("is_active", 1)])
        await services_collection.create_index("is_active")
        logger.info("✓ Created indexes on 'services' collection")
        
        # Bookings collection
        bookings_collection = await get_collection("bookings")
        await bookings_collection.create_index("customer_id")
        await bookings_collection.create_index("tasker_id")
        await bookings_collection.create_index([("status", 1), ("scheduled_date", 1)])
        await bookings_collection.create_index("service_id")
        logger.info("✓ Created indexes on 'bookings' collection")
        
        # Notifications collection
        notifications_collection = await get_collection("notifications")
        await notifications_collection.create_index([("user_id", 1), ("is_read", 1)])
        await notifications_collection.create_index([("user_id", 1), ("created_at", -1)])
        logger.info("✓ Created indexes on 'notifications' collection")
        
        # Chats collection
        chats_collection = await get_collection("chats")
        await chats_collection.create_index([("customer_id", 1), ("tasker_id", 1)])
        await chats_collection.create_index("customer_id")
        await chats_collection.create_index("tasker_id")
        logger.info("✓ Created indexes on 'chats' collection")
        
        # AMC collection
        amc_collection = await get_collection("amc")
        await amc_collection.create_index("customer_id")
        await amc_collection.create_index("status")
        logger.info("✓ Created indexes on 'amc' collection")
        
        logger.info("✅ All collection indexes created successfully!")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
        # Don't fail startup if indexes already exist

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close MongoDB connection on shutdown"""
    await close_mongo_connection()

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(chat.router)
app.include_router(notifications.router)
app.include_router(amc.router)
app.include_router(admin.router)
from app.routes.chatbot import router as chatbot_router
app.include_router(chatbot_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to TrustedHands API",
        "version": "1.0.0",
        "docs": "/docs",
        "cors_origins": settings.origins_list
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "cors_configured": True,
        "allowed_origins": settings.origins_list
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
