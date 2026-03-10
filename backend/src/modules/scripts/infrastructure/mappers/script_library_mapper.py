from src.modules.scripts.domain.entities.script_library_entity import ScriptLibrary
from src.modules.scripts.infrastructure.models.script_library_model import ScriptLibraryModel


class ScriptLibraryMapper:
    @staticmethod
    def to_entity(model: ScriptLibraryModel) -> ScriptLibrary:
        return ScriptLibrary(
            id=model.id,
            name=model.name,
            description=model.description,
            avatar_path=model.avatar_path,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: ScriptLibrary) -> ScriptLibraryModel:
        return ScriptLibraryModel(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            avatar_path=entity.avatar_path,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
