from src.modules.scripts.domain.entities.script_config_entity import ScriptConfig
from src.modules.scripts.infrastructure.models.script_config_model import ScriptConfigModel


class ScriptConfigMapper:
    @staticmethod
    def to_entity(model: ScriptConfigModel) -> ScriptConfig:
        return ScriptConfig(
            library_id=model.library_id,
            chunk_size=model.chunk_size,
            chunk_overlap=model.chunk_overlap,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
