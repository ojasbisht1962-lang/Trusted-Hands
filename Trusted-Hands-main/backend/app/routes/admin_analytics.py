from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import require_superadmin
from app.database import get_collection
from datetime import datetime, timedelta
from bson import ObjectId

router = APIRouter(prefix="/admin/analytics", tags=["Admin Analytics"])

@router.get("/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(require_superadmin)):
    """Get overall dashboard statistics"""
    try:
        users_collection = await get_collection("users")
        bookings_collection = await get_collection("bookings")
        payments_collection = await get_collection("payments")
        
        # Total users by role
        total_customers = await users_collection.count_documents({"role": "customer"})
        total_taskers = await users_collection.count_documents({"role": "tasker"})
        total_users = await users_collection.count_documents({})
        
        # Total bookings
        total_bookings = await bookings_collection.count_documents({})
        completed_bookings = await bookings_collection.count_documents({"status": "completed"})
        pending_bookings = await bookings_collection.count_documents({"status": "pending"})
        
        # Revenue calculation
        pipeline = [
            {"$match": {"status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        revenue_result = await payments_collection.aggregate(pipeline).to_list(length=1)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0
        
        return {
            "users": {
                "total": total_users,
                "customers": total_customers,
                "taskers": total_taskers
            },
            "bookings": {
                "total": total_bookings,
                "completed": completed_bookings,
                "pending": pending_bookings
            },
            "revenue": {
                "total": total_revenue
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/revenue-trends")
async def get_revenue_trends(period: str = "month", current_user: dict = Depends(require_superadmin)):
    """Get revenue trends for specified period"""
    try:
        payments_collection = await get_collection("payments")
        
        # Determine date range based on period
        end_date = datetime.utcnow()
        if period == "week":
            start_date = end_date - timedelta(days=6)
            days = 7
        elif period == "month":
            start_date = end_date - timedelta(days=29)
            days = 30
        else:
            start_date = end_date - timedelta(days=6)
            days = 7
        
        pipeline = [
            {
                "$match": {
                    "status": "completed",
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                    },
                    "revenue": {"$sum": "$amount"},
                    "commission": {"$sum": {"$multiply": ["$amount", 0.1]}}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        results = await payments_collection.aggregate(pipeline).to_list(length=None)
        
        # Fill in missing days with 0
        revenue_map = {r["_id"]: r for r in results}
        trends = []
        
        for i in range(days):
            date = start_date + timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            if date_str in revenue_map:
                trends.append({
                    "date": date_str,
                    "revenue": revenue_map[date_str]["revenue"],
                    "commission": revenue_map[date_str]["commission"]
                })
            else:
                trends.append({
                    "date": date_str,
                    "revenue": 0,
                    "commission": 0
                })
        
        return {"data": trends}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/booking-stats")
async def get_booking_stats(current_user: dict = Depends(require_superadmin)):
    """Get booking statistics by status"""
    try:
        bookings_collection = await get_collection("bookings")
        
        pipeline = [
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        results = await bookings_collection.aggregate(pipeline).to_list(length=None)
        
        stats = {r["_id"]: r["count"] for r in results}
        
        return {
            "stats": stats,
            "total": sum(stats.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/top-taskers")
async def get_top_taskers(limit: int = 10, current_user: dict = Depends(require_superadmin)):
    """Get top performing taskers"""
    try:
        bookings_collection = await get_collection("bookings")
        users_collection = await get_collection("users")
        
        pipeline = [
            {"$match": {"status": "completed"}},
            {
                "$group": {
                    "_id": "$tasker_id",
                    "completed_jobs": {"$sum": 1},
                    "total_earned": {"$sum": "$tasker_payment"}
                }
            },
            {"$sort": {"completed_jobs": -1}},
            {"$limit": limit}
        ]
        
        results = await bookings_collection.aggregate(pipeline).to_list(length=None)
        
        # Fetch tasker details
        top_taskers = []
        for r in results:
            if r["_id"]:
                tasker = await users_collection.find_one({"_id": ObjectId(r["_id"])})
                if tasker:
                    top_taskers.append({
                        "id": str(tasker["_id"]),
                        "name": tasker.get("name", "Unknown"),
                        "email": tasker.get("email", ""),
                        "completed_jobs": r["completed_jobs"],
                        "total_earned": r.get("total_earned", 0),
                        "rating": tasker.get("average_rating", 0)
                    })
        
        return {"top_taskers": top_taskers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent-activities")
async def get_recent_activities(limit: int = 20, current_user: dict = Depends(require_superadmin)):
    """Get recent platform activities"""
    try:
        bookings_collection = await get_collection("bookings")
        users_collection = await get_collection("users")
        
        # Get recent bookings
        recent_bookings = await bookings_collection.find({}).sort("created_at", -1).limit(limit).to_list(length=None)
        
        activities = []
        for booking in recent_bookings:
            activities.append({
                "type": "booking",
                "id": str(booking["_id"]),
                "status": booking.get("status", "unknown"),
                "created_at": booking.get("created_at"),
                "amount": booking.get("total_price", 0)
            })
        
        return {"activities": activities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/booking-status-distribution")
async def get_booking_distribution(current_user: dict = Depends(require_superadmin)):
    """Get booking distribution by status"""
    try:
        bookings_collection = await get_collection("bookings")
        
        pipeline = [
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        results = await bookings_collection.aggregate(pipeline).to_list(length=None)
        
        distribution = {}
        for r in results:
            status = r["_id"] if r["_id"] else "unknown"
            distribution[status] = r["count"]
        
        return {"distribution": distribution}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/top-performing-taskers")
async def get_top_performing_taskers(limit: int = 5, current_user: dict = Depends(require_superadmin)):
    """Get top performing taskers"""
    try:
        bookings_collection = await get_collection("bookings")
        users_collection = await get_collection("users")
        
        pipeline = [
            {"$match": {"status": "completed"}},
            {
                "$group": {
                    "_id": "$tasker_id",
                    "completed_jobs": {"$sum": 1},
                    "total_earned": {"$sum": "$tasker_payment"}
                }
            },
            {"$sort": {"completed_jobs": -1}},
            {"$limit": limit}
        ]
        
        results = await bookings_collection.aggregate(pipeline).to_list(length=None)
        
        # Fetch tasker details
        top_taskers = []
        for r in results:
            if r["_id"]:
                try:
                    tasker = await users_collection.find_one({"_id": ObjectId(r["_id"])})
                    if tasker:
                        top_taskers.append({
                            "id": str(tasker["_id"]),
                            "name": tasker.get("name", "Unknown"),
                            "email": tasker.get("email", ""),
                            "completed_jobs": r["completed_jobs"],
                            "total_earned": r.get("total_earned", 0),
                            "rating": tasker.get("average_rating", 0)
                        })
                except:
                    continue
        
        return {"top_taskers": top_taskers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
