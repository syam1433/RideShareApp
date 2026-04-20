from datetime import datetime
from utils.config import LOG_FILE

def log_event(seats_offered, detected_total, passengers_excl_driver, status):
    """
    Enhanced logging with more detailed information
    """
    try:
        file = open(LOG_FILE, "a")

        time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        file.write(f"{time} | Offered: {seats_offered} | Total Detected: {detected_total} | Passengers: {passengers_excl_driver} | Status: {status}\n")

        file.close()
        print(f"Event logged: {status}")
    except Exception as e:
        print(f"Logging error: {str(e)}")
