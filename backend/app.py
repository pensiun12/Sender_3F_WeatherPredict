from flask import Flask, request, jsonify
from flask_cors import CORS
# Pastikan import ini benar sesuai lokasi file Anda
from weatherapi.chatbot_response import chatbot_response, initial_greeting_with_weather
# Jika Anda sudah memindahkan atau yakin 'openweather' tidak dipakai, Anda bisa hapus import di bawah ini
# from openweather.chatbot_response import chatbot_response, initial_greeting_with_weather

app = Flask(__name__)

# Konfigurasi CORS yang lebih spesifik
# Izinkan permintaan dari http://localhost:8000 (ganti jika port frontend Anda berbeda)
# untuk semua rute di aplikasi Anda.
CORS(app, origins="http://localhost:8000")

# Atau, jika Anda ingin lebih spesifik hanya untuk rute tertentu, misalnya /chat:
# CORS(app, resources={r"/chat": {"origins": "http://localhost:8000"}})
# Jika Anda memiliki rute API lain, Anda bisa menambahkannya di sini juga:
# CORS(app, resources={
# r"/chat": {"origins": "http://localhost:8000"},
# r"/api/*": {"origins": "http://localhost:8000"} # Contoh untuk semua rute di bawah /api/
# })


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "").strip()

    reply = "" # Inisialisasi reply
    if user_message == "__greeting__":
        reply = initial_greeting_with_weather()
    elif not user_message:
        reply = "Pesan kosong, silakan masukkan pertanyaan."
    else:
        reply = chatbot_response(user_message)

    return jsonify({"reply": reply})

if __name__ == "__main__":
    # Menambahkan host='0.0.0.0' agar server bisa diakses dari perangkat lain di jaringan Anda
    # Ini penting jika Anda ingin mengakses dari HP atau jika launch.py/frontend ada di "luar"
    app.run(host='0.0.0.0', port=5000, debug=True)