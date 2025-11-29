from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct, String
from app.core.database import get_db
from app.models.shot_text import ShotText
from app.models.script import ScriptFile
from app.schemas.shot_text import ShotCreate, ShotUpdate, ShotResponse
from app.schemas.common import Response
from app.utils.id_generator import generate_numeric_uuid20
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


router = APIRouter()


class ScriptWithShotsInfo(BaseModel):
    """包含分镜头的脚本信息"""
    library_id: str
    script_id: str
    shot_count: int

    class Config:
        from_attributes = True


class ShotListResponse(BaseModel):
    """分镜头列表响应（不包含content内容）"""
    shot_uuid: str
    library_id: str
    script_id: str
    filename: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/scripts-with-shots", response_model=Response[List[ScriptWithShotsInfo]])
async def get_scripts_with_shots(
    library_id: str = Query(..., description="剧本库 ID"),
    db: AsyncSession = Depends(get_db)
):
    """获取指定剧本库下包含分镜头的脚本列表"""
    query = (
        select(
            ShotText.library_id,
            ShotText.script_id,
            func.count(ShotText.shot_uuid).label('shot_count')
        )
        .where(ShotText.library_id == library_id)
        .group_by(ShotText.library_id, ShotText.script_id)
        .order_by(func.max(ShotText.created_at).desc())
    )

    result = await db.execute(query)
    scripts = result.all()

    return Response(
        code=200,
        message="Success",
        data=[
            ScriptWithShotsInfo(library_id=lib_id, script_id=script_id, shot_count=shot_count)
            for lib_id, script_id, shot_count in scripts
        ]
    )


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


@router.get("/list", response_model=Response[List[ShotListResponse]])
async def list_shots(
    library_id: str = Query(..., description="剧本库 ID"),
    script_id: str = Query(None, description="脚本 ID，可选，不传则返回该库下所有分镜"),
    db: AsyncSession = Depends(get_db)
):
    """获取分镜列表（不包含content内容）"""
    # 使用 LEFT JOIN 获取文件名
    query = (
        select(
            ShotText.shot_uuid,
            ShotText.library_id,
            ShotText.script_id,
            ScriptFile.filename,
            ShotText.created_at,
            ShotText.updated_at
        )
        .outerjoin(ScriptFile, ShotText.script_id == ScriptFile.id.cast(String))
        .where(ShotText.library_id == library_id)
    )

    if script_id:
        query = query.where(ShotText.script_id == script_id)

    query = query.order_by(ShotText.created_at.desc())

    result = await db.execute(query)
    shots = result.all()

    return Response(
        code=200,
        message="Success",
        data=[
            ShotListResponse(
                shot_uuid=shot.shot_uuid,
                library_id=shot.library_id,
                script_id=shot.script_id,
                filename=shot.filename,
                created_at=shot.created_at,
                updated_at=shot.updated_at
            )
            for shot in shots
        ]
    )


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
