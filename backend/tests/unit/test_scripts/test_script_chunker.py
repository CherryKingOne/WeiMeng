from io import BytesIO

from src.modules.scripts.infrastructure.services.file_text_extractor import FileTextExtractor
from src.modules.scripts.infrastructure.services.script_chunker import ScriptSentenceWindowTextSplitter


def test_file_text_extractor_extracts_txt_content():
    extractor = FileTextExtractor()
    text = extractor.extract("你好，剧本库".encode("utf-8"), "txt")
    assert text == "你好，剧本库"


def test_file_text_extractor_iter_text_segments_from_stream():
    extractor = FileTextExtractor()
    stream = BytesIO("第一段\n第二段".encode("utf-8"))

    segments = list(extractor.iter_text_segments_from_stream(stream, "txt"))

    assert "".join(segments) == "第一段\n第二段"


def test_script_chunker_prefers_nearest_sentence_ending_before_limit():
    splitter = ScriptSentenceWindowTextSplitter(chunk_size=1200, chunk_overlap=200)
    text = ("A" * 1100) + "。" + ("B" * 500) + "。"

    chunks = splitter.create_documents_with_metadata(text)

    assert len(chunks) >= 2
    first_chunk = chunks[0]
    second_chunk = chunks[1]

    assert first_chunk.page_content.endswith("。")
    assert first_chunk.metadata["end_index"] == 1101
    assert second_chunk.metadata["start_index"] == 901


def test_script_chunker_falls_back_to_fixed_size_without_sentence_endings():
    splitter = ScriptSentenceWindowTextSplitter(chunk_size=1200, chunk_overlap=200)
    text = "X" * 2500

    chunks = splitter.create_documents_with_metadata(text)

    assert len(chunks) >= 2
    assert chunks[0].metadata["chunk_size"] == 1200
    assert chunks[1].metadata["start_index"] == 1000


def test_script_chunker_uses_extended_sentence_endings():
    splitter = ScriptSentenceWindowTextSplitter(chunk_size=1200, chunk_overlap=200)
    text = ("A" * 1000) + "！" + ("B" * 150) + ";" + ("C" * 1000)

    chunks = splitter.create_documents_with_metadata(text)

    assert len(chunks) >= 2
    assert chunks[0].page_content.endswith(";")


def test_script_chunker_streaming_segments_matches_full_text():
    splitter = ScriptSentenceWindowTextSplitter(chunk_size=1200, chunk_overlap=200)
    text = ("第一句。" + ("A" * 800) + "第二句。") * 4
    segments = [text[:700], text[700:1400], text[1400:]]

    docs_from_text = splitter.create_documents_with_metadata(text)
    docs_from_segments = splitter.create_documents_from_text_segments(segments)

    assert len(docs_from_text) == len(docs_from_segments)
    for index in range(len(docs_from_text)):
        assert docs_from_text[index].page_content == docs_from_segments[index].page_content
        assert docs_from_text[index].metadata["start_index"] == docs_from_segments[index].metadata["start_index"]
        assert docs_from_text[index].metadata["end_index"] == docs_from_segments[index].metadata["end_index"]
