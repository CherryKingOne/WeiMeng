from pydantic_settings import BaseSettings


class ElasticsearchSettings(BaseSettings):
    url: str = "http://127.0.0.1:9200/"
    script_chunk_index: str = "script_chunks"
    request_timeout_seconds: int = 10

    class Config:
        env_prefix = "ELASTICSEARCH_"
        env_file = ".env"
        extra = "ignore"
