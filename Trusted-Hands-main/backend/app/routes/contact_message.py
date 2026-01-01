from fastapi import APIRouter, HTTPException, status, Request
from app.models.contact_message import ContactMessage
from app.database import get_collection
from datetime import datetime

router = APIRouter()

@router.post("/contact-message", status_code=status.HTTP_201_CREATED)
async def create_contact_message(msg: ContactMessage):
    collection = await get_collection("contact_messages")
    data = msg.dict()
    data["created_at"] = datetime.utcnow().isoformat()
    result = await collection.insert_one(data)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to save message")
    return {"message": "Contact message saved", "id": str(result.inserted_id)}

@router.get("/contact-messages", status_code=status.HTTP_200_OK)
async def get_contact_messages():
    collection = await get_collection("contact_messages")
    messages = await collection.find({}, {"_id": 0}).to_list(length=1000)
    return {"messages": messages}
