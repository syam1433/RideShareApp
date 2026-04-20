from flask import Flask, request, jsonify
from models.overload_checker import check_overloading

app = Flask(__name__)

@app.route("/")
def home():
    return "RideShare Python API Running"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        image = data["image_path"]
        seats = int(data["seats_offered"])

        status, detected = check_overloading(image, seats)

        return jsonify({
            "status": status,
            "persons_detected": detected
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)