from uuid import UUID

from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.scripts.domain.entities.script_entity import Script
from src.modules.scripts.domain.entities.script_library_entity import ScriptLibrary
from src.modules.scripts.domain.repositories import IScriptRepository
from src.modules.scripts.infrastructure.mappers.script_library_mapper import ScriptLibraryMapper
from src.modules.scripts.infrastructure.mappers.script_mapper import ScriptMapper
from src.modules.scripts.infrastructure.models.script_library_model import ScriptLibraryModel
from src.modules.scripts.infrastructure.models.script_library_script_model import ScriptLibraryScriptModel
from src.modules.scripts.infrastructure.models.script_model import ScriptModel


class ScriptRepository(IScriptRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create_library(self, library: ScriptLibrary) -> ScriptLibrary:
        model = ScriptLibraryMapper.to_model(library)
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return ScriptLibraryMapper.to_entity(model)

    async def find_library_by_id(self, library_id: UUID) -> ScriptLibrary | None:
        result = await self._session.execute(
            select(ScriptLibraryModel).where(ScriptLibraryModel.id == library_id)
        )
        model = result.scalar_one_or_none()
        return ScriptLibraryMapper.to_entity(model) if model else None

    async def list_libraries(self) -> list[ScriptLibrary]:
        result = await self._session.execute(
            select(ScriptLibraryModel).order_by(desc(ScriptLibraryModel.created_at))
        )
        models = result.scalars().all()
        return [ScriptLibraryMapper.to_entity(model) for model in models]

    async def delete_library(self, library_id: UUID) -> bool:
        library_result = await self._session.execute(
            select(ScriptLibraryModel).where(ScriptLibraryModel.id == library_id)
        )
        library_model = library_result.scalar_one_or_none()
        if not library_model:
            return False

        mapping_result = await self._session.execute(
            select(ScriptLibraryScriptModel.script_id).where(
                ScriptLibraryScriptModel.library_id == library_id
            )
        )
        script_ids = list(mapping_result.scalars().all())

        if script_ids:
            await self._session.execute(
                delete(ScriptLibraryScriptModel).where(
                    ScriptLibraryScriptModel.library_id == library_id
                )
            )
            await self._session.execute(
                delete(ScriptModel).where(ScriptModel.id.in_(script_ids))
            )

        await self._session.delete(library_model)
        await self._session.commit()
        return True

    async def save_to_library(self, script: Script, library_id: UUID) -> Script:
        script_model = ScriptMapper.to_model(script)
        self._session.add(script_model)
        await self._session.flush()

        mapping = ScriptLibraryScriptModel(
            library_id=library_id,
            script_id=script_model.id,
        )
        self._session.add(mapping)
        await self._session.commit()
        await self._session.refresh(script_model)

        return ScriptMapper.to_entity(script_model, library_id=library_id)

    async def list_all(self, library_id: UUID | None = None) -> list[Script]:
        stmt = (
            select(ScriptModel, ScriptLibraryScriptModel.library_id)
            .outerjoin(
                ScriptLibraryScriptModel,
                ScriptLibraryScriptModel.script_id == ScriptModel.id,
            )
            .order_by(desc(ScriptModel.created_at))
        )

        if library_id:
            stmt = stmt.where(ScriptLibraryScriptModel.library_id == library_id)

        result = await self._session.execute(stmt)
        rows = result.all()
        return [ScriptMapper.to_entity(script_model, mapping_library_id) for script_model, mapping_library_id in rows]

    async def find_by_id(self, script_id: UUID) -> Script | None:
        result = await self._session.execute(
            select(ScriptModel, ScriptLibraryScriptModel.library_id)
            .outerjoin(
                ScriptLibraryScriptModel,
                ScriptLibraryScriptModel.script_id == ScriptModel.id,
            )
            .where(ScriptModel.id == script_id)
        )
        row = result.first()
        if not row:
            return None

        script_model, mapping_library_id = row
        return ScriptMapper.to_entity(script_model, mapping_library_id)

    async def delete(self, script_id: UUID) -> bool:
        script_result = await self._session.execute(
            select(ScriptModel).where(ScriptModel.id == script_id)
        )
        script_model = script_result.scalar_one_or_none()
        if not script_model:
            return False

        mapping_result = await self._session.execute(
            select(ScriptLibraryScriptModel).where(ScriptLibraryScriptModel.script_id == script_id)
        )
        mapping_model = mapping_result.scalar_one_or_none()
        if mapping_model:
            await self._session.delete(mapping_model)

        await self._session.delete(script_model)
        await self._session.commit()
        return True
