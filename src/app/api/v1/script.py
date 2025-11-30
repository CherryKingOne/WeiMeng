from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.script import ScriptLibrary, ScriptFile
from app.schemas.script import LibraryCreate, LibraryUpdate, LibraryResponse, FileResponse, LibraryWithFiles
from app.services.minio_service import minio_client
from app.utils.id_generator import generate_numeric_uuid16, generate_numeric_uuid18

router = APIRouter()


# --- Script Library Management ---

@router.post("/libraries", response_model=LibraryResponse)
async def create_library(
    library: LibraryCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Create a new script library"""
    # Define Minio folder path: user_id/library_name/
    folder_path = f"{current_user.id}/{library.name}/"
    
    # Generate unique 16-digit numeric ID for the library
    new_id = int(generate_numeric_uuid16())
    # Ensure uniqueness (extremely low collision chance, but check once)
    existing = await db.execute(select(ScriptLibrary).where(ScriptLibrary.id == new_id))
    if existing.scalars().first() is not None:
        new_id = int(generate_numeric_uuid16())

    new_lib = ScriptLibrary(
        id=new_id,
        user_id=current_user.id,
        name=library.name,
        type=library.type,
        description=library.description,
        minio_folder_path=folder_path
    )
    db.add(new_lib)
    await db.commit()
    await db.refresh(new_lib)
    return new_lib


@router.get("/libraries", response_model=List[LibraryResponse])
async def list_libraries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all libraries for current user with file count"""
    from sqlalchemy import func

    # Query libraries with file count
    result = await db.execute(
        select(
            ScriptLibrary,
            func.count(ScriptFile.id).label('file_count')
        )
        .outerjoin(ScriptFile, ScriptLibrary.id == ScriptFile.library_id)
        .where(ScriptLibrary.user_id == current_user.id)
        .group_by(ScriptLibrary.id)
    )

    # Build response with file count
    libraries_with_count = []
    for library, file_count in result:
        library_dict = {
            "id": library.id,
            "user_id": library.user_id,
            "name": library.name,
            "type": library.type,
            "description": library.description,
            "minio_folder_path": library.minio_folder_path,
            "created_at": library.created_at,
            "file_count": file_count
        }
        libraries_with_count.append(library_dict)

    return libraries_with_count


@router.get("/libraries/{lib_id}", response_model=LibraryWithFiles)
async def get_library(
    lib_id: int,
    fetch_size: bool = True,  # 是否从 MinIO 获取缺失的文件大小
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get library details with files

    Args:
        lib_id: Library ID
        fetch_size: If True, fetch missing file sizes from MinIO (slower but more accurate)
    """
    result = await db.execute(
        select(ScriptLibrary)
        .options(selectinload(ScriptLibrary.files))
        .where(
            ScriptLibrary.id == lib_id,
            ScriptLibrary.user_id == current_user.id
        )
    )
    library = result.scalars().first()

    if not library:
        raise HTTPException(status_code=404, detail="Library not found")

    # 如果需要，从 MinIO 获取缺失的文件大小
    if fetch_size and library.files:
        updated = False
        for file_obj in library.files:
            if file_obj.file_size is None:
                # 从 MinIO 获取文件大小
                size = minio_client.get_file_size(file_obj.minio_object_key)
                if size > 0:
                    file_obj.file_size = size
                    updated = True

        # 批量更新数据库
        if updated:
            await db.commit()
            # 刷新对象以获取最新数据
            for file_obj in library.files:
                await db.refresh(file_obj)

    return library


@router.put("/libraries/{lib_id}", response_model=LibraryResponse)
async def update_library(
    lib_id: int,
    library_update: LibraryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update library information (name and/or description)

    Args:
        lib_id: Library ID
        library_update: Fields to update (name and/or description)

    Returns:
        Updated library information
    """
    # Check if library exists and belongs to user
    result = await db.execute(
        select(ScriptLibrary).where(
            ScriptLibrary.id == lib_id,
            ScriptLibrary.user_id == current_user.id
        )
    )
    lib = result.scalars().first()

    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")

    # Update fields if provided
    if library_update.name is not None:
        lib.name = library_update.name

    if library_update.description is not None:
        lib.description = library_update.description

    await db.commit()
    await db.refresh(lib)

    return lib


@router.delete("/libraries/{lib_id}")
async def delete_library(
    lib_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a library and all its files"""
    result = await db.execute(
        select(ScriptLibrary).where(
            ScriptLibrary.id == lib_id,
            ScriptLibrary.user_id == current_user.id
        )
    )
    lib = result.scalars().first()

    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")

    # 1. Delete Minio folder and all files
    minio_client.delete_folder(lib.minio_folder_path)

    # 2. Delete database record (cascade will delete ScriptFile records)
    await db.delete(lib)
    await db.commit()

    return {"msg": "Library and associated files deleted"}


# --- File Management ---

@router.post("/libraries/{lib_id}/files", response_model=FileResponse)
async def upload_file_to_library(
    lib_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a file to a library"""
    # 1. Check if library exists and belongs to user
    result = await db.execute(
        select(ScriptLibrary).where(
            ScriptLibrary.id == lib_id,
            ScriptLibrary.user_id == current_user.id
        )
    )
    lib = result.scalars().first()
    
    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")

    # 2. Upload to MinIO - Determine file type and subfolder
    file_content = await file.read()
    file_size = len(file_content)  # 获取文件大小（字节）
    filename_lower = file.filename.lower()
    content_type = file.content_type or "application/octet-stream"

    import os
    _, ext = os.path.splitext(filename_lower)

    # Define file type categories and extensions
    image_exts = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".ico"}
    video_exts = {".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm", ".m4v", ".mpeg", ".mpg"}
    audio_exts = {".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a", ".wma", ".opus"}

    # Determine file type and subfolder
    if content_type.startswith("image/") or ext in image_exts:
        file_type = "image"
        subfolder = "images"
    elif content_type.startswith("video/") or ext in video_exts:
        file_type = "video"
        subfolder = "video"
    elif content_type.startswith("audio/") or ext in audio_exts:
        file_type = "audio"
        subfolder = "audio"
    else:
        file_type = "text"
        subfolder = "text"

    # Construct object key and upload
    object_key = f"{lib.minio_folder_path}{subfolder}/{file.filename}"
    file_url = minio_client.upload_file(file_content, object_key, content_type)


    # 3. Save to database
    new_file_id = int(generate_numeric_uuid18())
    existing_file = await db.execute(select(ScriptFile).where(ScriptFile.id == new_file_id))
    if existing_file.scalars().first() is not None:
        new_file_id = int(generate_numeric_uuid18())
    new_file = ScriptFile(
        id=new_file_id,
        library_id=lib.id,
        filename=file.filename,
        file_url=file_url,
        minio_object_key=object_key,
        file_type=file_type,
        file_size=file_size  # 保存文件大小
    )
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)

    return new_file



@router.get("/libraries/{lib_id}/files", response_model=List[FileResponse])
async def list_files(
    lib_id: int,
    file_type: str = None,  # Optional filter: "video", "audio", "image", "text"
    fetch_size: bool = True,  # 是否从 MinIO 获取缺失的文件大小
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all files in a library with file size information

    Args:
        lib_id: Library ID
        file_type: Optional filter by file type ("video", "audio", "image", "text")
        fetch_size: If True, fetch missing file sizes from MinIO (slower but more accurate)

    Returns:
        List of files with size information, optionally filtered by type
    """
    # Check library exists and belongs to user
    result = await db.execute(
        select(ScriptLibrary).where(
            ScriptLibrary.id == lib_id,
            ScriptLibrary.user_id == current_user.id
        )
    )
    lib = result.scalars().first()

    if not lib:
        raise HTTPException(status_code=404, detail="Library not found")

    # Build query for files
    query = select(ScriptFile).where(ScriptFile.library_id == lib_id)

    # Apply file type filter if specified
    if file_type:
        # Validate file_type parameter
        valid_types = ["video", "audio", "image", "text"]
        if file_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file_type. Must be one of: {', '.join(valid_types)}"
            )
        query = query.where(ScriptFile.file_type == file_type)

    # Execute query
    result = await db.execute(query)
    files = result.scalars().all()

    # 如果需要，从 MinIO 获取缺失的文件大小
    if fetch_size:
        updated = False
        for file_obj in files:
            if file_obj.file_size is None:
                # 从 MinIO 获取文件大小
                size = minio_client.get_file_size(file_obj.minio_object_key)
                if size > 0:
                    file_obj.file_size = size
                    updated = True

        # 批量更新数据库
        if updated:
            await db.commit()
            # 刷新对象以获取最新数据
            for file_obj in files:
                await db.refresh(file_obj)

    return files



@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a file"""
    # Get file and check ownership through library
    result = await db.execute(
        select(ScriptFile).where(ScriptFile.id == file_id)
    )
    file_obj = result.scalars().first()

    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")

    # Check library ownership
    result = await db.execute(
        select(ScriptLibrary).where(
            ScriptLibrary.id == file_obj.library_id,
            ScriptLibrary.user_id == current_user.id
        )
    )
    lib = result.scalars().first()

    if not lib:
        raise HTTPException(status_code=403, detail="Access denied")

    # Delete from MinIO
    minio_client.delete_file(file_obj.minio_object_key)

    # Delete from database
    await db.delete(file_obj)
    await db.commit()

    return {"msg": "File deleted"}


@router.get("/files/{file_id}/content")
async def get_file_content(
    file_id: int,
    max_length: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get file content from MinIO with optional truncation"""
    # Get file and check ownership through library
    result = await db.execute(
        select(ScriptFile).where(ScriptFile.id == file_id)
    )
    file_obj = result.scalars().first()

    if not file_obj:
        raise HTTPException(status_code=404, detail="File not found")

    # Check library ownership
    result = await db.execute(
        select(ScriptLibrary).where(
            ScriptLibrary.id == file_obj.library_id,
            ScriptLibrary.user_id == current_user.id
        )
    )
    lib = result.scalars().first()

    if not lib:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get file content from MinIO
    try:
        content = minio_client.get_file_content(file_obj.minio_object_key)

        # Determine content type based on file type and extension
        import os
        _, ext = os.path.splitext(file_obj.filename.lower())
        
        if file_obj.file_type == "image":
            # Image content types
            content_type_map = {
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".gif": "image/gif",
                ".bmp": "image/bmp",
                ".webp": "image/webp",
                ".svg": "image/svg+xml",
                ".ico": "image/x-icon"
            }
            content_type = content_type_map.get(ext, "image/jpeg")
        elif file_obj.file_type == "video":
            # Video content types
            content_type_map = {
                ".mp4": "video/mp4",
                ".avi": "video/x-msvideo",
                ".mov": "video/quicktime",
                ".mkv": "video/x-matroska",
                ".flv": "video/x-flv",
                ".wmv": "video/x-ms-wmv",
                ".webm": "video/webm",
                ".m4v": "video/x-m4v",
                ".mpeg": "video/mpeg",
                ".mpg": "video/mpeg"
            }
            content_type = content_type_map.get(ext, "video/mp4")
        elif file_obj.file_type == "audio":
            # Audio content types
            content_type_map = {
                ".mp3": "audio/mpeg",
                ".wav": "audio/wav",
                ".aac": "audio/aac",
                ".flac": "audio/flac",
                ".ogg": "audio/ogg",
                ".m4a": "audio/mp4",
                ".wma": "audio/x-ms-wma",
                ".opus": "audio/opus"
            }
            content_type = content_type_map.get(ext, "audio/mpeg")
        else:
            # Text files
            content_type = "text/plain; charset=utf-8"

            # Apply truncation for text files if max_length is specified
            if max_length and max_length > 3:
                text_content = content.decode('utf-8') if isinstance(content, bytes) else content
                if len(text_content) > max_length:
                    actual_length = max_length - 3
                    content = (text_content[:actual_length] + "...").encode('utf-8')

        return Response(content=content, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve file content: {str(e)}")



