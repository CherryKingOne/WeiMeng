from src.modules.scripts.domain.entities.script_chunk_entity import ScriptChunk
from src.modules.scripts.infrastructure.models.script_chunk_model import ScriptChunkModel


class ScriptChunkMapper:
    @staticmethod
    def to_entity(model: ScriptChunkModel) -> ScriptChunk:
        return ScriptChunk(
            id=model.id,
            script_id=model.script_id,
            library_id=model.library_id,
            index_id=model.index_id,
            created_at=model.created_at,
            updated_at=model.created_at,
        )

    @staticmethod
    def to_model(entity: ScriptChunk) -> ScriptChunkModel:
        return ScriptChunkModel(
            id=entity.id,
            script_id=entity.script_id,
            library_id=entity.library_id,
            index_id=entity.index_id,
            created_at=entity.created_at,
        )
