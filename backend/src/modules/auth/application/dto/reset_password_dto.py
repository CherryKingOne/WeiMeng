from pydantic import BaseModel, EmailStr, Field

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    captcha: str = Field(..., min_length=6, max_length=6, description="6位数字验证码")
    new_password: str = Field(..., min_length=8, description="新密码至少8位")
    confirm_password: str = Field(..., min_length=8, description="确认密码")

class ResetPasswordResponse(BaseModel):
    message: str
