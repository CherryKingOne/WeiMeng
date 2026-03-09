from dataclasses import dataclass

from src.modules.scripts.domain.exceptions import UnsupportedFileTypeError


@dataclass(frozen=True)
class FileFormat:
    extension: str

    SUPPORTED_EXTENSIONS = {"txt", "md", "docx", "pdf"}
    TEXT_EXTENSIONS = {"txt", "md"}

    @classmethod
    def from_filename(cls, filename: str) -> "FileFormat":
        if not filename or "." not in filename:
            raise UnsupportedFileTypeError(filename or "unknown")

        extension = filename.rsplit(".", 1)[-1].lower()
        if extension not in cls.SUPPORTED_EXTENSIONS:
            raise UnsupportedFileTypeError(extension)

        return cls(extension=extension)

    @property
    def is_text(self) -> bool:
        return self.extension in self.TEXT_EXTENSIONS
