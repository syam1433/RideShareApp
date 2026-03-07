import sys
from models.overload_checker import check_overloading

print("\nRIDESHARE CONNECT – OVERLOADING DETECTION SYSTEM\n")

if len(sys.argv) != 3:
    print("Usage: python main.py <image_path> <seats_offered>")
    sys.exit(1)

image = sys.argv[1]
seats = int(sys.argv[2])

status, detected = check_overloading(image, seats)

print("\n----- RESULT -----")
print("Persons Detected:", detected)
print("Final Status:", status)
