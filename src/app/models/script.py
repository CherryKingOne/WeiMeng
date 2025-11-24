from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ScriptLibrary(Base):
    """剧本库（对应 Minio 中的一个文件夹概念）"""
    __tablename__ = "script_libraries"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # 剧本库名称
    description = Column(String, nullable=True)
    minio_folder_path = Column(String, nullable=False)  # 存储在Minio中的前缀路径
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    files = relationship("ScriptFile", back_populates="library", cascade="all, delete-orphan")


class ScriptFile(Base):
    """剧本库中的具体文件"""
    __tablename__ = "script_files"

    id = Column(BigInteger, primary_key=True, index=True)
    library_id = Column(BigInteger, ForeignKey("script_libraries.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=True)  # Minio 访问链接
    minio_object_key = Column(String, nullable=False)  # Minio 中的完整 Key
    content_summary = Column(Text, nullable=True)  # 剧本摘要或生成的内容
    file_type = Column(String, default="text")  # text, image, video
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    library = relationship("ScriptLibrary", back_populates="files")
