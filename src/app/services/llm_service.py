import httpx
from app.core.config import settings
from app.utils.prompt_loader import load_prompt


class LLMService:
    async def chat_completion(self, message: str, system_prompt_file: str = None):
        """
        Call LLM API for chat completion
        
        Args:
            message: User message
            system_prompt_file: Optional prompt file name (without path)
        
        Returns:
            LLM response text
        """
        system_content = "You are a helpful assistant."
        if system_prompt_file:
            # Load prompt from prompts/*.md
            system_content = load_prompt(system_prompt_file)
            
        payload = {
            "model": settings.LLM_MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_content},
                {"role": "user", "content": message}
            ],
            "max_tokens": settings.CONTEXT_TOKEN_LIMIT
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    f"{settings.LLM_API_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {settings.LLM_API_KEY}"},
                    json=payload,
                    timeout=60.0
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"LLM Error: {e}")
                raise e


# Global instance
llm_engine = LLMService()
