from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import List, Dict, Generator, Any


class ModelChatService:
    """LangChain 模型调用封装服务"""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        model_name: str,
        temperature: float = 0.7,
        thinking_mode: bool = False
    ):
        """
        初始化 LangChain ChatOpenAI 实例

        Args:
            base_url: API基础URL
            api_key: API密钥
            model_name: 模型名称
            temperature: 温度参数 (0-2)
            thinking_mode: 是否开启思考模式
        """
        self.model_name = model_name
        self.thinking_mode = thinking_mode

        # 思考模式下，降低温度以保证逻辑严密性
        final_temp = max(0.1, temperature - 0.2) if thinking_mode else temperature

        self.llm = ChatOpenAI(
            base_url=base_url,
            api_key=api_key,
            model=model_name,
            temperature=final_temp,
            streaming=True  # 默认支持流式
        )

    def _prepare_messages(self, history: List[Dict[str, str]], current_query: str) -> List[Any]:
        """
        构建 LangChain 消息对象列表

        Args:
            history: 历史消息列表
            current_query: 当前用户提问

        Returns:
            LangChain 消息对象列表
        """
        messages = []

        # 1. 如果开启思考模式，注入系统提示词
        if self.thinking_mode:
            messages.append(SystemMessage(
                content="你现在处于深度思考模式。请一步步进行逻辑推理，并在回答前仔细验证你的结论。"
            ))

        # 2. 转换历史记录
        for msg in history:
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                messages.append(AIMessage(content=msg['content']))
            elif msg['role'] == 'system':
                messages.append(SystemMessage(content=msg['content']))

        # 3. 添加当前用户提问
        messages.append(HumanMessage(content=current_query))
        return messages

    async def chat_stream(self, history: List[Dict], query: str) -> Generator:
        """
        流式对话生成器

        Args:
            history: 历史消息列表
            query: 当前用户提问

        Yields:
            生成的文本片段
        """
        messages = self._prepare_messages(history, query)
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield chunk.content

    async def chat_invoke(self, history: List[Dict], query: str) -> str:
        """
        非流式直接对话

        Args:
            history: 历史消息列表
            query: 当前用户提问

        Returns:
            完整的回复内容
        """
        messages = self._prepare_messages(history, query)
        response = await self.llm.ainvoke(messages)
        return response.content
