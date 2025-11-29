from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ShotCreate(BaseModel):
    library_id: str
    script_id: str
    text: str


class ShotUpdate(BaseModel):
    shot_uuid: str
    text: str


class ShotResponse(BaseModel):
    shot_uuid: str
    library_id: str
    script_id: str
    text: str = Field(alias="content")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True
