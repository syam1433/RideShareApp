from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
RESULT_FOLDER = BASE_DIR / "output" / "results"
LOG_FOLDER = BASE_DIR / "output" / "logs"
LOG_FILE = LOG_FOLDER / "system_log.txt"
MODEL_PATH = BASE_DIR / "yolov8n.pt"

for folder in (UPLOAD_FOLDER, RESULT_FOLDER, LOG_FOLDER):
	folder.mkdir(parents=True, exist_ok=True)

MAX_SEATS = 4
