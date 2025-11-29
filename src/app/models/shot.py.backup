from sqlalchemy import Column, BigInteger, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ScriptShotFile(Base):
    """剧本文件表 - 对应 JSON 顶层 fileInfo 和 globalConfig"""
    __tablename__ = "script_shot_files"

    id = Column(BigInteger, primary_key=True, index=True)
    library_id = Column(BigInteger, nullable=False, index=True)  # 关联外部剧本库ID
    file_identifier = Column(String(100))  # 对应 fileId
    file_name = Column(String(255))  # 对应 fileName
    total_words = Column(Integer)  # 对应 totalWords
    visual_style = Column(String(100))  # 对应 globalConfig.visualStyle
    generation_time = Column(DateTime(timezone=True))  # 对应 scriptGenerationTime
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    shots = relationship("ScriptShot", back_populates="file", cascade="all, delete-orphan")


class ScriptShot(Base):
    """镜头基础表 - 对应 scriptShotList 的基础字段"""
    __tablename__ = "script_shots"

    id = Column(BigInteger, primary_key=True, index=True)
    file_id = Column(BigInteger, ForeignKey("script_shot_files.id", ondelete="CASCADE"), nullable=False)
    shot_number = Column(Integer, nullable=False)  # 镜号
    original_text = Column(Text)  # 原始内容
    original_word_count = Column(Integer)  # 字数
    shot_type = Column(String(50))  # 类型 (对话/旁白等)
    duration = Column(String(20))  # 时长 (3.5s)
    context_summary = Column(Text)  # 上下文总结
    scene_description_text = Column(Text)  # 对生成的画面进行描述
    core_concept = Column(Text)  # 核心概念提取
    memo = Column(Text)  # 备注 (用于筛选或标记)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    file = relationship("ScriptShotFile", back_populates="shots")
    characters = relationship("ScriptShotCharacter", back_populates="shot", cascade="all, delete-orphan")
    scene = relationship("ScriptShotScene", back_populates="shot", uselist=False, cascade="all, delete-orphan")
    media = relationship("ScriptShotMedia", back_populates="shot", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_shots_file_id', 'file_id'),
    )


class ScriptCharacter(Base):
    """角色注册表 - 用于复用角色ID"""
    __tablename__ = "script_characters"

    id = Column(BigInteger, primary_key=True, index=True)
    library_id = Column(BigInteger, nullable=False, index=True)  # 归属的剧本库
    name = Column(String(100), nullable=False)  # 角色名 (如: 林风眠)
    gender = Column(String(20))  # 性别
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    shot_characters = relationship("ScriptShotCharacter", back_populates="character")

    __table_args__ = (
        Index('idx_characters_library_name', 'library_id', 'name', unique=True),
    )


class ScriptShotCharacter(Base):
    """镜头角色详情表 - 对应 characterInfo"""
    __tablename__ = "script_shot_characters"

    id = Column(BigInteger, primary_key=True, index=True)
    shot_id = Column(BigInteger, ForeignKey("script_shots.id", ondelete="CASCADE"), nullable=False)
    character_id = Column(BigInteger, ForeignKey("script_characters.id"), nullable=True)
    appearance_features = Column(Text)  # 本镜头中的外观特征 (可能换装)

    # 图片提示词拆解 (正面)
    prompt_front_pos = Column(Text)  # 正面-正向提示词
    prompt_front_neg = Column(Text)  # 正面-反向提示词
    img_front_url = Column(Text)  # 生成的正面图路径

    # 图片提示词拆解 (背面)
    prompt_back_pos = Column(Text)
    prompt_back_neg = Column(Text)
    img_back_url = Column(Text)

    # 图片提示词拆解 (侧面)
    prompt_side_pos = Column(Text)
    prompt_side_neg = Column(Text)
    img_side_url = Column(Text)

    # Relationships
    shot = relationship("ScriptShot", back_populates="characters")
    character = relationship("ScriptCharacter", back_populates="shot_characters")


class ScriptShotScene(Base):
    """镜头视觉场景表 - 对应 visualScene"""
    __tablename__ = "script_shot_scenes"

    id = Column(BigInteger, primary_key=True, index=True)
    shot_id = Column(BigInteger, ForeignKey("script_shots.id", ondelete="CASCADE"), nullable=False, unique=True)
    scene_content = Column(Text)  # 场景内容描述
    shot_size = Column(String(50))  # 景别 (中景/全景)
    camera_movement = Column(String(50))  # 运镜 (固定镜头/跟随)

    # 场景参考图/生成图路径 (对应 visualScene 中的 frontImage 等)
    scene_img_front = Column(Text)
    scene_img_back = Column(Text)
    scene_img_side = Column(Text)

    # Relationships
    shot = relationship("ScriptShot", back_populates="scene")


class ScriptShotMedia(Base):
    """镜头音视频生成表 - 对应 imageToVideoPrompts, video, audioPerformance"""
    __tablename__ = "script_shot_media"

    id = Column(BigInteger, primary_key=True, index=True)
    shot_id = Column(BigInteger, ForeignKey("script_shots.id", ondelete="CASCADE"), nullable=False, unique=True)

    # 视频生成提示词
    video_prompt_pos = Column(Text)  # 视频正向
    video_prompt_neg = Column(Text)  # 视频反向
    video_url = Column(Text)  # 最终视频地址

    # 音频/对白信息
    dialogue_content = Column(Text)  # 对白内容
    voice_over = Column(Text)  # 旁白
    emotion = Column(String(100))  # 情感
    sound_effects = Column(String(255))  # 音效

    # Relationships
    shot = relationship("ScriptShot", back_populates="media")
