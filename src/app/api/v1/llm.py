from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.llm_service import llm_engine

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    use_storyboard_prompt: bool = False
    custom_prompt_file: str = None


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_llm(req: ChatRequest):
    """
    Chat with LLM
    
    - **message**: User message
    - **use_storyboard_prompt**: Use storyboard script generation prompt
    - **custom_prompt_file**: Custom prompt file name (e.g., '分镜头脚本生成提示词.md')
    """
    prompt_file = None
    
    if req.custom_prompt_file:
        prompt_file = req.custom_prompt_file
    elif req.use_storyboard_prompt:
        prompt_file = "分镜头脚本生成提示词.md"
    
    response = await llm_engine.chat_completion(req.message, prompt_file)
    return {"reply": response}
