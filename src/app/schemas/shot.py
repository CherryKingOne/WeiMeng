from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ============ 基础数据结构 ============

class TextToImagePrompt(BaseModel):
    """图片生成提示词"""
    positive: Optional[str] = None
    negative: Optional[str] = None


class ImageToVideoPrompt(BaseModel):
    """视频生成提示词"""
    positive: Optional[str] = None
    negative: Optional[str] = None


class CharacterPrompts(BaseModel):
    """角色三视图提示词"""
    front: Optional[TextToImagePrompt] = None
    back: Optional[TextToImagePrompt] = None
    side: Optional[TextToImagePrompt] = None


class CharacterImages(BaseModel):
    """角色三视图URL"""
    front: Optional[str] = None
    back: Optional[str] = None
    side: Optional[str] = None


class SceneImages(BaseModel):
    """场景三视图URL"""
    front: Optional[str] = None
    back: Optional[str] = None
    side: Optional[str] = None


# ============ 导入接口相关 ============

class CharacterInfoImport(BaseModel):
    """导入时的角色信息"""
    character_name: Optional[str] = Field(None, alias="characterName")
    gender: Optional[str] = None
    appearance_features: Optional[str] = Field(None, alias="appearanceFeatures")
    text_to_image_prompts: Optional[CharacterPrompts] = Field(None, alias="textToImagePrompts")
    generated_images: Optional[CharacterImages] = Field(None, alias="generatedImages")

    class Config:
        populate_by_name = True


class VisualSceneImport(BaseModel):
    """导入时的视觉场景信息"""
    scene_content: Optional[str] = Field(None, alias="sceneContent")
    shot_size: Optional[str] = Field(None, alias="shotSize")
    camera_movement: Optional[str] = Field(None, alias="cameraMovement")
    scene_images: Optional[SceneImages] = Field(None, alias="sceneImages")

    class Config:
        populate_by_name = True


class AudioPerformanceImport(BaseModel):
    """导入时的音频信息"""
    dialogue_content: Optional[str] = Field(None, alias="dialogueContent")
    voice_over: Optional[str] = Field(None, alias="voiceOver")
    emotion: Optional[str] = None
    sound_effects: Optional[str] = Field(None, alias="soundEffects")

    class Config:
        populate_by_name = True


class VideoInfoImport(BaseModel):
    """导入时的视频信息"""
    video_url: Optional[str] = Field(None, alias="videoUrl")

    class Config:
        populate_by_name = True


class ShotImport(BaseModel):
    """导入时的单个镜头数据"""
    shot_number: Optional[int] = Field(None, alias="shotNumber")
    original_text: Optional[str] = Field(None, alias="originalText")
    original_word_count: Optional[int] = Field(None, alias="originalWordCount")
    shot_type: Optional[str] = Field(None, alias="type")
    duration: Optional[str] = None
    context_summary: Optional[str] = Field(None, alias="contextSummary")
    scene_description_text: Optional[str] = Field(None, alias="sceneDescriptionText")
    core_concept: Optional[str] = Field(None, alias="coreConcept")

    character_info: Optional[CharacterInfoImport] = Field(None, alias="characterInfo")
    visual_scene: Optional[VisualSceneImport] = Field(None, alias="visualScene")
    image_to_video_prompts: Optional[ImageToVideoPrompt] = Field(None, alias="imageToVideoPrompts")
    video: Optional[VideoInfoImport] = None
    audio_performance: Optional[AudioPerformanceImport] = Field(None, alias="audioPerformance")

    class Config:
        populate_by_name = True


class FileInfoImport(BaseModel):
    """导入时的文件信息"""
    file_id: Optional[str] = Field(None, alias="fileId")
    file_name: Optional[str] = Field(None, alias="fileName")
    total_words: Optional[int] = Field(None, alias="totalWords")
    script_generation_time: Optional[datetime] = Field(None, alias="scriptGenerationTime")

    class Config:
        populate_by_name = True


class GlobalConfigImport(BaseModel):
    """导入时的全局配置"""
    visual_style: Optional[str] = Field(None, alias="visualStyle")

    class Config:
        populate_by_name = True


class ShotImportRequest(BaseModel):
    """导入剧本JSON的请求体"""
    library_id: int = Field(..., alias="librarie_id")  # 注意：文档中拼写为 librarie_id
    file_info: Optional[FileInfoImport] = Field(None, alias="fileInfo")
    global_config: Optional[GlobalConfigImport] = Field(None, alias="globalConfig")
    script_shot_list: Optional[List[ShotImport]] = Field(None, alias="scriptShotList")

    class Config:
        populate_by_name = True


