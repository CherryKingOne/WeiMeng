from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.script import ScriptLibrary, ScriptFile
from app.schemas.script import LibraryCreate, LibraryResponse, FileResponse, LibraryWithFiles
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
    """List all libraries for current user"""
    result = await db.execute(
        select(ScriptLibrary).where(ScriptLibrary.user_id == current_user.id)
    )
    libraries = result.scalars().all()
    return libraries


@router.get("/libraries/{lib_id}", response_model=LibraryWithFiles)
async def get_library(
    lib_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get library details with files"""
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
    
    return library


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

    # 2. Upload to MinIO
    file_content = await file.read()
    object_key = f"{lib.minio_folder_path}{file.filename}"
    file_url = minio_client.upload_file(file_content, object_key, file.content_type or "application/octet-stream")

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
        minio_object_key=object_key
    )
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    
    return new_file


@router.get("/libraries/{lib_id}/files", response_model=List[FileResponse])
async def list_files(
    lib_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all files in a library"""
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
    
    # Get files
    result = await db.execute(
        select(ScriptFile).where(ScriptFile.library_id == lib_id)
    )
    files = result.scalars().all()
    
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
