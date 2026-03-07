import cv2
from datetime import datetime
from utils.config import RESULT_FOLDER

def save_result_image(frame, status):

    filename = RESULT_FOLDER + status + "_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".jpg"

    cv2.imwrite(filename, frame)
