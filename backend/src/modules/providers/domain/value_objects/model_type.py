from enum import Enum


class ModelType(str, Enum):
    LLM = "LLM"
    IMAGE_2_VIDEO = "Image2video"
    IMAGE_2_IMAGE = "Image2Image"
    TEXT_2_IMAGE = "Text2Image"
    TEXT_2_VIDEO = "Text2video"
