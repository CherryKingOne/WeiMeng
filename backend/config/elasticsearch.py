from pydantic_settings import BaseSettings


class ElasticsearchSettings(BaseSettings):
    url: str = "http://10.10.155.252:9200/"
    script_chunk_index: str = "script_chunks"
    request_timeout_seconds: int = 10

    class Config:
        env_prefix = "ELASTICSEARCH_"
        env_file = ".env"
        extra = "ignore"
