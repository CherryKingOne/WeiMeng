from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from src.shared.domain.exceptions import DomainException
from src.shared.common.response import ErrorResponse

async def domain_exception_handler(request: Request, exc: DomainException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.code,
        content=ErrorResponse(
            code=exc.code,
            message=exc.message,
            detail=exc.detail
        ).model_dump()
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            code=422,
            message="Validation Error",
            detail=str(exc.errors())
        ).model_dump()
    )

async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    from config.settings import settings
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            code=500,
            message="Internal Server Error",
            detail=str(exc) if settings.app_env == "development" else None
        ).model_dump()
    )

def register_exception_handlers(app):
    from config.settings import settings
    
    app.add_exception_handler(DomainException, domain_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    if settings.app_env == "development":
        app.add_exception_handler(Exception, generic_exception_handler)
