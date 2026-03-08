from abc import ABC, abstractmethod
from uuid import UUID

from src.modules.scripts.domain.entities.script_entity import Script
from src.modules.scripts.domain.entities.script_library_entity import ScriptLibrary


class IScriptRepository(ABC):
    @abstractmethod
    async def create_library(self, library: ScriptLibrary) -> ScriptLibrary:
        pass

    @abstractmethod
    async def find_library_by_id(self, library_id: UUID) -> ScriptLibrary | None:
        pass

    @abstractmethod
    async def list_libraries(self) -> list[ScriptLibrary]:
        pass

    @abstractmethod
    async def delete_library(self, library_id: UUID) -> bool:
        pass

    @abstractmethod
    async def save_to_library(self, script: Script, library_id: UUID) -> Script:
        pass

    @abstractmethod
    async def list_all(self, library_id: UUID | None = None) -> list[Script]:
        pass

    @abstractmethod
    async def find_by_id(self, script_id: UUID) -> Script | None:
        pass

    @abstractmethod
    async def delete(self, script_id: UUID) -> bool:
        pass
