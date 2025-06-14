import os
import json
import boto3
import random
import urllib.parse
import re

s3 = boto3.client("s3")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "intro72-quiz")
PREFIX = "intro_music/"
EXPIRE_SECONDS = 3600

# Load artist and scene information
ARTIST_SCENE_INFO_PATH = os.path.join(os.path.dirname(__file__), "artist_scene_info.json")
with open(ARTIST_SCENE_INFO_PATH, "r", encoding="utf-8") as f:
    ARTIST_SCENE_INFO = json.load(f)

def lambda_handler(event, context):
    try:
        # List all .wav files under the intro_music/ prefix
        response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=PREFIX)
        contents = response.get("Contents", [])
        wav_files = [obj["Key"] for obj in contents if obj["Key"].endswith(".wav")]

        if len(wav_files) < 4:
            return _response(500, {"error": "Not enough .wav files in S3 bucket."})

        # Randomly select 4 songs and choose one as the correct answer
        selected = random.sample(wav_files, 4)
        correct = random.choice(selected)

        # Generate pre-signed URL for the correct audio
        audio_url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": BUCKET_NAME, "Key": correct},
            ExpiresIn=EXPIRE_SECONDS
        )

        # Extract clean song titles
        options = [extract_title(key) for key in selected]
        correct_index = options.index(extract_title(correct))
        
        # Get the song ID from the correct file (format: XX_YY_TITLE.wav)
        correct_filename = correct.split("/")[-1]
        song_id_match = re.match(r"^(\d{2}_\d{2})_.*\.wav$", correct_filename)
        song_id = song_id_match.group(1) if song_id_match else None
        
        # Get artist and scene info if available
        artist_info = None
        scene_info = None
        if song_id and song_id in ARTIST_SCENE_INFO:
            artist_info = ARTIST_SCENE_INFO[song_id].get("Artist")
            scene_info = ARTIST_SCENE_INFO[song_id].get("Scene")

        result = {
            "options": options,
            "audio_url": audio_url,
            "answer_index": correct_index,
            "artist_info": artist_info,
            "scene_info": scene_info
        }

        return _response(200, result)

    except Exception as e:
        print(e)
        return _response(500, {"error": "Error"})

def extract_title(key):
    """Extracts the song title from a file name in the format XX_YY_TITLE.wav"""
    filename = key.split("/")[-1]
    filename = urllib.parse.unquote(filename)
    match = re.match(r"^\d{2}_\d{2}_(.+)\.wav$", filename)
    if match:
        return match.group(1)
    else:
        return os.path.splitext(filename)[0]

def _response(status_code, body_dict):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": os.environ.get("ALLOWED_ORIGIN", "*"),
            "Content-Type": "application/json"
        },
        "body": json.dumps(body_dict, ensure_ascii=False)
    }
