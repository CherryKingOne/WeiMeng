from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, delete
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.shot import (
    ScriptShotFile, ScriptShot, ScriptCharacter,
    ScriptShotCharacter, ScriptShotScene, ScriptShotMedia
)
from app.schemas.shot import (
    ShotImportRequest, ShotImportResponse,
    ShotListResponse, ShotListItem,
    ShotDetailResponse, ShotUpdateRequest,
    CharacterListResponse, CharacterListItem,
    CharacterInfoResponse, VisualSceneResponse, MediaInfoResponse,
    CharacterPrompts, CharacterImages, SceneImages, TextToImagePrompt, ImageToVideoPrompt
)
from app.schemas.common import Response

router = APIRouter()


@router.post("/import", response_model=Response[ShotImportResponse])
async def import_script(
    request: ShotImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    导入剧本JSON - 核心接口，解析复杂JSON并分发到6张表
    """
    try:
        # 1. 插入文件表
        db_file = ScriptShotFile(
            library_id=request.library_id,
            file_identifier=request.file_info.file_id if request.file_info else None,
            file_name=request.file_info.file_name if request.file_info else None,
            total_words=request.file_info.total_words if request.file_info else None,
            visual_style=request.global_config.visual_style if request.global_config else None,
            generation_time=request.file_info.script_generation_time if request.file_info else None
        )
        db.add(db_file)
        await db.flush()

        imported_count = 0

        # 2. 遍历 scriptShotList
        for shot_data in (request.script_shot_list or []):
            # 2.1 插入 Shot 基础信息
            db_shot = ScriptShot(
                file_id=db_file.id,
                shot_number=shot_data.shot_number,
                original_text=shot_data.original_text,
                original_word_count=shot_data.original_word_count,
                shot_type=shot_data.shot_type,
                duration=shot_data.duration,
                context_summary=shot_data.context_summary,
                scene_description_text=shot_data.scene_description_text,
                core_concept=shot_data.core_concept
            )
            db.add(db_shot)
            await db.flush()

            # 2.2 处理角色信息 (重要：角色复用逻辑)
            if shot_data.character_info and shot_data.character_info.character_name:
                char_name = shot_data.character_info.character_name
                char_gender = shot_data.character_info.gender

                # 查询角色是否已存在
                result = await db.execute(
                    select(ScriptCharacter).where(
                        and_(
                            ScriptCharacter.library_id == request.library_id,
                            ScriptCharacter.name == char_name
                        )
                    )
                )
                character = result.scalars().first()

                # 如果不存在则创建
                if not character:
                    character = ScriptCharacter(
                        library_id=request.library_id,
                        name=char_name,
                        gender=char_gender
                    )
                    db.add(character)
                    await db.flush()

                # 插入镜头角色详情
                prompts = shot_data.character_info.text_to_image_prompts
                images = shot_data.character_info.generated_images

                db_shot_char = ScriptShotCharacter(
                    shot_id=db_shot.id,
                    character_id=character.id,
                    appearance_features=shot_data.character_info.appearance_features,
                    prompt_front_pos=prompts.front.positive if prompts and prompts.front else None,
                    prompt_front_neg=prompts.front.negative if prompts and prompts.front else None,
                    prompt_back_pos=prompts.back.positive if prompts and prompts.back else None,
                    prompt_back_neg=prompts.back.negative if prompts and prompts.back else None,
                    prompt_side_pos=prompts.side.positive if prompts and prompts.side else None,
                    prompt_side_neg=prompts.side.negative if prompts and prompts.side else None,
                    img_front_url=images.front if images else None,
                    img_back_url=images.back if images else None,
                    img_side_url=images.side if images else None
                )
                db.add(db_shot_char)

            # 2.3 插入场景信息
            if shot_data.visual_scene:
                scene = shot_data.visual_scene
                db_scene = ScriptShotScene(
                    shot_id=db_shot.id,
                    scene_content=scene.scene_content,
                    shot_size=scene.shot_size,
                    camera_movement=scene.camera_movement,
                    scene_img_front=scene.scene_images.front if scene.scene_images else None,
                    scene_img_back=scene.scene_images.back if scene.scene_images else None,
                    scene_img_side=scene.scene_images.side if scene.scene_images else None
                )
                db.add(db_scene)

            # 2.4 插入媒体信息
            video_prompts = shot_data.image_to_video_prompts
            audio = shot_data.audio_performance
            video_info = shot_data.video

            db_media = ScriptShotMedia(
                shot_id=db_shot.id,
                video_prompt_pos=video_prompts.positive if video_prompts else None,
                video_prompt_neg=video_prompts.negative if video_prompts else None,
                video_url=video_info.video_url if video_info else None,
                dialogue_content=audio.dialogue_content if audio else None,
                voice_over=audio.voice_over if audio else None,
                emotion=audio.emotion if audio else None,
                sound_effects=audio.sound_effects if audio else None
            )
            db.add(db_media)

            imported_count += 1

        # 3. 提交事务
        await db.commit()

        return Response(
            code=200,
            message="Import successful",
            data=ShotImportResponse(
                file_id=db_file.id,
                imported_shots=imported_count,
                message=f"Successfully imported {imported_count} shots"
            )
        )

    except Exception as e:
        await db.rollback()
        print(f"Import error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}"
        )


@router.get("/list", response_model=Response[ShotListResponse])
async def get_shot_list(
    library_id: int = Query(..., description="剧本库ID"),
    file_id: Optional[int] = Query(None, description="文件ID"),
    shot_number: Optional[int] = Query(None, description="镜号"),
    character_name: Optional[str] = Query(None, description="角色名"),
    shot_size: Optional[str] = Query(None, description="景别"),
    has_video: Optional[bool] = Query(None, description="是否已生成视频"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取镜头列表 - 支持分页和多种筛选条件
    """
    # 构建基础查询
    query = select(ScriptShot).join(ScriptShotFile).where(
        ScriptShotFile.library_id == library_id
    )

    # 添加筛选条件
    if file_id:
        query = query.where(ScriptShot.file_id == file_id)

    if shot_number:
        query = query.where(ScriptShot.shot_number == shot_number)

    if character_name:
        query = query.join(ScriptShotCharacter).join(ScriptCharacter).where(
            ScriptCharacter.name.ilike(f"%{character_name}%")
        )

    if shot_size:
        query = query.join(ScriptShotScene).where(
            ScriptShotScene.shot_size == shot_size
        )

    if has_video is not None:
        query = query.join(ScriptShotMedia)
        if has_video:
            query = query.where(ScriptShotMedia.video_url.isnot(None))
        else:
            query = query.where(ScriptShotMedia.video_url.is_(None))

    # 获取总数
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # 分页
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(ScriptShot.shot_number)

    # 执行查询
    result = await db.execute(query)
    shots = result.scalars().all()

    # 构建响应数据
    items = []
    for shot in shots:
        # 获取角色名
        char_result = await db.execute(
            select(ScriptCharacter.name)
            .join(ScriptShotCharacter)
            .where(ScriptShotCharacter.shot_id == shot.id)
        )
        char_name = char_result.scalar()

        # 检查是否有视频
        media_result = await db.execute(
            select(ScriptShotMedia.video_url)
            .where(ScriptShotMedia.shot_id == shot.id)
        )
        video_url = media_result.scalar()

        items.append(ShotListItem(
            id=shot.id,
            shot_number=shot.shot_number,
            original_text=shot.original_text,
            scene_description_text=shot.scene_description_text,
            duration=shot.duration,
            shot_type=shot.shot_type,
            character_name=char_name,
            has_video=bool(video_url)
        ))

    return Response(
        code=200,
        message="Success",
        data=ShotListResponse(
            total=total,
            page=page,
            page_size=page_size,
            items=items
        )
    )


@router.get("/{shot_id}", response_model=Response[ShotDetailResponse])
async def get_shot_detail(
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取单个镜头详情 - 聚合所有关联表信息返回完整结构
    """
    # 获取镜头基础信息
    result = await db.execute(
        select(ScriptShot).where(ScriptShot.id == shot_id)
    )
    shot = result.scalars().first()

    if not shot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shot not found"
        )

    # 获取角色信息
    char_info = None
    char_result = await db.execute(
        select(ScriptShotCharacter, ScriptCharacter)
        .join(ScriptCharacter)
        .where(ScriptShotCharacter.shot_id == shot_id)
    )
    char_data = char_result.first()

    if char_data:
        shot_char, character = char_data
        char_info = CharacterInfoResponse(
            character_id=character.id,
            character_name=character.name,
            gender=character.gender,
            appearance_features=shot_char.appearance_features,
            prompts=CharacterPrompts(
                front=TextToImagePrompt(
                    positive=shot_char.prompt_front_pos,
                    negative=shot_char.prompt_front_neg
                ) if shot_char.prompt_front_pos or shot_char.prompt_front_neg else None,
                back=TextToImagePrompt(
                    positive=shot_char.prompt_back_pos,
                    negative=shot_char.prompt_back_neg
                ) if shot_char.prompt_back_pos or shot_char.prompt_back_neg else None,
                side=TextToImagePrompt(
                    positive=shot_char.prompt_side_pos,
                    negative=shot_char.prompt_side_neg
                ) if shot_char.prompt_side_pos or shot_char.prompt_side_neg else None
            ),
            images=CharacterImages(
                front=shot_char.img_front_url,
                back=shot_char.img_back_url,
                side=shot_char.img_side_url
            )
        )

    # 获取场景信息
    scene_info = None
    scene_result = await db.execute(
        select(ScriptShotScene).where(ScriptShotScene.shot_id == shot_id)
    )
    scene = scene_result.scalars().first()

    if scene:
        scene_info = VisualSceneResponse(
            scene_content=scene.scene_content,
            shot_size=scene.shot_size,
            camera_movement=scene.camera_movement,
            scene_images=SceneImages(
                front=scene.scene_img_front,
                back=scene.scene_img_back,
                side=scene.scene_img_side
            )
        )

    # 获取媒体信息
    media_info = None
    media_result = await db.execute(
        select(ScriptShotMedia).where(ScriptShotMedia.shot_id == shot_id)
    )
    media = media_result.scalars().first()

    if media:
        media_info = MediaInfoResponse(
            video_prompt=ImageToVideoPrompt(
                positive=media.video_prompt_pos,
                negative=media.video_prompt_neg
            ) if media.video_prompt_pos or media.video_prompt_neg else None,
            video_url=media.video_url,
            dialogue_content=media.dialogue_content,
            voice_over=media.voice_over,
            emotion=media.emotion,
            sound_effects=media.sound_effects
        )

    # 构建响应
    detail = ShotDetailResponse(
        id=shot.id,
        shot_number=shot.shot_number,
        original_text=shot.original_text,
        original_word_count=shot.original_word_count,
        shot_type=shot.shot_type,
        duration=shot.duration,
        context_summary=shot.context_summary,
        scene_description_text=shot.scene_description_text,
        core_concept=shot.core_concept,
        memo=shot.memo,
        character_info=char_info,
        visual_scene=scene_info,
        media_info=media_info,
        created_at=shot.created_at
    )

    return Response(
        code=200,
        message="Success",
        data=detail
    )


@router.put("/{shot_id}", response_model=Response[ShotDetailResponse])
async def update_shot(
    shot_id: int,
    update_data: ShotUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新镜头信息 - 修改文本、提示词、状态等
    """
    # 获取镜头
    result = await db.execute(
        select(ScriptShot).where(ScriptShot.id == shot_id)
    )
    shot = result.scalars().first()

    if not shot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shot not found"
        )

    # 更新基础信息
    if update_data.original_text is not None:
        shot.original_text = update_data.original_text
    if update_data.shot_type is not None:
        shot.shot_type = update_data.shot_type
    if update_data.duration is not None:
        shot.duration = update_data.duration
    if update_data.context_summary is not None:
        shot.context_summary = update_data.context_summary
    if update_data.scene_description_text is not None:
        shot.scene_description_text = update_data.scene_description_text
    if update_data.core_concept is not None:
        shot.core_concept = update_data.core_concept
    if update_data.memo is not None:
        shot.memo = update_data.memo

    # 更新角色信息
    if update_data.character_info:
        char_result = await db.execute(
            select(ScriptShotCharacter).where(ScriptShotCharacter.shot_id == shot_id)
        )
        shot_char = char_result.scalars().first()

        if shot_char:
            if update_data.character_info.appearance_features is not None:
                shot_char.appearance_features = update_data.character_info.appearance_features
            if update_data.character_info.prompt_front_pos is not None:
                shot_char.prompt_front_pos = update_data.character_info.prompt_front_pos
            if update_data.character_info.prompt_front_neg is not None:
                shot_char.prompt_front_neg = update_data.character_info.prompt_front_neg
            if update_data.character_info.prompt_back_pos is not None:
                shot_char.prompt_back_pos = update_data.character_info.prompt_back_pos
            if update_data.character_info.prompt_back_neg is not None:
                shot_char.prompt_back_neg = update_data.character_info.prompt_back_neg
            if update_data.character_info.prompt_side_pos is not None:
                shot_char.prompt_side_pos = update_data.character_info.prompt_side_pos
            if update_data.character_info.prompt_side_neg is not None:
                shot_char.prompt_side_neg = update_data.character_info.prompt_side_neg
            if update_data.character_info.img_front_url is not None:
                shot_char.img_front_url = update_data.character_info.img_front_url
            if update_data.character_info.img_back_url is not None:
                shot_char.img_back_url = update_data.character_info.img_back_url
            if update_data.character_info.img_side_url is not None:
                shot_char.img_side_url = update_data.character_info.img_side_url

    # 更新场景信息
    if update_data.visual_scene:
        scene_result = await db.execute(
            select(ScriptShotScene).where(ScriptShotScene.shot_id == shot_id)
        )
        scene = scene_result.scalars().first()

        if scene:
            if update_data.visual_scene.scene_content is not None:
                scene.scene_content = update_data.visual_scene.scene_content
            if update_data.visual_scene.shot_size is not None:
                scene.shot_size = update_data.visual_scene.shot_size
            if update_data.visual_scene.camera_movement is not None:
                scene.camera_movement = update_data.visual_scene.camera_movement
            if update_data.visual_scene.scene_img_front is not None:
                scene.scene_img_front = update_data.visual_scene.scene_img_front
            if update_data.visual_scene.scene_img_back is not None:
                scene.scene_img_back = update_data.visual_scene.scene_img_back
            if update_data.visual_scene.scene_img_side is not None:
                scene.scene_img_side = update_data.visual_scene.scene_img_side

    # 更新媒体信息
    if update_data.media_info:
        media_result = await db.execute(
            select(ScriptShotMedia).where(ScriptShotMedia.shot_id == shot_id)
        )
        media = media_result.scalars().first()

        if media:
            if update_data.media_info.video_prompt_pos is not None:
                media.video_prompt_pos = update_data.media_info.video_prompt_pos
            if update_data.media_info.video_prompt_neg is not None:
                media.video_prompt_neg = update_data.media_info.video_prompt_neg
            if update_data.media_info.video_url is not None:
                media.video_url = update_data.media_info.video_url
            if update_data.media_info.dialogue_content is not None:
                media.dialogue_content = update_data.media_info.dialogue_content
            if update_data.media_info.voice_over is not None:
                media.voice_over = update_data.media_info.voice_over
            if update_data.media_info.emotion is not None:
                media.emotion = update_data.media_info.emotion
            if update_data.media_info.sound_effects is not None:
                media.sound_effects = update_data.media_info.sound_effects

    await db.commit()

    # 返回更新后的详情
    return await get_shot_detail(shot_id, db, current_user)


@router.delete("/{shot_id}", response_model=Response[dict])
async def delete_shot(
    shot_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除镜头 - 级联删除关联数据
    """
    # 检查镜头是否存在
    result = await db.execute(
        select(ScriptShot).where(ScriptShot.id == shot_id)
    )
    shot = result.scalars().first()

    if not shot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shot not found"
        )

    # 删除镜头（级联删除会自动删除关联数据）
    await db.execute(
        delete(ScriptShot).where(ScriptShot.id == shot_id)
    )
    await db.commit()

    return Response(
        code=200,
        message="Shot deleted successfully",
        data={"shot_id": shot_id}
    )


@router.get("/characters", response_model=Response[CharacterListResponse])
async def get_characters(
    library_id: int = Query(..., description="剧本库ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取剧本库角色列表 - 查看该剧本库有哪些已注册角色
    """
    # 获取角色列表及其出现次数
    query = select(
        ScriptCharacter,
        func.count(ScriptShotCharacter.id).label('shot_count')
    ).outerjoin(
        ScriptShotCharacter
    ).where(
        ScriptCharacter.library_id == library_id
    ).group_by(
        ScriptCharacter.id
    ).order_by(
        ScriptCharacter.created_at.desc()
    )

    result = await db.execute(query)
    characters_data = result.all()

    items = []
    for character, shot_count in characters_data:
        items.append(CharacterListItem(
            id=character.id,
            name=character.name,
            gender=character.gender,
            shot_count=shot_count,
            created_at=character.created_at
        ))

    return Response(
        code=200,
        message="Success",
        data=CharacterListResponse(
            library_id=library_id,
            total=len(items),
            items=items
        )
    )
