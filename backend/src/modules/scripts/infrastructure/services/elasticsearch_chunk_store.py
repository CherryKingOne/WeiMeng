from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request

from config.settings import settings
from src.modules.scripts.domain.entities.script_chunk_entity import ScriptChunk
from src.modules.scripts.domain.repositories import IScriptChunkStore

logger = logging.getLogger(__name__)


class ElasticsearchChunkStore(IScriptChunkStore):
    def __init__(self) -> None:
        elasticsearch_settings = settings.elasticsearch
        self._base_url = elasticsearch_settings.url.rstrip("/")
        self._index_name = elasticsearch_settings.script_chunk_index
        self._timeout_seconds = elasticsearch_settings.request_timeout_seconds
        self._index_ready = False

    async def index_chunks(self, chunks: list[ScriptChunk]) -> None:
        if not chunks:
            return

        await self._ensure_index()
        failures: list[str] = []
        for chunk in chunks:
            try:
                await asyncio.to_thread(self._index_chunk, chunk)
            except Exception as exc:
                logger.error(
                    "Failed to index chunk in Elasticsearch: chunk_id=%s script_id=%s library_id=%s error=%s",
                    chunk.id,
                    chunk.script_id,
                    chunk.library_id,
                    exc,
                )
                failures.append(str(chunk.id))

        if failures:
            preview = ", ".join(failures[:5])
            suffix = "..." if len(failures) > 5 else ""
            raise RuntimeError(
                f"Failed to index {len(failures)} chunk document(s) into Elasticsearch: {preview}{suffix}"
            )

    async def get_chunks(self, chunk_refs: list[ScriptChunk]) -> list[ScriptChunk]:
        if not chunk_refs:
            return []

        await self._ensure_index()
        document_ids = [str(chunk.id) for chunk in sorted(chunk_refs, key=lambda item: item.index_id)]
        payload = {"ids": document_ids}
        response = await asyncio.to_thread(
            self._request_json,
            "POST",
            self._build_path("_mget"),
            payload,
            (200,),
        )
        documents = response.get("docs", [])
        hydrated_map: dict[str, ScriptChunk] = {}
        for document in documents:
            if not document.get("found"):
                continue
            document_id = document.get("_id")
            source = document.get("_source") or {}
            if document_id:
                hydrated_map[document_id] = self._document_to_chunk(document_id, source)

        hydrated_chunks: list[ScriptChunk] = []
        missing_ids: list[str] = []
        for chunk_ref in sorted(chunk_refs, key=lambda item: item.index_id):
            chunk = hydrated_map.get(str(chunk_ref.id))
            if chunk is None:
                missing_ids.append(str(chunk_ref.id))
                continue
            chunk.created_at = chunk_ref.created_at
            chunk.updated_at = chunk_ref.updated_at
            hydrated_chunks.append(chunk)

        if missing_ids:
            preview = ", ".join(missing_ids[:5])
            suffix = "..." if len(missing_ids) > 5 else ""
            raise RuntimeError(
                f"Missing {len(missing_ids)} chunk document(s) in Elasticsearch: {preview}{suffix}"
            )

        return hydrated_chunks

    async def delete_chunks(self, chunk_ids: list[uuid.UUID]) -> None:
        if not chunk_ids:
            return

        await self._ensure_index()
        failures: list[str] = []
        for chunk_id in chunk_ids:
            try:
                await asyncio.to_thread(self._delete_chunk, chunk_id)
            except Exception as exc:
                logger.warning(
                    "Failed to delete Elasticsearch chunk document: chunk_id=%s error=%s",
                    chunk_id,
                    exc,
                )
                failures.append(str(chunk_id))

        if failures:
            preview = ", ".join(failures[:5])
            suffix = "..." if len(failures) > 5 else ""
            raise RuntimeError(
                f"Failed to delete {len(failures)} chunk document(s) from Elasticsearch: {preview}{suffix}"
            )

    async def _ensure_index(self) -> None:
        if self._index_ready:
            return

        status, _ = await asyncio.to_thread(
            self._request_raw,
            "GET",
            self._build_path(),
            None,
            (200, 404),
        )
        if status == 404:
            try:
                await asyncio.to_thread(
                    self._request_json,
                    "PUT",
                    self._build_path(),
                    self._index_template(),
                    (200, 201),
                )
            except RuntimeError as exc:
                if "resource_already_exists_exception" not in str(exc):
                    raise

        self._index_ready = True

    def _index_chunk(self, chunk: ScriptChunk) -> None:
        self._request_json(
            "PUT",
            self._build_path("_doc", str(chunk.id)),
            self._chunk_to_document(chunk),
            (200, 201),
        )

    def _delete_chunk(self, chunk_id: uuid.UUID) -> None:
        self._request_raw(
            "DELETE",
            self._build_path("_doc", str(chunk_id)),
            None,
            (200, 202, 404),
        )

    def _build_path(self, *parts: str) -> str:
        encoded_parts = [urllib_parse.quote(self._index_name, safe="")]
        encoded_parts.extend(urllib_parse.quote(part, safe="") for part in parts if part)
        return "/" + "/".join(encoded_parts)

    def _chunk_to_document(self, chunk: ScriptChunk) -> dict[str, object]:
        return {
            "script_id": str(chunk.script_id) if chunk.script_id else None,
            "library_id": str(chunk.library_id) if chunk.library_id else None,
            "index_id": chunk.index_id,
            "content": chunk.content,
            "chunk_size": chunk.chunk_size,
            "start_index": chunk.start_index,
            "end_index": chunk.end_index,
            "created_at": chunk.created_at.isoformat() if chunk.created_at else None,
        }

    @staticmethod
    def _document_to_chunk(document_id: str, source: dict[str, object]) -> ScriptChunk:
        content = str(source.get("content", ""))
        start_index = int(source.get("start_index", 0))
        end_index = int(source.get("end_index", start_index + len(content)))
        return ScriptChunk(
            id=uuid.UUID(document_id),
            script_id=uuid.UUID(source["script_id"]) if source.get("script_id") else None,
            library_id=uuid.UUID(source["library_id"]) if source.get("library_id") else None,
            index_id=int(source.get("index_id", 0)),
            content=content,
            chunk_size=int(source.get("chunk_size", len(content))),
            start_index=start_index,
            end_index=end_index,
            created_at=ElasticsearchChunkStore._parse_datetime(source.get("created_at")),
            updated_at=ElasticsearchChunkStore._parse_datetime(source.get("created_at")),
        )

    @staticmethod
    def _parse_datetime(value: object) -> datetime:
        if isinstance(value, str) and value:
            normalized = value.replace("Z", "+00:00")
            try:
                return datetime.fromisoformat(normalized)
            except ValueError:
                pass
        return datetime.utcnow()

    def _index_template(self) -> dict[str, object]:
        return {
            "mappings": {
                "properties": {
                    "script_id": {"type": "keyword"},
                    "library_id": {"type": "keyword"},
                    "index_id": {"type": "integer"},
                    "content": {"type": "text"},
                    "chunk_size": {"type": "integer"},
                    "start_index": {"type": "integer"},
                    "end_index": {"type": "integer"},
                    "created_at": {"type": "date"},
                }
            }
        }

    def _request_json(
        self,
        method: str,
        path: str,
        payload: dict[str, object] | None,
        expected_statuses: tuple[int, ...],
    ) -> dict[str, object]:
        _, body = self._request_raw(method, path, payload, expected_statuses)
        if not body:
            return {}
        return json.loads(body)

    def _request_raw(
        self,
        method: str,
        path: str,
        payload: dict[str, object] | None,
        expected_statuses: tuple[int, ...],
    ) -> tuple[int, str]:
        url = f"{self._base_url}{path}"
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        headers = {"Accept": "application/json"}
        if payload is not None:
            headers["Content-Type"] = "application/json"

        request = urllib_request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib_request.urlopen(request, timeout=self._timeout_seconds) as response:
                body = response.read().decode("utf-8")
                if response.status not in expected_statuses:
                    raise RuntimeError(
                        f"Unexpected Elasticsearch response: method={method} url={url} status={response.status}"
                    )
                return response.status, body
        except urllib_error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            if exc.code in expected_statuses:
                return exc.code, body
            raise RuntimeError(
                f"Elasticsearch request failed: method={method} url={url} status={exc.code} body={body}"
            ) from exc
        except urllib_error.URLError as exc:
            raise RuntimeError(
                f"Failed to reach Elasticsearch: method={method} url={url} error={exc}"
            ) from exc
