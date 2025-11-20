import os
import requests

# Set your API key somewhere safe (env variable recommended)
os.environ["OPENAI_API_KEY"] = "sk-49rTZeGWH5AtijQc1bA_lv942TfbfY8if0M7SSJd8GT3BlbkFJGWJKYj72TXVAgk3P6WJmO5fQ1gRi2KLa2wmEsLijUA"

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


