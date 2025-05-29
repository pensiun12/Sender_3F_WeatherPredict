from flask import Flask, request, jsonify
from flask_cors import CORS
from openweather.chatbot_response import chatbot_response, initial_greeting_with_weather

app = Flask(__name__)
CORS(app)

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "").strip()

    if user_message == "__greeting__":
        reply = initial_greeting_with_weather()
    elif not user_message:
        reply = "Pesan kosong, silakan masukkan pertanyaan."
    else:
        reply = chatbot_response(user_message)

    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
