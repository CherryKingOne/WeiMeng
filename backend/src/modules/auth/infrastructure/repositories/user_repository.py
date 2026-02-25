from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.modules.auth.domain.entities.user import User
from src.modules.auth.domain.repositories import IUserRepository
from src.modules.auth.infrastructure.models.user_model import UserModel
from src.modules.auth.infrastructure.mappers.user_mapper import UserMapper

class UserRepository(IUserRepository):
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def find_by_id(self, user_id: str) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        model = result.scalar_one_or_none()
        return UserMapper.to_entity(model) if model else None
    
    async def find_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email)
        )
        model = result.scalar_one_or_none()
        return UserMapper.to_entity(model) if model else None
    
    async def save(self, user: User) -> User:
        model = UserMapper.to_model(user)
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return UserMapper.to_entity(model)
    
    async def update(self, user: User) -> User:
        result = await self._session.execute(
            select(UserModel).where(UserModel.id == user.id)
        )
        model = result.scalar_one_or_none()
        if model:
            model = UserMapper.update_model_from_entity(model, user)
            await self._session.commit()
            await self._session.refresh(model)
            return UserMapper.to_entity(model)
        return None
    
    async def exists_by_email(self, email: str) -> bool:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email)
        )
        return result.scalar_one_or_none() is not None
