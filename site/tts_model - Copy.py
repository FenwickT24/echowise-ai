# tts_model.py
import os
import requests

OPENAI_API_KEY = "placeholder"  # set in environment, not in code


def tts(text: str, output_file: str) -> str:
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not set in environment variables.")

    url = "https://api.openai.com/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o-mini-tts",  # confirm this is valid for your account
        "input": text,
        "voice": "alloy",
    }

    resp = requests.post(url, headers=headers, json=payload, stream=True)

    if resp.status_code != 200:
        try:
            print("TTS error response:", resp.status_code, resp.json())
        except ValueError:
            print("TTS error response:", resp.status_code, resp.text)
        resp.raise_for_status()

    with open(output_file, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

    return output_file
