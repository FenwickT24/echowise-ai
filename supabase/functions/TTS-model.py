import os
import requests

# Set your API key somewhere safe (env variable recommended)
os.environ["OPENAI_API_KEY"] = "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"

def tts(text: str, output_file: str = "tts.mp3"):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set in environment variables.")

    url = "https://api.openai.com/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "gpt-4o-mini-tts",
        "input": text,
        "voice": "alloy",
    }

    resp = requests.post(url, headers=headers, json=payload, stream=True)

    if resp.status_code == 200:
        with open(output_file, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        print(f"Saved {output_file}")
    else:
        try:
            print("Error:", resp.status_code, resp.json())
        except ValueError:
            print("Error:", resp.status_code, resp.text)
        resp.raise_for_status()

