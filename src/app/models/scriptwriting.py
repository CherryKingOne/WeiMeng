from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ScriptwritingProject(Base):
    __tablename__ = "scriptwriting_projects"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String(50), unique=True, nullable=False, index=True)
    file_name = Column(String(255))
    total_word_count = Column(Integer)
    script_generation_time = Column(DateTime(timezone=True))
    visual_style = Column(String(50))
    context_usage_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    shots = relationship("ScriptwritingShot", back_populates="project", cascade="all, delete-orphan")


class ScriptwritingShot(Base):
    __tablename__ = "scriptwriting_shots"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("scriptwriting_projects.id", ondelete="CASCADE"), nullable=False)
    shot_number = Column(Integer, nullable=False)

    original_text = Column(Text)
    type = Column(String(50))
    duration = Column(String(20))
    video_url = Column(Text)

    character_name = Column(String(100))
    character_gender = Column(String(20))
    character_desc = Column(Text)

    scene_content = Column(Text)
    shot_size = Column(String(50))
    camera_movement = Column(String(50))

    front_image_url = Column(Text)
    back_image_url = Column(Text)
    side_image_url = Column(Text)

    dialogue_content = Column(Text)
    voice_over = Column(Text)
    voice_emotion = Column(String(50))
    sound_effects = Column(Text)

    prompts_data = Column(JSONB)
    context_summary = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("ScriptwritingProject", back_populates="shots")

    __table_args__ = (
        Index('idx_shots_project_id', 'project_id'),
        Index('idx_shots_project_number', 'project_id', 'shot_number', unique=True),
    )
