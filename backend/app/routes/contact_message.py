from fastapi import APIRouter, HTTPException, status, Request
from app.models.contact_message import ContactMessage
from app.database import get_db
from datetime import datetime

router = APIRouter()

@router.post("/contact-message", status_code=status.HTTP_201_CREATED)
def create_contact_message(msg: ContactMessage, request: Request):
    db = get_db()
    data = msg.dict()
    data["created_at"] = datetime.utcnow().isoformat()
    result = db["contact_messages"].insert_one(data)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to save message")
    return {"message": "Contact message saved", "id": str(result.inserted_id)}

@router.get("/contact-messages", status_code=status.HTTP_200_OK)
def get_contact_messages(request: Request):
    db = get_db()
    messages = list(db["contact_messages"].find({}, {"_id": 0}))
    return {"messages": messages}