class ShotImportResponse(BaseModel):
    """导入响应"""
    file_id: int
    imported_shots: int
    message: str = "Import successful"


# ============ 查询接口相关 ============

class CharacterInfoResponse(BaseModel):
    """角色信息响应"""
    character_id: Optional[int] = None
    character_name: Optional[str] = None
    gender: Optional[str] = None
    appearance_features: Optional[str] = None
    prompts: Optional[CharacterPrompts] = None
    images: Optional[CharacterImages] = None


class VisualSceneResponse(BaseModel):
    """视觉场景响应"""
    scene_content: Optional[str] = None
    shot_size: Optional[str] = None
    camera_movement: Optional[str] = None
    scene_images: Optional[SceneImages] = None


class MediaInfoResponse(BaseModel):
    """媒体信息响应"""
    video_prompt: Optional[ImageToVideoPrompt] = None
    video_url: Optional[str] = None
    dialogue_content: Optional[str] = None
    voice_over: Optional[str] = None
    emotion: Optional[str] = None
    sound_effects: Optional[str] = None


class ShotDetailResponse(BaseModel):
    """镜头详情响应"""
    id: int
    shot_number: int
    original_text: Optional[str] = None
    original_word_count: Optional[int] = None
    shot_type: Optional[str] = None
    duration: Optional[str] = None
    context_summary: Optional[str] = None
    scene_description_text: Optional[str] = None
    core_concept: Optional[str] = None
    memo: Optional[str] = None

    character_info: Optional[CharacterInfoResponse] = None
    visual_scene: Optional[VisualSceneResponse] = None
    media_info: Optional[MediaInfoResponse] = None

    created_at: datetime

    class Config:
        from_attributes = True


class ShotListItem(BaseModel):
    """镜头列表项"""
    id: int
    shot_number: int
    original_text: Optional[str] = None
    scene_description_text: Optional[str] = None
    duration: Optional[str] = None
    shot_type: Optional[str] = None
    character_name: Optional[str] = None
    has_video: bool = False

    class Config:
        from_attributes = True


class ShotListResponse(BaseModel):
    """镜头列表响应"""
    total: int
    page: int
    page_size: int
    items: List[ShotListItem]


# ============ 更新接口相关 ============

class CharacterInfoUpdate(BaseModel):
    """角色信息更新"""
    appearance_features: Optional[str] = None
    prompt_front_pos: Optional[str] = None
    prompt_front_neg: Optional[str] = None
    prompt_back_pos: Optional[str] = None
    prompt_back_neg: Optional[str] = None
    prompt_side_pos: Optional[str] = None
    prompt_side_neg: Optional[str] = None
    img_front_url: Optional[str] = None
    img_back_url: Optional[str] = None
    img_side_url: Optional[str] = None


class VisualSceneUpdate(BaseModel):
    """视觉场景更新"""
    scene_content: Optional[str] = None
    shot_size: Optional[str] = None
    camera_movement: Optional[str] = None
    scene_img_front: Optional[str] = None
    scene_img_back: Optional[str] = None
    scene_img_side: Optional[str] = None


class MediaInfoUpdate(BaseModel):
    """媒体信息更新"""
    video_prompt_pos: Optional[str] = None
    video_prompt_neg: Optional[str] = None
    video_url: Optional[str] = None
    dialogue_content: Optional[str] = None
    voice_over: Optional[str] = None
    emotion: Optional[str] = None
    sound_effects: Optional[str] = None


class ShotUpdateRequest(BaseModel):
    """镜头更新请求"""
    original_text: Optional[str] = None
    shot_type: Optional[str] = None
    duration: Optional[str] = None
    context_summary: Optional[str] = None
    scene_description_text: Optional[str] = None
    core_concept: Optional[str] = None
    memo: Optional[str] = None

    character_info: Optional[CharacterInfoUpdate] = None
    visual_scene: Optional[VisualSceneUpdate] = None
    media_info: Optional[MediaInfoUpdate] = None


# ============ 角色列表相关 ============

class CharacterListItem(BaseModel):
    """角色列表项"""
    id: int
    name: str
    gender: Optional[str] = None
    shot_count: int  # 该角色出现的镜头数
    created_at: datetime

    class Config:
        from_attributes = True


class CharacterListResponse(BaseModel):
    """角色列表响应"""
    library_id: int
    total: int
    items: List[CharacterListItem]
