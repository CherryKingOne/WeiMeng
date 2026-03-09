from __future__ import annotations

from io import BytesIO

from src.modules.scripts.domain.exceptions import TextExtractError


class FileTextExtractor:
    def extract(self, file_bytes: bytes, file_extension: str) -> str:
        extension = file_extension.lower().lstrip(".")

        if extension in {"txt", "md"}:
            return self._decode_plain_text(file_bytes)
        if extension == "pdf":
            return self._extract_pdf(file_bytes)
        if extension in {"doc", "docx"}:
            return self._extract_docx(file_bytes)

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
    def _extract_pdf(file_bytes: bytes) -> str:
        try:
            import pdfplumber
        except ModuleNotFoundError as exc:
            raise TextExtractError(
                detail="Missing dependency 'pdfplumber' for PDF extraction",
            ) from exc

        pages_text: list[str] = []
        try:
            with pdfplumber.open(BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    if page_text.strip():
                        pages_text.append(page_text)
        except Exception as exc:  # pragma: no cover - library-specific exceptions are unstable
            raise TextExtractError(detail=f"Failed to parse PDF file: {exc}") from exc

        return "\n".join(pages_text).strip()

    @staticmethod
    def _extract_docx(file_bytes: bytes) -> str:
        try:
            from docx import Document
        except ModuleNotFoundError as exc:
            raise TextExtractError(
                detail="Missing dependency 'python-docx' for DOCX extraction",
            ) from exc

        try:
            document = Document(BytesIO(file_bytes))
            paragraphs = [paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()]
            return "\n".join(paragraphs).strip()
        except Exception as exc:  # pragma: no cover - library-specific exceptions are unstable
            raise TextExtractError(detail=f"Failed to parse DOCX file: {exc}") from exc
