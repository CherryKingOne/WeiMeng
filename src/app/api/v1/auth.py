from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.models.verification_code import VerificationCode, VerificationType
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, VerificationCodeRequest, PasswordResetRequest
from app.services.email_service import email_service
from app.utils.id_generator import generate_user_id
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/send-code", status_code=status.HTTP_200_OK)
async def send_verification_code(
    request: VerificationCodeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Send verification code to email - automatically determines type based on user existence"""
    # Check if user exists
    result = await db.execute(select(User).where(User.email == request.email))
    user_exists = result.scalars().first() is not None
    
    # Determine verification type based on user existence
    verification_type = VerificationType.RESET_PASSWORD if user_exists else VerificationType.REGISTER
    
    # Generate code
    code = email_service.generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    # Save code to DB
    # Invalidate previous codes of the same type
    await db.execute(
        update(VerificationCode)
        .where(VerificationCode.email == request.email)
        .where(VerificationCode.type == verification_type)
        .where(VerificationCode.is_used == False)
        .values(is_used=True)
    )
    
    new_code = VerificationCode(
        email=request.email,
        code=code,
        type=verification_type,
        expires_at=expires_at
    )
    db.add(new_code)
    await db.commit()
    
    # Send email in background
    background_tasks.add_task(email_service.send_verification_code, request.email, code)
    
    return {"message": "Verification code sent"}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user with verification code"""
    # Verify code
    result = await db.execute(
        select(VerificationCode)
        .where(VerificationCode.email == user_data.email)
        .where(VerificationCode.code == str(user_data.code))
        .where(VerificationCode.type == VerificationType.REGISTER)
        .where(VerificationCode.is_used == False)
        .where(VerificationCode.expires_at > datetime.now(timezone.utc))
    )
    verification = result.scalars().first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
    
    # Mark code as used
    verification.is_used = True
    
    # Check if user already exists (double check)
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_id = generate_user_id()

    # 提取邮箱前缀作为默认用户名
    username = user_data.email.split('@')[0]
    account = user_data.email

    new_user = User(
        id=user_id,
        email=user_data.email,
        account=account,
        username=username,
        hashed_password=hashed_password
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """Reset password with verification code"""
    # Verify code
    result = await db.execute(
        select(VerificationCode)
        .where(VerificationCode.email == request.email)
        .where(VerificationCode.code == str(request.code))
        .where(VerificationCode.type == VerificationType.RESET_PASSWORD)
        .where(VerificationCode.is_used == False)
        .where(VerificationCode.expires_at > datetime.now(timezone.utc))
    )
    verification = result.scalars().first()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
    
    # Mark code as used
    verification.is_used = True
    
    # Update user password
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.hashed_password = get_password_hash(request.new_password)
    await db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Login and get access token"""
    # Find user
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalars().first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer", "user_id": str(user.id)}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user
