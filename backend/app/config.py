from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "trustedhands"
    secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: Optional[str] = None
    gemini_api_key: str
    backend_url: str = "https://trustedhands-backend.onrender.com"
    frontend_url: str = "https://trusted-hands.vercel.app"
    allowed_origins: str = "https://trusted-hands.vercel.app,https://trustedhands-backend.onrender.com,http://localhost:3000,http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    @property
    def origins_list(self) -> List[str]:
        origins = [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]
        if self.frontend_url not in origins:
            origins.append(self.frontend_url)
        if self.backend_url not in origins:
            origins.append(self.backend_url)
        return list(set(origins))

settings = Settings()
