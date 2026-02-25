from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    username: str = Field(..., description="用户名")
    email: EmailStr
    password: str = Field(..., min_length=8, description="密码至少8位")
    captcha: str = Field(..., min_length=6, max_length=6, description="6位数字验证码")

class RegisterResponse(BaseModel):
    message: str
