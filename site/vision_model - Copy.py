from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential


def init_client():
    # For production, move these back to environment variables.
    endpoint = "placeholder"
    key = "placeholder"

    if not endpoint or not key:
        raise RuntimeError("Missing vision endpoint or key")

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
            full_text += line.text + " "
    full_text = "".join(ch for ch in full_text if ch.isprintable()).strip()
    return full_text


def _extract_caption(result) -> str | None:
    """
    Return the best single caption text (or None if no good caption).
    """
    dense = getattr(result, "dense_captions", None)
    if dense is None or not getattr(dense, "values", None):
        return None

    best = None
    for cap in dense.values:
        if best is None or cap.confidence > best.confidence:
            best = cap

    if best and best.text:
        caption = "".join(ch for ch in best.text if ch.isprintable()).strip()
        return caption or None
    return None


def extract_text_from_image(image_path: str) -> str:
    """
    Backwards-compatible: only OCR text, as before.
    """
    client = init_client()
    try:
        with open(image_path, "rb") as image_data:
            result = client._analyze_from_image_data(
                image_data=image_data,
                visual_features=[VisualFeatures.READ],  # READ only
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


def extract_text_and_caption(image_path: str) -> tuple[str, str | None]:
    """
    Analyze an image file and return (full_text, caption_text_or_None).
    Uses READ + DENSE_CAPTIONS so both OCR and caption are available.
    """
    client = init_client()
    try:
        with open(image_path, "rb") as image_data:
            result = client._analyze_from_image_data(
                image_data=image_data,
                visual_features=[VisualFeatures.READ, VisualFeatures.DENSE_CAPTIONS],
                gender_neutral_caption=True,
            )
    except Exception as e:
        print(f"Vision error while analyzing image for caption: {e}")
        return "", None

    full_text = ""
    caption = None

    try:
        full_text = _extract_full_text(result)
    except Exception as e:
        print(f"Vision error while extracting text: {e}")

    try:
        caption = _extract_caption(result)
    except Exception as e:
        print(f"Vision error while extracting caption: {e}")

    return full_text, caption
