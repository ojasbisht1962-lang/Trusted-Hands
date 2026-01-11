"""
AI Service for analyzing images using Google Gemini API
"""
import os
import json
import requests
import base64
from typing import Dict, Optional
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        # Using REST API with gemini-2.5-flash
        self.api_url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-exp:generateContent?key={self.api_key}"
    
    async def analyze_issue_image(self, image_data: bytes) -> Dict[str, any]:
        """
        Analyze an image to determine the type of service/worker needed
        
        Args:
            image_data: Image bytes
            
        Returns:
            Dictionary with suggested category and confidence
        """
        try:
            # Convert image to base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # Create a detailed prompt for the AI
            prompt = """
            Analyze this image carefully and determine what type of home service or maintenance issue it shows.
            
            Based on the image, classify the issue into ONE of these categories:
            - electrician: Electrical issues, wiring, switches, outlets, electrical appliances
            - plumber: Plumbing issues, water leaks, pipes, taps, drainage
            - carpenter: Wood work, furniture repair, doors, windows
            - ac_servicing: Air conditioner repair or maintenance
            - ro_servicing: Water purifier or RO system issues
            - appliance_repair: General appliance repairs (washing machine, fridge, etc.)
            - painting: Wall painting, repainting needs
            - pest_control: Pest infestations, insects, rodents
            - car_washing: Car cleaning or washing needs
            - bathroom_cleaning: Bathroom cleaning requirements
            - home_cleaning: General home cleaning
            - gardening: Garden maintenance, plants, lawn care
            - pet_care: Pet-related services
            - other: If none of the above categories fit
            
            Respond in this exact JSON format:
            {
                "category": "category_name",
                "confidence": 0.85,
                "description": "Brief description of what you see",
                "reasoning": "Why you chose this category"
            }
            
            Make sure confidence is between 0 and 1. Only respond with the JSON, no additional text.
            """
            
            # Prepare the request payload
            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_base64
                            }
                        }
                    ]
                }]
            }
            
            # Make the API request
            response = requests.post(self.api_url, json=payload, timeout=30)
            response.raise_for_status()
            
            # Parse the response
            response_data = response.json()
            result_text = response_data['candidates'][0]['content']['parts'][0]['text'].strip()
            
            # Remove markdown code blocks if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            # Try to parse as JSON
            result = json.loads(result_text)
            
            # Validate the result
            if "category" not in result:
                raise ValueError("AI response missing category field")
            
            # Ensure confidence is present and valid
            if "confidence" not in result:
                result["confidence"] = 0.5
            
            return {
                "success": True,
                "category": result.get("category", "other"),
                "confidence": float(result.get("confidence", 0.5)),
                "description": result.get("description", ""),
                "reasoning": result.get("reasoning", ""),
                "raw_response": result_text
            }
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract category from text
            return {
                "success": False,
                "error": "Failed to parse AI response",
                "raw_response": result_text if 'result_text' in locals() else str(e)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_category_display_name(self, category: str) -> str:
        """Convert category code to display name"""
        category_map = {
            "electrician": "Electrician",
            "plumber": "Plumber",
            "carpenter": "Carpenter",
            "ac_servicing": "AC Servicing",
            "ro_servicing": "RO Servicing",
            "appliance_repair": "Appliance Repair",
            "painting": "Painting",
            "pest_control": "Pest Control",
            "car_washing": "Car Washing",
            "bathroom_cleaning": "Bathroom Cleaning",
            "home_cleaning": "Home Cleaning",
            "assignment_writing": "Assignment Writing",
            "project_making": "Project Making",
            "tutoring": "Tutoring",
            "pet_care": "Pet Care",
            "gardening": "Gardening",
            "delivery": "Delivery",
            "other": "Other"
        }
        return category_map.get(category, category.replace("_", " ").title())

# Create a function to get AI service instance (lazy loading)
_ai_service_instance = None

def get_ai_service():
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance
