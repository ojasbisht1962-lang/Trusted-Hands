from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from fastapi.responses import JSONResponse, Response
import os
import httpx

router = APIRouter()


GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

# Define Pydantic models for request body
class ChatbotContentPart(BaseModel):
    text: str

class ChatbotContent(BaseModel):
    role: str
    parts: List[ChatbotContentPart]

class ChatbotRequest(BaseModel):
    contents: List[ChatbotContent]

@router.post("/api/chatbot")
async def chatbot_proxy(request: ChatbotRequest):
    data = request.dict()
    if not data or 'contents' not in data:
        return JSONResponse({'error': 'Missing contents'}, status_code=400)
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                GEMINI_API_URL,
                headers={"Content-Type": "application/json"},
                json={"contents": data['contents']}
            )
        # If Gemini returns an error, return JSON, not raw response
        if res.status_code != 200:
            return JSONResponse({'error': res.text, 'status_code': res.status_code}, status_code=res.status_code)
        return Response(content=res.text, status_code=res.status_code, headers=dict(res.headers))
    except Exception as e:
        return JSONResponse({'error': str(e)}, status_code=500)
