from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class LibraryType(str, Enum):
    """剧本库类型枚举"""
    NOVEL = "novel"  # 小说剧本
    AD = "ad"  # 广告创作


class LibraryBase(BaseModel):
    name: str = Field(..., description="剧本库名称")
    type: LibraryType = Field(..., description="剧本库类型: novel(小说剧本) 或 ad(广告创作)")
    description: Optional[str] = Field(None, description="剧本库描述")


class LibraryCreate(LibraryBase):
    pass


class LibraryResponse(LibraryBase):
    id: int
    user_id: str
    minio_folder_path: str
    created_at: datetime

    class Config:
        from_attributes = True


class FileBase(BaseModel):
    filename: str
    file_type: Optional[str] = "text"


class FileResponse(FileBase):
    id: int
    library_id: int
    file_url: Optional[str]
    minio_object_key: str
    content_summary: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class LibraryWithFiles(LibraryResponse):
    files: List[FileResponse] = []
