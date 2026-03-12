from enum import Enum


class SystemModelType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
