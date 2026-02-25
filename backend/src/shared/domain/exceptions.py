from typing import Optional

class DomainException(Exception):
    def __init__(
        self,
        message: str,
        code: int = 400,
        detail: Optional[str] = None
    ):
        self.message = message
        self.code = code
        self.detail = detail
        super().__init__(self.message)

class EntityNotFoundException(DomainException):
    def __init__(self, entity_name: str, identifier: str):
        super().__init__(
            message=f"{entity_name} not found",
            code=404,
            detail=f"{entity_name} with identifier '{identifier}' does not exist"
        )

class ValidationException(DomainException):
    def __init__(self, message: str, detail: Optional[str] = None):
        super().__init__(message=message, code=422, detail=detail)

class AuthenticationException(DomainException):
    def __init__(self, message: str = "Authentication failed", detail: Optional[str] = None):
        super().__init__(message=message, code=401, detail=detail)

class DuplicateEntityException(DomainException):
    def __init__(self, entity_name: str, field: str, value: str):
        super().__init__(
            message=f"{entity_name} already exists",
            code=400,
            detail=f"{entity_name} with {field}='{value}' already exists"
        )
