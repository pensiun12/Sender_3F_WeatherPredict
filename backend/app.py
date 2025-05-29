from flask import Flask, request, jsonify
from flask_cors import CORS
from openweather.chatbot_response import chatbot_response  # Sesuaikan path sesuai struktur folder kamu

app = Flask(__name__)
CORS(app)

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"reply": "Pesan kosong, silakan masukkan pertanyaan."})

    reply = chatbot_response(user_message)
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
