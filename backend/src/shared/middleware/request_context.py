from contextvars import ContextVar
from typing import Optional
import uuid

request_context: ContextVar[dict] = ContextVar("request_context", default={})

class RequestContext:
    @staticmethod
    def set_request_id(request_id: Optional[str] = None) -> str:
        ctx = request_context.get()
        request_id = request_id or str(uuid.uuid4())
        ctx["request_id"] = request_id
        request_context.set(ctx)
        return request_id
    
    @staticmethod
    def get_request_id() -> Optional[str]:
        ctx = request_context.get()
        return ctx.get("request_id")
    
    @staticmethod
    def set_user_id(user_id: str):
        ctx = request_context.get()
        ctx["user_id"] = user_id
        request_context.set(ctx)
    
    @staticmethod
    def get_user_id() -> Optional[str]:
        ctx = request_context.get()
        return ctx.get("user_id")
    
    @staticmethod
    def clear():
        request_context.set({})
