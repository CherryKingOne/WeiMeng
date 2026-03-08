from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.modules.scripts.domain.entities.script_entity import Script
from src.modules.scripts.domain.entities.script_library_entity import ScriptLibrary


class CreateScriptLibraryRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=128, description="剧本库名称")
    description: str | None = Field(default=None, description="剧本库描述")


class ScriptLibraryResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    created_at: datetime

    @classmethod
    def from_entity(cls, library: ScriptLibrary) -> "ScriptLibraryResponse":
        return cls(
            id=library.id,
            name=library.name,
            description=library.description,
            created_at=library.created_at,
        )


class ScriptLibraryDetailResponse(ScriptLibraryResponse):
    updated_at: datetime
    script_count: int = 0


class ScriptLibraryDeleteResponse(BaseModel):
    message: str
    deleted_script_count: int = 0


class ScriptItemResponse(BaseModel):
    id: UUID
    library_id: UUID | None = None
    original_name: str
    file_extension: str
    content_type: str
    file_size: int
    created_at: datetime

    @classmethod
    def from_entity(cls, script: Script) -> "ScriptItemResponse":
        return cls(
            id=script.id,
            library_id=script.library_id,
            original_name=script.original_name,
            file_extension=script.file_extension,
            content_type=script.content_type,
            file_size=script.file_size,
            created_at=script.created_at,
        )


class ScriptUploadResponse(ScriptItemResponse):
    pass


class ScriptDeleteResponse(BaseModel):
    message: str
