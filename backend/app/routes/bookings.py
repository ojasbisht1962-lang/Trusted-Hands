from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.middleware.auth import get_current_user, require_customer, require_tasker
from app.database import get_collection
from app.models.booking import Booking, BookingStatus
from app.services.notification_service import create_notification
from app.models.notification import NotificationType
from bson import ObjectId

router = APIRouter(prefix="/bookings", tags=["Bookings"])

class CreateBookingRequest(BaseModel):
    service_id: str
    tasker_id: str
    scheduled_date: str
    scheduled_time: str
    location: str
    notes: Optional[str] = None
    total_price: float

class UpdateBookingStatusRequest(BaseModel):
    status: BookingStatus

class RateBookingRequest(BaseModel):
    rating: float
    review: Optional[str] = None

@router.post("/")
async def create_booking(
    booking_data: CreateBookingRequest,
    current_user: dict = Depends(require_customer)
):
    """Create a new booking"""
    services_collection = await get_collection("services")
    
    try:
        service = await services_collection.find_one({"_id": ObjectId(booking_data.service_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid service ID")
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if not service.get("is_active", False):
        raise HTTPException(status_code=400, detail="Service is not available")
    
    bookings_collection = await get_collection("bookings")
    
    # Parse the date string to datetime
    try:
        scheduled_datetime = datetime.fromisoformat(booking_data.scheduled_date.replace('Z', '+00:00'))
    except:
        # If it's just a date string, combine with a default time
        scheduled_datetime = datetime.strptime(booking_data.scheduled_date, "%Y-%m-%d")
    
    new_booking = Booking(
        customer_id=str(current_user["_id"]),
        tasker_id=booking_data.tasker_id,
        service_id=booking_data.service_id,
        address=booking_data.location,
        time_slot=booking_data.scheduled_time,
        date=scheduled_datetime,
        additional_notes=booking_data.notes,
        total_amount=booking_data.total_price,
        status=BookingStatus.PENDING,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    result = await bookings_collection.insert_one(new_booking.dict(by_alias=True, exclude={"id"}))
    
    # Create notification for tasker
    await create_notification(
        user_id=booking_data.tasker_id,
        notification_type=NotificationType.BOOKING_REQUEST,
        title="New Booking Request",
        message=f"You have a new booking request from {current_user['name']}",
        link=f"/tasker/bookings/{result.inserted_id}"
    )
    
    created_booking = await bookings_collection.find_one({"_id": result.inserted_id})
    created_booking["_id"] = str(created_booking["_id"])
    
    return created_booking

@router.get("/my-bookings")
async def get_my_bookings(
    status: Optional[BookingStatus] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's bookings"""
    bookings_collection = await get_collection("bookings")
    
    if current_user["role"] == "customer":
        query = {"customer_id": str(current_user["_id"])}
    elif current_user["role"] == "tasker":
        query = {"tasker_id": str(current_user["_id"])}
    else:
        raise HTTPException(status_code=403, detail="Invalid user role")
    
    if status:
        query["status"] = status.value
    
    cursor = bookings_collection.find(query).sort("created_at", -1)
    bookings = await cursor.to_list(length=100)
    
    # Get additional details
    users_collection = await get_collection("users")
    services_collection = await get_collection("services")
    
    for booking in bookings:
        booking["_id"] = str(booking["_id"])
        
        # Get customer details
        customer = await users_collection.find_one({"_id": ObjectId(booking["customer_id"])})
        if customer:
            booking["customer"] = {
                "_id": str(customer["_id"]),
                "name": customer["name"],
                "email": customer["email"],
                "phone": customer.get("phone")
            }
            # Add flattened fields for frontend compatibility
            booking["customer_name"] = customer["name"]
            booking["customer_phone"] = customer.get("phone")
        
        # Get tasker details
        tasker = await users_collection.find_one({"_id": ObjectId(booking["tasker_id"])})
        if tasker:
            booking["tasker"] = {
                "_id": str(tasker["_id"]),
                "name": tasker["name"],
                "phone": tasker.get("phone"),
                "rating": tasker.get("rating", 0.0)
            }
            # Add flattened fields for frontend compatibility
            booking["tasker_name"] = tasker["name"]
            booking["tasker_phone"] = tasker.get("phone")
        
        # Get service details
        service = await services_collection.find_one({"_id": ObjectId(booking["service_id"])})
        if service:
            booking["service"] = {
                "_id": str(service["_id"]),
                "title": service["title"],
                "category": service["category"]
            }
            # Add flattened fields for frontend compatibility
            booking["service_name"] = service["title"]
            booking["service_category"] = service["category"]
        
        # Map backend fields to frontend expected fields
        booking["total_price"] = booking.get("total_amount", 0)
        booking["booking_date"] = booking.get("date")
        booking["booking_time"] = booking.get("time_slot")
        booking["description"] = booking.get("additional_notes", "")
    
    return bookings

@router.get("/{booking_id}")
async def get_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get booking details"""
    bookings_collection = await get_collection("bookings")
    
    try:
        booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking["customer_id"] != str(current_user["_id"]) and booking["tasker_id"] != str(current_user["_id"]) and current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized to view this booking")
    
    booking["_id"] = str(booking["_id"])
    
    return booking

@router.put("/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status_data: UpdateBookingStatusRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update booking status"""
    bookings_collection = await get_collection("bookings")
    
    try:
        booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if current_user["role"] == "tasker" and booking["tasker_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")
    
    if current_user["role"] == "customer" and booking["customer_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")
    
    update_data = {
        "status": status_data.status.value,
        "updated_at": datetime.utcnow()
    }
    
    if status_data.status == BookingStatus.COMPLETED:
        update_data["completed_at"] = datetime.utcnow()
        
        # Update tasker's total jobs
        users_collection = await get_collection("users")
        await users_collection.update_one(
            {"_id": ObjectId(booking["tasker_id"])},
            {"$inc": {"total_jobs": 1}}
        )
    
    result = await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data}
    )
    
    # Create notification
    notification_type_map = {
        BookingStatus.ACCEPTED: NotificationType.BOOKING_ACCEPTED,
        BookingStatus.REJECTED: NotificationType.BOOKING_REJECTED,
        BookingStatus.COMPLETED: NotificationType.BOOKING_COMPLETED,
        BookingStatus.CANCELLED: NotificationType.BOOKING_CANCELLED
    }
    
    if status_data.status in notification_type_map:
        recipient_id = booking["customer_id"] if current_user["role"] == "tasker" else booking["tasker_id"]
        await create_notification(
            user_id=recipient_id,
            notification_type=notification_type_map[status_data.status],
            title=f"Booking {status_data.status.value.title()}",
            message=f"Your booking has been {status_data.status.value}",
            link=f"/bookings/{booking_id}"
        )
    
    updated_booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    updated_booking["_id"] = str(updated_booking["_id"])
    
    return updated_booking

@router.post("/{booking_id}/rate")
async def rate_booking(
    booking_id: str,
    rating_data: RateBookingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Rate a completed booking"""
    bookings_collection = await get_collection("bookings")
    
    try:
        booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid booking ID")
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["status"] != BookingStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Can only rate completed bookings")
    
    # Check authorization and determine rating field
    if current_user["role"] == "customer" and booking["customer_id"] == str(current_user["_id"]):
        rating_field = "customer_rating"
        review_field = "customer_review"
        rated_user_id = booking["tasker_id"]
    elif current_user["role"] == "tasker" and booking["tasker_id"] == str(current_user["_id"]):
        rating_field = "tasker_rating"
        review_field = "tasker_review"
        rated_user_id = booking["customer_id"]
    else:
        raise HTTPException(status_code=403, detail="Not authorized to rate this booking")
    
    # Update booking with rating
    update_data = {
        rating_field: rating_data.rating,
        review_field: rating_data.review,
        "updated_at": datetime.utcnow()
    }
    
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data}
    )
    
    # Update user's average rating
    users_collection = await get_collection("users")
    
    # Get all ratings for the user
    if current_user["role"] == "customer":
        all_bookings = bookings_collection.find({
            "tasker_id": rated_user_id,
            "customer_rating": {"$exists": True}
        })
    else:
        all_bookings = bookings_collection.find({
            "customer_id": rated_user_id,
            "tasker_rating": {"$exists": True}
        })
    
    ratings = []
    async for b in all_bookings:
        if current_user["role"] == "customer" and b.get("customer_rating"):
            ratings.append(b["customer_rating"])
        elif current_user["role"] == "tasker" and b.get("tasker_rating"):
            ratings.append(b["tasker_rating"])
    
    if ratings:
        avg_rating = sum(ratings) / len(ratings)
        await users_collection.update_one(
            {"_id": ObjectId(rated_user_id)},
            {"$set": {"rating": round(avg_rating, 2)}}
        )
    
    # Create notification
    await create_notification(
        user_id=rated_user_id,
        notification_type=NotificationType.REVIEW_RECEIVED,
        title="New Review Received",
        message=f"You received a {rating_data.rating}-star rating",
        link=f"/bookings/{booking_id}"
    )
    
    updated_booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    updated_booking["_id"] = str(updated_booking["_id"])
    
    return updated_booking
