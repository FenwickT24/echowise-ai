# vision_model.py
import os
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential

def init_client():
    try:
        endpoint = "placeholder"
        key = "palceholder"
    except KeyError:
        raise RuntimeError("Missing env vars VISION_ENDPOINT or VISION_KEY")
    client = ImageAnalysisClient(
        endpoint=endpoint,
        credential=AzureKeyCredential(key),
    )
    return client

def _extract_full_text(result) -> str:
    """
    Given an ImageAnalysisResult, return concatenated OCR text as one string.
    Captions are ignored.
    """
    full_text = ""

    if result.read is not None and result.read.blocks:
        for line in result.read.blocks[0].lines:
            # Join line texts with spaces
            full_text += line.text + " "

    # Clean: keep only printable characters and strip whitespace
    full_text = "".join(ch for ch in full_text if ch.isprintable()).strip()
    return full_text

def extract_text_from_image(image_path: str) -> str:
    """
    Analyze an image file with Azure Vision and return a single string of text.
    Returns "" if no text is found or on error.
    """
    client = init_client()

    try:
        with open(image_path, "rb") as image_data:
            result = client._analyze_from_image_data(
                image_data=image_data,
                visual_features=[VisualFeatures.READ],  # READ only, ignore captions
                gender_neutral_caption=True,
            )
    except Exception as e:
        print(f"Vision error while analyzing image: {e}")
        return ""

    try:
        full_text = _extract_full_text(result)
    except Exception as e:
        print(f"Vision error while extracting text: {e}")
        return ""

    return full_text  # always a string (possibly "")
