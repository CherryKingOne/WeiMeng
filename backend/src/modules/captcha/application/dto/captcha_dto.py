from pydantic import BaseModel, EmailStr

class CaptchaSendRequest(BaseModel):
    email: EmailStr

class CaptchaSendResponse(BaseModel):
    message: str
