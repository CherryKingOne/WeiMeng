from src.modules.scripts.domain.entities.script_entity import Script
from src.modules.scripts.infrastructure.models.script_model import ScriptModel


class ScriptMapper:
    @staticmethod
    def to_entity(model: ScriptModel, library_id=None) -> Script:
        return Script(
            id=model.id,
            library_id=library_id,
            original_name=model.original_name,
            storage_path=model.storage_path,
            file_extension=model.file_extension,
            content_type=model.content_type,
            file_size=model.file_size,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: Script) -> ScriptModel:
        return ScriptModel(
            id=entity.id,
            original_name=entity.original_name,
            storage_path=entity.storage_path,
            file_extension=entity.file_extension,
            content_type=entity.content_type,
            file_size=entity.file_size,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
