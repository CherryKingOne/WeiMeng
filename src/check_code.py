import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.verification_code import VerificationCode

async def check_codes():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(VerificationCode)
            .where(VerificationCode.email == "cherry_050607@163.com")
            .order_by(VerificationCode.created_at.desc())
            .limit(5)
        )
        codes = result.scalars().all()
        
        print("\n" + "="*80)
        print(f"验证码记录 - cherry_050607@163.com")
        print("="*80)
        
        if not codes:
            print("未找到验证码记录")
        else:
            for code in codes:
                now = datetime.now(timezone.utc)
                expired = code.expires_at < now
                print(f"\n代码: {code.code}")
                print(f"类型: {code.type}")
                print(f"已使用: {code.is_used}")
                print(f"创建时间: {code.created_at}")
                print(f"过期时间: {code.expires_at}")
                print(f"当前时间: {now}")
                print(f"是否过期: {expired}")
                print("-" * 40)

if __name__ == "__main__":
    asyncio.run(check_codes())
