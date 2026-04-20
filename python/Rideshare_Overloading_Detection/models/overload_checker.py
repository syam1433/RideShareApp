import sys
import cv2
import numpy as np
from ultralytics import YOLO
from utils.helpers import save_result_image
from utils.config import MODEL_PATH
from utils.logger import log_event

def check_overloading(image_path, seats_offered):
    """
    Enhanced overloading detection with improved accuracy and error handling
    """
    try:
        # Load YOLO model with better configuration
        model = YOLO(str(MODEL_PATH))

        # Read and validate image
        frame = cv2.imread(image_path)
        if frame is None:
            print("ERROR: Invalid or corrupted image file")
            return "ERROR", 0

        # Get image dimensions
        height, width = frame.shape[:2]
        if height < 100 or width < 100:
            print("ERROR: Image too small for reliable detection")
            return "ERROR", 0

        # Run inference with confidence threshold
        results = model(frame, conf=0.5, iou=0.45)  # Higher confidence threshold

        detected_persons = 0
        person_boxes = []

        # Process results with better filtering
        for result in results:
            for box in result.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])

                # Only count persons with high confidence
                if cls == 0 and conf > 0.6:  # Person class with 60% confidence
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    box_width = x2 - x1
                    box_height = y2 - y1

                    # Filter out very small detections (likely false positives)
                    if box_width > 30 and box_height > 60:  # Minimum size thresholds
                        detected_persons += 1
                        person_boxes.append((x1, y1, x2, y2))

        # Enhanced logic: Account for driver (subtract 1) and add buffer for accuracy
        # If detected persons - 1 (driver) > seats_offered, it's overloaded
        # Add small buffer to account for detection inaccuracies
        actual_passengers = max(0, detected_persons - 1)  # Subtract driver

        # Consider overloaded if detected passengers exceed offered seats by more than 1
        # This provides some tolerance for detection errors
        if actual_passengers > seats_offered + 1:
            status = "OVERLOADED"
            color = (0, 0, 255)  # Red
        elif actual_passengers > seats_offered:
            # Borderline case - flag for manual review
            status = "BORDERLINE"
            color = (0, 165, 255)  # Orange
        else:
            status = "NORMAL"
            color = (0, 255, 0)  # Green

        # Draw bounding boxes and labels
        for i, (x1, y1, x2, y2) in enumerate(person_boxes):
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
            cv2.putText(frame, f"Person {i+1}", (int(x1), int(y1)-10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Add status information to image
        cv2.putText(frame, f"Seats Offered: {seats_offered}", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        cv2.putText(frame, f"Persons Detected: {detected_persons}", (10, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        cv2.putText(frame, f"Passengers (excl. driver): {actual_passengers}", (10, 90),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        cv2.putText(frame, f"Status: {status}", (10, 120),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        # Save result image and log event
        save_result_image(frame, status)
        log_event(seats_offered, detected_persons, actual_passengers, status)

        print(f"Final Status: {status}")
        print(f"Total Persons Detected: {detected_persons}")
        print(f"Passengers (excluding driver): {actual_passengers}")

        return status, detected_persons

    except Exception as e:
        print(f"ERROR: Exception during processing - {str(e)}")
        return "ERROR", 0

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python main.py <image_path> <seats_offered>")
        sys.exit(1)

    image_path = sys.argv[1]
    seats_offered = int(sys.argv[2])

    status, detected = check_overloading(image_path, seats_offered)

    print(f"Overloading Status: {status}, Detected Persons: {detected}")