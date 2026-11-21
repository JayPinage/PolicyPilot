
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv;

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str
    GROQ_API_KEY:str
    GROQ_MODEL:str
    langfuse_secret_key: str | None = None
    langfuse_public_key: str | None = None
    langfuse_base_url: str = "https://us.cloud.langfuse.com"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
