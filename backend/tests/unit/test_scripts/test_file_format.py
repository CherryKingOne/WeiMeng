import pytest

from src.modules.scripts.domain.exceptions import UnsupportedFileTypeError
from src.modules.scripts.domain.value_objects.file_format import FileFormat


@pytest.mark.parametrize("filename", ["a.txt", "a.md", "a.docx", "a.pdf"])
def test_file_format_accepts_supported_extensions(filename: str):
    file_format = FileFormat.from_filename(filename)
    assert file_format.extension in FileFormat.SUPPORTED_EXTENSIONS


def test_file_format_rejects_unsupported_extension():
    with pytest.raises(UnsupportedFileTypeError):
        FileFormat.from_filename("a.exe")


def test_file_format_rejects_doc_extension():
    with pytest.raises(UnsupportedFileTypeError):
        FileFormat.from_filename("a.doc")


def test_file_format_rejects_filename_without_extension():
    with pytest.raises(UnsupportedFileTypeError):
        FileFormat.from_filename("README")
