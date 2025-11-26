from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class CharacterInfo(BaseModel):
    character_name: Optional[str] = None
    gender: Optional[str] = None
    appearance_description: Optional[str] = None


class VisualContent(BaseModel):
    scene_content: Optional[str] = None
    shot_size: Optional[str] = None
    camera_movement: Optional[str] = None
    front_image_url: Optional[str] = None
    back_image_url: Optional[str] = None
    side_image_url: Optional[str] = None
    text_to_image_prompt: Optional[Dict[str, Any]] = None
    image_to_video_prompt: Optional[Dict[str, Any]] = None


class AudioInfo(BaseModel):
    dialogue_content: Optional[str] = None
    voice_over: Optional[str] = None
    voice_emotion: Optional[str] = None
    sound_effects: Optional[str] = None


class ShotCreate(BaseModel):
    shot_number: Optional[int] = None
    original_text: Optional[str] = None
    type: Optional[str] = None
    duration: Optional[str] = None
    video_url: Optional[str] = None
    character_info: Optional[CharacterInfo] = None
    visual_content: Optional[VisualContent] = None
    audio_info: Optional[AudioInfo] = None
    context_summary: Optional[str] = None


class ShotResponse(BaseModel):
    shot_id: int = Field(..., alias="id")
    shot_number: int
    original_text: Optional[str] = None
    type: Optional[str] = None
    duration: Optional[str] = None
    video_url: Optional[str] = None
    character_info: Optional[CharacterInfo] = None
    visual_content: Optional[VisualContent] = None
    audio_info: Optional[AudioInfo] = None
    context_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class ShotListItem(BaseModel):
    shot_id: int = Field(..., alias="id")
    shot_number: int
    original_text: Optional[str] = None
    visual_content_summary: Optional[str] = None
    status: str = "completed"

    class Config:
        from_attributes = True
        populate_by_name = True


class ShotUpdate(BaseModel):
    visual_content: Optional[VisualContent] = None
    video_url: Optional[str] = None
    audio_info: Optional[AudioInfo] = None


class FileInfo(BaseModel):
    file_id: Optional[str] = None
    file_name: Optional[str] = None
    total_word_count: Optional[int] = None
    script_generation_time: Optional[datetime] = None


class GlobalConfig(BaseModel):
    visual_style: Optional[str] = None
    context_usage_count: Optional[int] = None


class ProjectCreate(BaseModel):
    file_info: Optional[FileInfo] = None
    global_config: Optional[GlobalConfig] = None
    script_shot_list: Optional[List[ShotCreate]] = None


class ProjectResponse(BaseModel):
    project_id: int
    file_id: str
    shot_count: int


class ProjectDetail(BaseModel):
    file_info: FileInfo
    global_config: Optional[GlobalConfig] = None
    script_shot_list: List[ShotResponse]


class SearchShotsRequest(BaseModel):
    character_name: Optional[str] = None
    visual_style: Optional[str] = None
    type: Optional[str] = None


class ProjectDeleteResponse(BaseModel):
    file_id: str
    deleted_shots: int
