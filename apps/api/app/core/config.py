import os
from pydantic_settings import BaseSettings
from typing import Optional

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".env"))

class Settings(BaseSettings):
    PROJECT_NAME: str = "RecallRadar API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "recallradar"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: Optional[str] = None

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: Optional[str] = None

    NVIDIA_NIM_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_NIM_API_KEY: Optional[str] = None
    NVIDIA_NIM_MODEL: str = "meta/llama-3.2-11b-vision-instruct"

    CPSC_API_URL: str = "https://www.saferproducts.gov/RestServices"
    SAFER_PRODUCTS_URL: str = "https://www.saferproducts.gov/RestServices"

    @property
    def sync_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def sync_redis_url(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    class Config:
        env_file = ENV_PATH if os.path.exists(ENV_PATH) else ".env"
        extra = "ignore"

settings = Settings()
