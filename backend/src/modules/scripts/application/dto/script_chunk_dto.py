from pydantic import BaseModel


class ScriptChunkResponse(BaseModel):
    chunk_index: int
    content: str
    start_index: int
    end_index: int
    chunk_size: int
