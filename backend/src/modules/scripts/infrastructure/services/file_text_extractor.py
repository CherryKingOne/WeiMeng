from __future__ import annotations

import codecs
import os
import tempfile
from collections.abc import Iterator
from contextlib import contextmanager
from io import BytesIO
from typing import BinaryIO

from src.modules.scripts.domain.exceptions import TextExtractError


class FileTextExtractor:
    def extract(self, file_bytes: bytes, file_extension: str) -> str:
        return self.extract_from_stream(BytesIO(file_bytes), file_extension)

    def extract_from_stream(self, file_stream: BinaryIO, file_extension: str) -> str:
        segments = self.iter_text_segments_from_stream(file_stream, file_extension)
        return "".join(segments).strip()

    def iter_text_segments_from_stream(self, file_stream: BinaryIO, file_extension: str) -> Iterator[str]:
        extension = file_extension.lower().lstrip(".")

        if extension in {"txt", "md"}:
            yield from self._iter_decode_plain_text_stream(file_stream)
            return
        if extension == "pdf":
            yield from self._iter_extract_pdf_from_stream(file_stream)
            return
        if extension == "docx":
            yield from self._iter_extract_docx_from_stream(file_stream)
            return

        raise TextExtractError(detail=f"Unsupported file extension for extraction: {extension}")

    @staticmethod
    def _decode_plain_text(file_bytes: bytes) -> str:
        candidates = ("utf-8", "utf-8-sig", "gb18030")
        for encoding in candidates:
            try:
                return file_bytes.decode(encoding).strip()
            except UnicodeDecodeError:
                continue

        return file_bytes.decode("utf-8", errors="ignore").strip()

    @staticmethod
    def _iter_decode_plain_text_stream(file_stream: BinaryIO) -> Iterator[str]:
        sample = file_stream.read(4096)
        if isinstance(sample, str):
            if sample:
                yield sample
            while True:
                remaining = file_stream.read(8192)
                if not remaining:
                    break
                if isinstance(remaining, str):
                    yield remaining
                elif isinstance(remaining, bytearray):
                    yield remaining.decode("utf-8", errors="ignore")
                else:
                    yield remaining.decode("utf-8", errors="ignore")
            return

        if not isinstance(sample, (bytes, bytearray)):
            sample = b""
        sample_bytes = bytes(sample)

        candidates = ("utf-8", "utf-8-sig", "gb18030")
        selected_encoding = "utf-8"
        for encoding in candidates:
            try:
                sample_bytes.decode(encoding)
                selected_encoding = encoding
                break
            except UnicodeDecodeError:
                continue

        decoder = codecs.getincrementaldecoder(selected_encoding)(errors="ignore")
        first_chunk = decoder.decode(sample_bytes, final=False)
        if first_chunk:
            yield first_chunk

        while True:
            chunk = file_stream.read(8192)
            if not chunk:
                break
            if isinstance(chunk, str):
                if chunk:
                    yield chunk
                continue
            if isinstance(chunk, bytearray):
                chunk = bytes(chunk)
            decoded = decoder.decode(chunk, final=False)
            if decoded:
                yield decoded

        tail = decoder.decode(b"", final=True)
        if tail:
            yield tail

    @staticmethod
    def _iter_extract_pdf_from_stream(file_stream: BinaryIO) -> Iterator[str]:
        try:
            import pdfplumber
        except ModuleNotFoundError as exc:
            raise TextExtractError(
                detail="Missing dependency 'pdfplumber' for PDF extraction",
            ) from exc

        try:
            with FileTextExtractor._stream_to_temp_path(file_stream, suffix=".pdf") as temp_path:
                with pdfplumber.open(temp_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text() or ""
                        if page_text.strip():
                            yield page_text.strip()
                            yield "\n"
        except Exception as exc:  # pragma: no cover - library-specific exceptions are unstable
            raise TextExtractError(detail=f"Failed to parse PDF file: {exc}") from exc

    @staticmethod
    def _iter_extract_docx_from_stream(file_stream: BinaryIO) -> Iterator[str]:
        try:
            from docx import Document
        except ModuleNotFoundError as exc:
            raise TextExtractError(
                detail="Missing dependency 'python-docx' for DOCX extraction",
            ) from exc

        try:
            with FileTextExtractor._stream_to_temp_path(file_stream, suffix=".docx") as temp_path:
                document = Document(temp_path)
                for paragraph in document.paragraphs:
                    paragraph_text = paragraph.text.strip()
                    if paragraph_text:
                        yield paragraph_text
                        yield "\n"
        except Exception as exc:  # pragma: no cover - library-specific exceptions are unstable
            raise TextExtractError(detail=f"Failed to parse DOCX file: {exc}") from exc

    @staticmethod
    @contextmanager
    def _stream_to_temp_path(file_stream: BinaryIO, suffix: str) -> Iterator[str]:
        fd, temp_path = tempfile.mkstemp(suffix=suffix)
        os.close(fd)
        try:
            with open(temp_path, "wb") as temp_file:
                while True:
                    chunk = file_stream.read(1024 * 1024)
                    if not chunk:
                        break
                    if isinstance(chunk, str):
                        chunk = chunk.encode("utf-8", errors="ignore")
                    elif isinstance(chunk, bytearray):
                        chunk = bytes(chunk)
                    temp_file.write(chunk)
            yield temp_path
        finally:
            try:
                os.remove(temp_path)
            except FileNotFoundError:
                pass
