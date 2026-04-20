import os


EXTERNAL_BASE_DIR = r"C:\Transposeg\Gerador"
DATA_DIR = os.path.join(EXTERNAL_BASE_DIR)

os.makedirs(DATA_DIR, exist_ok=True)


class Config:
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
    OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
    JSON_FILE = os.path.join(DATA_DIR, "data.json")
    