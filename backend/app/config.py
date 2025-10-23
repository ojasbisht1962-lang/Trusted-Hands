from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "trustedhands"
    
    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: Optional[str] = None  # Optional - used by frontend
    
    # Gemini API
    gemini_api_key: str
    
    # Server
    backend_url: str = "https://trustedhands-backend.onrender.com"
    frontend_url: str = "https://trusted-hands.vercel.app"
    allowed_origins: str = "https://trusted-hands.vercel.app,https://trustedhands-backend.onrender.com,http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

settings = Settings()
