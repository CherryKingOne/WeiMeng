from abc import ABC, abstractmethod
from sqlalchemy.ext.asyncio import AsyncSession

class IUnitOfWork(ABC):
    @abstractmethod
    async def commit(self): ...
    
    @abstractmethod
    async def rollback(self): ...

class UnitOfWork(IUnitOfWork):
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def commit(self):
        await self._session.commit()
    
    async def rollback(self):
        await self._session.rollback()
