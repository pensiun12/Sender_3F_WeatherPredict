from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:8000"])
  # Izinkan permintaan dari frontend

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "").lower()

    # Jawaban sederhana (dummy)
    if "besok" in user_message:
        reply = "Cuaca besok diperkirakan cerah berawan."
    elif "hujan" in user_message:
        reply = "Hujan diperkirakan terjadi pada sore hari."
    else:
        reply = "Saya tidak memahami pertanyaan Anda. Silakan tanya lagi tentang cuaca."

    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True)
