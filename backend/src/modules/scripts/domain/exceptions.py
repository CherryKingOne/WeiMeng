from src.shared.domain.exceptions import DomainException


class ScriptNotFoundException(DomainException):
    def __init__(self, identifier: str):
        super().__init__(
            message="Script not found",
            code=404,
            detail=f"Script with identifier '{identifier}' does not exist",
        )


class UnsupportedFileTypeError(DomainException):
    def __init__(self, extension: str):
        super().__init__(
            message="Unsupported file type",
            code=422,
            detail=f"File extension '{extension}' is not supported",
        )


class ScriptLibraryNotFoundException(DomainException):
    def __init__(self, identifier: str):
        super().__init__(
            message="Script library not found",
            code=404,
            detail=f"Script library with identifier '{identifier}' does not exist",
        )


class ScriptLibraryAvatarNotFoundException(DomainException):
    def __init__(self, identifier: str):
        super().__init__(
            message="Script library avatar not found",
            code=404,
            detail=f"Script library avatar for '{identifier}' does not exist",
        )


class TextExtractError(DomainException):
    def __init__(self, detail: str | None = None):
        super().__init__(
            message="Failed to extract script text",
            code=422,
            detail=detail or "Script text extraction failed",
        )


class ChunkingError(DomainException):
    def __init__(self, detail: str | None = None):
        super().__init__(
            message="Failed to split script text",
            code=500,
            detail=detail or "Script chunking failed",
        )


class StorageCleanupError(DomainException):
    def __init__(self, detail: str | None = None):
        super().__init__(
            message="Storage cleanup failed",
            code=500,
            detail=detail or "Database records are deleted but storage cleanup failed",
        )
