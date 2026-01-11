from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from app.middleware.auth import get_current_user
from app.database import get_collection
from app.models.chat import Chat, Message
from app.models.notification import NotificationType
from app.services.notification_service import create_notification
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/chat", tags=["Chat"])

class SendMessageRequest(BaseModel):
    recipient_id: str
    content: str

@router.post("/send")
async def send_message(
    message_data: SendMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a chat message"""
    chats_collection = await get_collection("chats")
    users_collection = await get_collection("users")
    
    # Verify recipient exists
    try:
        recipient = await users_collection.find_one({"_id": ObjectId(message_data.recipient_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid recipient ID")
    
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Determine customer and tasker IDs
    if current_user["role"] == "customer":
        customer_id = str(current_user["_id"])
        tasker_id = message_data.recipient_id
    elif current_user["role"] == "tasker":
        customer_id = message_data.recipient_id
        tasker_id = str(current_user["_id"])
    else:
        raise HTTPException(status_code=403, detail="Invalid user role for chat")
    
    # Find or create chat
    chat = await chats_collection.find_one({
        "customer_id": customer_id,
        "tasker_id": tasker_id
    })
    
    new_message = Message(
        sender_id=str(current_user["_id"]),
        content=message_data.content,
        timestamp=datetime.utcnow(),
        is_read=False
    )
    
    if chat:
        # Update existing chat
        result = await chats_collection.update_one(
            {"_id": chat["_id"]},
            {
                "$push": {"messages": new_message.dict()},
                "$set": {
                    "last_message": message_data.content,
                    "last_message_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        chat_id = str(chat["_id"])
    else:
        # Create new chat
        new_chat = Chat(
            customer_id=customer_id,
            tasker_id=tasker_id,
            messages=[new_message],
            last_message=message_data.content,
            last_message_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        result = await chats_collection.insert_one(new_chat.dict(by_alias=True, exclude={"id"}))
        chat_id = str(result.inserted_id)
    
    # Create notification for recipient
    await create_notification(
        user_id=message_data.recipient_id,
        notification_type=NotificationType.CHAT_MESSAGE,
        title="New Message",
        message=f"{current_user['name']}: {message_data.content[:50]}...",
        link=f"/chat/{chat_id}"
    )
    
    return {"chat_id": chat_id, "message": new_message.dict()}

@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Get all chat conversations for current user"""
    chats_collection = await get_collection("chats")
    
    if current_user["role"] == "customer":
        query = {"customer_id": str(current_user["_id"])}
    elif current_user["role"] == "tasker":
        query = {"tasker_id": str(current_user["_id"])}
    else:
        raise HTTPException(status_code=403, detail="Invalid user role for chat")
    
    cursor = chats_collection.find(query).sort("last_message_at", -1)
    chats = await cursor.to_list(length=100)
    
    # Get user details for each chat
    users_collection = await get_collection("users")
    
    for chat in chats:
        chat["_id"] = str(chat["_id"])
        
        # Get other participant details
        other_user_id = chat["tasker_id"] if current_user["role"] == "customer" else chat["customer_id"]
        other_user = await users_collection.find_one({"_id": ObjectId(other_user_id)})
        
        if other_user:
            chat["other_user"] = {
                "_id": str(other_user["_id"]),
                "name": other_user["name"],
                "profile_picture": other_user.get("profile_picture"),
                "role": other_user["role"]
            }
        
        # Count unread messages
        unread_count = sum(1 for msg in chat.get("messages", []) 
                          if not msg.get("is_read", False) and msg["sender_id"] != str(current_user["_id"]))
        chat["unread_count"] = unread_count
    
    return chats

@router.get("/{chat_id}")
async def get_chat(
    chat_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get chat messages"""
    chats_collection = await get_collection("chats")
    users_collection = await get_collection("users")
    
    try:
        chat = await chats_collection.find_one({"_id": ObjectId(chat_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid chat ID")
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Check authorization
    if chat["customer_id"] != str(current_user["_id"]) and chat["tasker_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to view this chat")
    
    chat["_id"] = str(chat["_id"])
    
    # Get other participant details
    other_user_id = chat["tasker_id"] if current_user["role"] == "customer" else chat["customer_id"]
    other_user = await users_collection.find_one({"_id": ObjectId(other_user_id)})
    
    if other_user:
        chat["other_user"] = {
            "_id": str(other_user["_id"]),
            "name": other_user["name"],
            "profile_picture": other_user.get("profile_picture"),
            "role": other_user["role"]
        }
    
    # Mark messages as read
    await chats_collection.update_many(
        {
            "_id": ObjectId(chat_id),
            "messages.sender_id": {"$ne": str(current_user["_id"])}
        },
        {"$set": {"messages.$[elem].is_read": True}},
        array_filters=[{"elem.sender_id": {"$ne": str(current_user["_id"])}}]
    )
    
    return chat

@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a chat conversation"""
    chats_collection = await get_collection("chats")
    
    try:
        chat = await chats_collection.find_one({"_id": ObjectId(chat_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid chat ID")
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Check authorization
    if chat["customer_id"] != str(current_user["_id"]) and chat["tasker_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this chat")
    
    result = await chats_collection.delete_one({"_id": ObjectId(chat_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Failed to delete chat")
    
    return {"message": "Chat deleted successfully"}
