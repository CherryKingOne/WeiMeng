from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class LibraryBase(BaseModel):
    name: str
    description: Optional[str] = None


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
