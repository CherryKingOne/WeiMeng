from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List

from app.core.database import get_db
from app.models.scriptwriting import ScriptwritingProject, ScriptwritingShot
from app.schemas.scriptwriting import (
    ProjectCreate, ProjectResponse, ProjectDetail, ProjectDeleteResponse,
    ShotResponse, ShotListItem, ShotUpdate, SearchShotsRequest,
    FileInfo, GlobalConfig, CharacterInfo, VisualContent, AudioInfo
)
from app.schemas.common import Response

router = APIRouter()


@router.post("/projects", response_model=Response[ProjectResponse])
async def create_project(
    project: ProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create/import a script project"""
    file_id = project.file_info.file_id if project.file_info else None

    # Check if file_id already exists
    if file_id:
        result = await db.execute(
            select(ScriptwritingProject).where(ScriptwritingProject.file_id == file_id)
        )
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="File ID already exists")

    # Create project
    db_project = ScriptwritingProject(
        file_id=file_id,
        file_name=project.file_info.file_name if project.file_info else None,
        total_word_count=project.file_info.total_word_count if project.file_info else None,
        script_generation_time=project.file_info.script_generation_time if project.file_info else None,
        visual_style=project.global_config.visual_style if project.global_config else None,
        context_usage_count=project.global_config.context_usage_count if project.global_config else None
    )
    db.add(db_project)
    await db.flush()

    # Create shots
    for shot in (project.script_shot_list or []):
        prompts_data = {}
        if shot.visual_content:
            if shot.visual_content.text_to_image_prompt:
                prompts_data['text_to_image_prompt'] = shot.visual_content.text_to_image_prompt
            if shot.visual_content.image_to_video_prompt:
                prompts_data['image_to_video_prompt'] = shot.visual_content.image_to_video_prompt

        db_shot = ScriptwritingShot(
            project_id=db_project.id,
            shot_number=shot.shot_number,
            original_text=shot.original_text,
            type=shot.type,
            duration=shot.duration,
            video_url=shot.video_url,
            character_name=shot.character_info.character_name if shot.character_info else None,
            character_gender=shot.character_info.gender if shot.character_info else None,
            character_desc=shot.character_info.appearance_description if shot.character_info else None,
            scene_content=shot.visual_content.scene_content if shot.visual_content else None,
            shot_size=shot.visual_content.shot_size if shot.visual_content else None,
            camera_movement=shot.visual_content.camera_movement if shot.visual_content else None,
            front_image_url=shot.visual_content.front_image_url if shot.visual_content else None,
            back_image_url=shot.visual_content.back_image_url if shot.visual_content else None,
            side_image_url=shot.visual_content.side_image_url if shot.visual_content else None,
            dialogue_content=shot.audio_info.dialogue_content if shot.audio_info else None,
            voice_over=shot.audio_info.voice_over if shot.audio_info else None,
            voice_emotion=shot.audio_info.voice_emotion if shot.audio_info else None,
            sound_effects=shot.audio_info.sound_effects if shot.audio_info else None,
            prompts_data=prompts_data if prompts_data else None,
            context_summary=shot.context_summary
        )
        db.add(db_shot)

    await db.commit()

    return Response(
        code=200,
        message="Script imported successfully",
        data=ProjectResponse(
            project_id=db_project.id,
            file_id=db_project.file_id,
            shot_count=len(project.script_shot_list)
        )
    )


@router.get("/projects/{file_id}", response_model=Response[ProjectDetail])
async def get_project(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get full script project JSON"""
    result = await db.execute(
        select(ScriptwritingProject).where(ScriptwritingProject.file_id == file_id)
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get shots
    shots_result = await db.execute(
        select(ScriptwritingShot)
        .where(ScriptwritingShot.project_id == project.id)
        .order_by(ScriptwritingShot.shot_number)
    )
    shots = shots_result.scalars().all()

    # Build response
    shot_list = []
    for shot in shots:
        prompts = shot.prompts_data or {}
        shot_list.append(ShotResponse(
            id=shot.id,
            shot_number=shot.shot_number,
            original_text=shot.original_text,
            type=shot.type,
            duration=shot.duration,
            video_url=shot.video_url,
            character_info=CharacterInfo(
                character_name=shot.character_name,
                gender=shot.character_gender,
                appearance_description=shot.character_desc
            ) if shot.character_name else None,
            visual_content=VisualContent(
                scene_content=shot.scene_content,
                shot_size=shot.shot_size,
                camera_movement=shot.camera_movement,
                front_image_url=shot.front_image_url,
                back_image_url=shot.back_image_url,
                side_image_url=shot.side_image_url,
                text_to_image_prompt=prompts.get('text_to_image_prompt'),
                image_to_video_prompt=prompts.get('image_to_video_prompt')
            ),
            audio_info=AudioInfo(
                dialogue_content=shot.dialogue_content,
                voice_over=shot.voice_over,
                voice_emotion=shot.voice_emotion,
                sound_effects=shot.sound_effects
            ) if shot.dialogue_content or shot.voice_over else None,
            context_summary=shot.context_summary,
            created_at=shot.created_at
        ))

    detail = ProjectDetail(
        file_info=FileInfo(
            file_id=project.file_id,
            file_name=project.file_name,
            total_word_count=project.total_word_count,
            script_generation_time=project.script_generation_time
        ),
        global_config=GlobalConfig(
            visual_style=project.visual_style,
            context_usage_count=project.context_usage_count
        ),
        script_shot_list=shot_list
    )

    return Response(code=200, message="Success", data=detail)


@router.delete("/projects/{file_id}", response_model=Response[ProjectDeleteResponse])
async def delete_project(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a script project and all its shots"""
    result = await db.execute(
        select(ScriptwritingProject).where(ScriptwritingProject.file_id == file_id)
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Count shots before deletion
    shots_result = await db.execute(
        select(ScriptwritingShot).where(ScriptwritingShot.project_id == project.id)
    )
    shot_count = len(shots_result.scalars().all())

    # Delete project (cascade will delete shots)
    await db.delete(project)
    await db.commit()

    return Response(
        code=200,
        message="Project deleted successfully",
        data=ProjectDeleteResponse(file_id=file_id, deleted_shots=shot_count)
    )


@router.get("/projects/{file_id}/shots", response_model=Response[List[ShotListItem]])
async def get_shots(
    file_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated shot list"""
    result = await db.execute(
        select(ScriptwritingProject).where(ScriptwritingProject.file_id == file_id)
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    offset = (page - 1) * page_size
    shots_result = await db.execute(
        select(ScriptwritingShot)
        .where(ScriptwritingShot.project_id == project.id)
        .order_by(ScriptwritingShot.shot_number)
        .offset(offset)
        .limit(page_size)
    )
    shots = shots_result.scalars().all()

    shot_list = [
        ShotListItem(
            id=shot.id,
            shot_number=shot.shot_number,
            original_text=shot.original_text,
            visual_content_summary=shot.scene_content,
            status="completed"
        )
        for shot in shots
    ]

    return Response(code=200, message="Success", data=shot_list)


@router.get("/shots/{shot_id}", response_model=Response[ShotResponse])
async def get_shot(
    shot_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get single shot detail"""
    result = await db.execute(
        select(ScriptwritingShot).where(ScriptwritingShot.id == shot_id)
    )
    shot = result.scalars().first()
    if not shot:
        raise HTTPException(status_code=404, detail="Shot not found")

    prompts = shot.prompts_data or {}
    shot_response = ShotResponse(
        id=shot.id,
        shot_number=shot.shot_number,
        original_text=shot.original_text,
        type=shot.type,
        duration=shot.duration,
        video_url=shot.video_url,
        character_info=CharacterInfo(
            character_name=shot.character_name,
            gender=shot.character_gender,
            appearance_description=shot.character_desc
        ) if shot.character_name else None,
        visual_content=VisualContent(
            scene_content=shot.scene_content,
            shot_size=shot.shot_size,
            camera_movement=shot.camera_movement,
            front_image_url=shot.front_image_url,
            back_image_url=shot.back_image_url,
            side_image_url=shot.side_image_url,
            text_to_image_prompt=prompts.get('text_to_image_prompt'),
            image_to_video_prompt=prompts.get('image_to_video_prompt')
        ),
        audio_info=AudioInfo(
            dialogue_content=shot.dialogue_content,
            voice_over=shot.voice_over,
            voice_emotion=shot.voice_emotion,
            sound_effects=shot.sound_effects
        ) if shot.dialogue_content or shot.voice_over else None,
        context_summary=shot.context_summary,
        created_at=shot.created_at
    )

    return Response(code=200, message="Success", data=shot_response)


@router.patch("/shots/{shot_id}", response_model=Response[ShotResponse])
async def update_shot(
    shot_id: int,
    update_data: ShotUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update single shot"""
    result = await db.execute(
        select(ScriptwritingShot).where(ScriptwritingShot.id == shot_id)
    )
    shot = result.scalars().first()
    if not shot:
        raise HTTPException(status_code=404, detail="Shot not found")

    if update_data.video_url is not None:
        shot.video_url = update_data.video_url

    if update_data.visual_content:
        vc = update_data.visual_content
        if vc.scene_content is not None:
            shot.scene_content = vc.scene_content
        if vc.shot_size is not None:
            shot.shot_size = vc.shot_size
        if vc.camera_movement is not None:
            shot.camera_movement = vc.camera_movement
        if vc.front_image_url is not None:
            shot.front_image_url = vc.front_image_url
        if vc.back_image_url is not None:
            shot.back_image_url = vc.back_image_url
        if vc.side_image_url is not None:
            shot.side_image_url = vc.side_image_url

        prompts = shot.prompts_data or {}
        if vc.text_to_image_prompt is not None:
            prompts['text_to_image_prompt'] = vc.text_to_image_prompt
        if vc.image_to_video_prompt is not None:
            prompts['image_to_video_prompt'] = vc.image_to_video_prompt
        shot.prompts_data = prompts

    if update_data.audio_info:
        ai = update_data.audio_info
        if ai.dialogue_content is not None:
            shot.dialogue_content = ai.dialogue_content
        if ai.voice_over is not None:
            shot.voice_over = ai.voice_over
        if ai.voice_emotion is not None:
            shot.voice_emotion = ai.voice_emotion
        if ai.sound_effects is not None:
            shot.sound_effects = ai.sound_effects

    await db.commit()
    await db.refresh(shot)

    prompts = shot.prompts_data or {}
    shot_response = ShotResponse(
        id=shot.id,
        shot_number=shot.shot_number,
        original_text=shot.original_text,
        type=shot.type,
        duration=shot.duration,
        video_url=shot.video_url,
        character_info=CharacterInfo(
            character_name=shot.character_name,
            gender=shot.character_gender,
            appearance_description=shot.character_desc
        ) if shot.character_name else None,
        visual_content=VisualContent(
            scene_content=shot.scene_content,
            shot_size=shot.shot_size,
            camera_movement=shot.camera_movement,
            front_image_url=shot.front_image_url,
            back_image_url=shot.back_image_url,
            side_image_url=shot.side_image_url,
            text_to_image_prompt=prompts.get('text_to_image_prompt'),
            image_to_video_prompt=prompts.get('image_to_video_prompt')
        ),
        audio_info=AudioInfo(
            dialogue_content=shot.dialogue_content,
            voice_over=shot.voice_over,
            voice_emotion=shot.voice_emotion,
            sound_effects=shot.sound_effects
        ) if shot.dialogue_content or shot.voice_over else None,
        context_summary=shot.context_summary,
        created_at=shot.created_at
    )

    return Response(code=200, message="Shot updated successfully", data=shot_response)


@router.post("/search/shots", response_model=Response[List[ShotListItem]])
async def search_shots(
    search: SearchShotsRequest,
    db: AsyncSession = Depends(get_db)
):
    """Search shots by criteria"""
    conditions = []

    if search.character_name:
        conditions.append(ScriptwritingShot.character_name.ilike(f"%{search.character_name}%"))

    if search.type:
        conditions.append(ScriptwritingShot.type == search.type)

    if search.visual_style:
        # Join with project table to search by visual_style
        query = (
            select(ScriptwritingShot)
            .join(ScriptwritingProject)
            .where(ScriptwritingProject.visual_style == search.visual_style)
        )
        if conditions:
            query = query.where(and_(*conditions))
    else:
        query = select(ScriptwritingShot)
        if conditions:
            query = query.where(and_(*conditions))

    result = await db.execute(query.order_by(ScriptwritingShot.shot_number))
    shots = result.scalars().all()

    shot_list = [
        ShotListItem(
            id=shot.id,
            shot_number=shot.shot_number,
            original_text=shot.original_text,
            visual_content_summary=shot.scene_content,
            status="completed"
        )
        for shot in shots
    ]

    return Response(code=200, message="Success", data=shot_list)
