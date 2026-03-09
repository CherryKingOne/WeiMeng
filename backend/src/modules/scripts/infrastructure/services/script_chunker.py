from __future__ import annotations

from collections.abc import Iterable
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
        boundaries = self._split_with_indices(text or "")
        return self._to_documents(boundaries, metadata)

    def create_documents_from_text_segments(
        self,
        text_segments: Iterable[str],
        metadata: dict[str, Any] | None = None,
    ) -> list[Document]:
        boundaries = self._split_streaming_with_indices(text_segments)
        return self._to_documents(boundaries, metadata)

    def _to_documents(
        self,
        boundaries: list[tuple[str, int, int]],
        metadata: dict[str, Any] | None = None,
    ) -> list[Document]:
        documents: list[Document] = []
        for index, (chunk, start_index, end_index) in enumerate(boundaries):
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

    def _split_streaming_with_indices(self, text_segments: Iterable[str]) -> list[tuple[str, int, int]]:
        chunks: list[tuple[str, int, int]] = []
        buffer = ""
        buffer_start_index = 0

        for segment in text_segments:
            if not segment:
                continue
            buffer += segment
            buffer, buffer_start_index = self._drain_buffer(
                buffer=buffer,
                buffer_start_index=buffer_start_index,
                output=chunks,
                force_tail=False,
            )

        self._drain_buffer(
            buffer=buffer,
            buffer_start_index=buffer_start_index,
            output=chunks,
            force_tail=True,
        )
        return chunks

    def _drain_buffer(
        self,
        buffer: str,
        buffer_start_index: int,
        output: list[tuple[str, int, int]],
        force_tail: bool,
    ) -> tuple[str, int]:
        while buffer:
            if len(buffer) <= self._chunk_size:
                if not force_tail:
                    break
                split_end = len(buffer)
            else:
                raw_end = self._chunk_size
                split_end = self._find_split_end(buffer, 0, raw_end)
                if split_end <= 0:
                    split_end = raw_end

            raw_chunk = buffer[:split_end]
            trimmed_chunk = raw_chunk.strip()
            if trimmed_chunk:
                leading_ws = len(raw_chunk) - len(raw_chunk.lstrip())
                trailing_ws = len(raw_chunk) - len(raw_chunk.rstrip())
                content_start = buffer_start_index + leading_ws
                content_end = buffer_start_index + split_end - trailing_ws
                output.append((trimmed_chunk, content_start, content_end))

            if split_end >= len(buffer):
                buffer_start_index += split_end
                buffer = ""
                break

            next_start = max(split_end - self._chunk_overlap, 1)
            if next_start >= split_end:
                next_start = split_end
            buffer = buffer[next_start:]
            buffer_start_index += next_start

        return buffer, buffer_start_index

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
