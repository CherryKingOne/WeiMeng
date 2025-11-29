# Import all models to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.script import ScriptLibrary, ScriptFile
from app.models.verification_code import VerificationCode
from app.models.chat import ChatSession, ChatMessage, ChatRequestTask, ChatError
from app.models.model_config import ModelConfig
from app.models.scriptwriting import ScriptwritingProject, ScriptwritingShot
from app.models.shot_text import ShotText

__all__ = [
    "User",
    "ScriptLibrary",
    "ScriptFile",
    "VerificationCode",
    "ChatSession",
    "ChatMessage",
    "ChatRequestTask",
    "ChatError",
    "ModelConfig",
    "ScriptwritingProject",
    "ScriptwritingShot",
    "ShotText",
]
