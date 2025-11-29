from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.shot_text import ShotText
from app.schemas.shot_text import ShotCreate, ShotUpdate, ShotResponse
from app.schemas.common import Response
from app.utils.id_generator import generate_numeric_uuid20


router = APIRouter()


@router.post("", response_model=Response[ShotResponse])
async def create_shot(req: ShotCreate, db: AsyncSession = Depends(get_db)):
    shot_uuid = generate_numeric_uuid20()
    shot = ShotText(
        shot_uuid=shot_uuid,
        library_id=req.library_id,
        script_id=req.script_id,
        content=req.text
    )
    db.add(shot)
    await db.commit()
    await db.refresh(shot)
    return Response(code=200, message="Success", data=ShotResponse.model_validate(shot, from_attributes=True))


@router.get("", response_model=Response[ShotResponse])
async def get_shot(shot_uuid: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ShotText).where(ShotText.shot_uuid == shot_uuid))
    obj = result.scalars().first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(code=200, message="Success", data=ShotResponse.model_validate(obj, from_attributes=True))


@router.put("", response_model=Response[ShotResponse])
async def update_shot(req: ShotUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ShotText).where(ShotText.shot_uuid == req.shot_uuid))
    obj = result.scalars().first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    obj.content = req.text
    await db.commit()
    await db.refresh(obj)
    return Response(code=200, message="Success", data=ShotResponse.model_validate(obj, from_attributes=True))


@router.delete("", response_model=Response[dict])
async def delete_shot(shot_uuid: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ShotText).where(ShotText.shot_uuid == shot_uuid))
    obj = result.scalars().first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(obj)
    await db.commit()
    return Response(code=200, message="Deleted", data={"shot_uuid": shot_uuid})
