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
