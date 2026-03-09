from __future__ import annotations

from typing import Any

from langchain_core.documents import Document

try:
    from langchain_text_splitters import TextSplitter
except ModuleNotFoundError:  # pragma: no cover - fallback keeps app importable before dependency sync
    class TextSplitter:  # type: ignore[no-redef]
        def __init__(self, chunk_size: int = 4000, chunk_overlap: int = 200, **_: Any) -> None:
            if chunk_overlap >= chunk_size:
                raise ValueError("chunk_overlap must be smaller than chunk_size")
            self._chunk_size = chunk_size
            self._chunk_overlap = chunk_overlap


class ScriptSentenceWindowTextSplitter(TextSplitter):
    SENTENCE_ENDINGS = ("。", ".", "！", "？", "!", "?", "；", ";")

    def __init__(
        self,
        chunk_size: int = 1200,
        chunk_overlap: int = 200,
        **kwargs: Any,
    ) -> None:
        super().__init__(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            **kwargs,
        )
        self._sentence_endings = self.SENTENCE_ENDINGS

    def split_text(self, text: str) -> list[str]:
        boundaries = self._split_with_indices(text or "")
        return [chunk for chunk, _, _ in boundaries]

    def create_documents_with_metadata(
        self,
        text: str,
        metadata: dict[str, Any] | None = None,
    ) -> list[Document]:
        documents: list[Document] = []
        for index, (chunk, start_index, end_index) in enumerate(self._split_with_indices(text or "")):
            item_metadata = {
                **(metadata or {}),
                "chunk_index": index,
                "start_index": start_index,
                "end_index": end_index,
                "chunk_size": len(chunk),
            }
            documents.append(
                Document(
                    page_content=chunk,
                    metadata=item_metadata,
                )
            )
        return documents

    def _split_with_indices(self, text: str) -> list[tuple[str, int, int]]:
        if not text.strip():
            return []

        chunks: list[tuple[str, int, int]] = []
        text_length = len(text)
        start = 0

        while start < text_length:
            if text_length - start <= self._chunk_size:
                split_end = text_length
            else:
                raw_end = start + self._chunk_size
                split_end = self._find_split_end(text, start, raw_end)
                if split_end <= start:
                    split_end = raw_end

            raw_chunk = text[start:split_end]
            trimmed_chunk = raw_chunk.strip()
            if trimmed_chunk:
                leading_ws = len(raw_chunk) - len(raw_chunk.lstrip())
                trailing_ws = len(raw_chunk) - len(raw_chunk.rstrip())
                content_start = start + leading_ws
                content_end = split_end - trailing_ws
                chunks.append((trimmed_chunk, content_start, content_end))

            if split_end >= text_length:
                break

            next_start = max(split_end - self._chunk_overlap, start + 1)
            if next_start >= split_end:
                next_start = split_end

            start = next_start

        return chunks

    def _find_split_end(self, text: str, start: int, raw_end: int) -> int:
        safe_end = min(raw_end, len(text))
        if safe_end > start and text[safe_end - 1] in self._sentence_endings:
            return safe_end

        window = text[start:safe_end]
        nearest = max(window.rfind(symbol) for symbol in self._sentence_endings)
        if nearest != -1:
            return start + nearest + 1

        return safe_end
