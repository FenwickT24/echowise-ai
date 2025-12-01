from fastapi import FastAPI, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import pathlib
import uuid
import shutil
import os

from tts_model import tts                  
from vision_model import extract_text_from_image  

app = FastAPI()

# CORS: page and API both on http://localhost:8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = pathlib.Path(__file__).parent

# Static HTML/JS/CSS
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

# Audio output
AUDIO_DIR = BASE_DIR / "audio"
AUDIO_DIR.mkdir(exist_ok=True)
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# Temp directory for uploaded images
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main HTML page."""
    return (BASE_DIR / "static" / "index.html").read_text(encoding="utf-8")


# Load local translation model (en -> nl)
model_path = r"C:\Users\jesse\Downloads\en-nl"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSeq2SeqLM.from_pretrained(model_path)


class TranslationRequest(BaseModel):
    text: str


class TranslationResponse(BaseModel):
    translated_text: str


@app.post("/translate-nl", response_model=TranslationResponse)
async def translate_to_dutch(req: TranslationRequest):
    """Translate input text to Dutch using the local model."""
    inputs = tokenizer(req.text, return_tensors="pt")
    outputs = model.generate(**inputs)
    translated = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return TranslationResponse(translated_text=translated)


class AnalyzeResponse(BaseModel):
    received_text: str
    image_filename: str | None
    vision_full_text: str | None
    translated_text: str | None
    audio_url: str


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    text: str = Form(""),
    want_dutch: str = Form("False"),     # "True" if checkbox is checked
    image: UploadFile | None = File(None),
):
   
    vision_full_text = None
    base_text = text or ""

    temp_image_path = None

    # 1) If image is provided, try OCR and overwrite base_text if OCR succeeds
    if image is not None:
        try:
            ext = pathlib.Path(image.filename).suffix
            temp_name = f"upload_{uuid.uuid4().hex}{ext}"
            temp_image_path = UPLOAD_DIR / temp_name
            with temp_image_path.open("wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

            try:
                vision_text = extract_text_from_image(str(temp_image_path))
            except Exception as e:
                print(f"Vision error: {e}")
                vision_text = ""

            vision_text = (vision_text or "").strip()
            vision_text = "".join(ch for ch in vision_text if ch.isprintable())
            vision_full_text = vision_text if vision_text else None

            if vision_full_text:
                base_text = vision_full_text
        finally:
            if temp_image_path and temp_image_path.exists():
                try:
                    os.remove(temp_image_path)
                except OSError:
                    pass

    # 2) Sanitize base_text
    base_text = (base_text or "").strip()
    base_text = "".join(ch for ch in base_text if ch.isprintable())
    if not base_text:
        base_text = "No text found in input."

    print("BASE TEXT (final original):", repr(base_text))

    want_dutch_bool = want_dutch.lower() == "true"
    translated_text: str | None = None

    # 3) If user wants Dutch, translate base_text to Dutch
    if want_dutch_bool:
        try:
            inputs = tokenizer(base_text, return_tensors="pt")
            outputs = model.generate(**inputs)
            translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        except Exception as e:
            print("Translation error:", e)
            translated_text = None

    print("TRANSLATED TEXT (if any):", repr(translated_text))

    # 4) Choose what to send to TTS:
    # - If checkbox OFF: speak base_text (original).
    # - If checkbox ON: speak translated_text if available, else base_text.
    if want_dutch_bool and translated_text:
        tts_source = translated_text
    else:
        tts_source = base_text

    audio_url = ""
    try:
        safe_tts_text = (tts_source or "").strip()
        safe_tts_text = "".join(ch for ch in safe_tts_text if ch.isprintable())
        if not safe_tts_text:
            safe_tts_text = "No valid text was found."

        print("TTS INPUT:", repr(safe_tts_text))

        unique_id = uuid.uuid4().hex
        output_path = AUDIO_DIR / f"tts_{unique_id}.mp3"
        file_path = tts(safe_tts_text, output_file=str(output_path))
        rel_name = pathlib.Path(file_path).name
        audio_url = f"http://localhost:8000/audio/{rel_name}"
    except Exception as e:
        print("TTS error:", e)

    return AnalyzeResponse(
        received_text=base_text,
        image_filename=image.filename if image else None,
        vision_full_text=vision_full_text,
        translated_text=translated_text,
        audio_url=audio_url,
    )



class TTSRequest(BaseModel):
    text: str


class TTSResponse(BaseModel):
    audio_url: str


@app.post("/tts", response_model=TTSResponse)
async def tts_endpoint(req: TTSRequest):
    safe_tts_text = (req.text or "").strip()
    safe_tts_text = "".join(ch for ch in safe_tts_text if ch.isprintable())
    if not safe_tts_text:
        safe_tts_text = "No valid text was found."

    audio_url = ""
    try:
        print("DIRECT TTS INPUT:", repr(safe_tts_text))
        unique_id = uuid.uuid4().hex
        output_path = AUDIO_DIR / f"tts_{unique_id}.mp3"
        file_path = tts(safe_tts_text, output_file=str(output_path))
        rel_name = pathlib.Path(file_path).name
        audio_url = f"http://localhost:8000/audio/{rel_name}"
    except Exception as e:
        print("Direct TTS error:", e)

    return TTSResponse(audio_url=audio_url)

