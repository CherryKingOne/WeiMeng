from abc import ABC, abstractmethod
from uuid import UUID

from src.modules.scripts.domain.entities.script_chunk_entity import ScriptChunk
from src.modules.scripts.domain.entities.script_config_entity import ScriptConfig
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
    async def update_library_profile(
        self,
        library_id: UUID,
        name: str,
        description: str | None,
    ) -> ScriptLibrary | None:
        pass

    @abstractmethod
    async def update_library_avatar(
        self,
        library_id: UUID,
        avatar_path: str | None,
    ) -> ScriptLibrary | None:
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

    @abstractmethod
    async def list_chunks(self, script_id: UUID, library_id: UUID) -> list[ScriptChunk]:
        pass

    @abstractmethod
    async def replace_chunks(
        self,
        script_id: UUID,
        library_id: UUID,
        chunks: list[ScriptChunk],
    ) -> None:
        pass

    @abstractmethod
    async def get_library_config(self, library_id: UUID) -> ScriptConfig | None:
        pass

    @abstractmethod
    async def upsert_library_config(
        self,
        library_id: UUID,
        chunk_size: int,
        chunk_overlap: int,
    ) -> ScriptConfig:
        pass


class IScriptChunkStore(ABC):
    @abstractmethod
    async def index_chunks(self, chunks: list[ScriptChunk]) -> None:
        pass

    @abstractmethod
    async def get_chunks(self, chunk_refs: list[ScriptChunk]) -> list[ScriptChunk]:
        pass

    @abstractmethod
    async def delete_chunks(self, chunk_ids: list[UUID]) -> None:
        pass
