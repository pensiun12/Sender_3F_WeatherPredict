import random
import json
import pickle
import numpy as np
import nltk
import requests
import spacy
import re
from datetime import datetime, timedelta
from tensorflow.keras.models import load_model
from nltk.stem import WordNetLemmatizer

# Inisialisasi
lemmatizer = WordNetLemmatizer()
nltk.download('punkt')
nlp = spacy.load("xx_ent_wiki_sm")

# Load model dan data
intents = json.loads(open('backend/openweather/intents.json', encoding='utf-8').read())
words = pickle.load(open('backend/openweather/words.pkl', 'rb'))
classes = pickle.load(open('backend/openweather/classes.pkl', 'rb'))
model = load_model('backend/openweather/chatbot_model.h5')

# API Key dari OpenWeatherMap
API_KEY = 'b713b4d39383e47c069a01dab4a2b673'

# Fungsi preprocessing dan prediksi

def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return sentence_words

def bag_of_words(sentence, words):
    sentence_words = clean_up_sentence(sentence)
    bag = [1 if w in sentence_words else 0 for w in words]
    return np.array(bag)

def predict_class(sentence):
    bow = bag_of_words(sentence, words)
    res = model.predict(np.array([bow]))[0]
    ERROR_THRESHOLD = 0.25
    results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return [{"intent": classes[r[0]], "probability": str(r[1])} for r in results]

# Ekstraksi informasi

def detect_location_by_ip():
    try:
        ip_info = requests.get("https://ipinfo.io/json").json()
        return ip_info.get("city", None)
    except:
        return None

def extract_city(text):
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ("GPE", "LOC"):
            return ent.text.title()  # Pastikan kapitalisasi awal huruf
    return None

def extract_day_offset(text):
    text = text.lower()
    if "lusa" in text:
        return 2
    elif "besok" in text:
        return 1
    elif "kemarin" in text:
        return -1
    elif "hari ini" in text or "sekarang" in text:
        return 0
    return 0

def extract_hour(text):
    match = re.search(r'jam (\d{1,2})', text)
    if match:
        return int(match.group(1))
    match = re.search(r'pukul (\d{1,2})', text)
    if match:
        return int(match.group(1))
    return None

# Fungsi rekomendasi cuaca
def get_weather_recommendation(weather_desc):
    desc = weather_desc.lower()
    if "hujan" in desc:
        return "🌧️ Disarankan membawa payung dan memakai jaket tahan air."
    elif "cerah" in desc or "terik" in desc:
        return "☀️ Gunakan pakaian ringan dan sunscreen ya."
    elif "berawan" in desc:
        return "⛅ Cuaca mendung, tetap jaga kesehatan."
    elif "kabut" in desc:
        return "🌫️ Hati-hati saat berkendara, jarak pandang terbatas."
    elif "angin" in desc:
        return "💨 Cuaca berangin, kenakan pakaian yang cukup hangat."
    else:
        return "Tetap jaga kesehatan ya, apapun cuacanya. 😊"
    
# Ambil cuaca dari OpenWeatherMap

def get_weather(city, day_offset=0, target_hour=None):
    try:
        now = datetime.now()
        forecast_url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric&lang=id"
        response = requests.get(forecast_url)

        if response.status_code != 200:
            return f"Maaf, saya tidak dapat menemukan informasi cuaca untuk kota '{city}'."

        data = response.json()
        forecast_list = data['list']

        # Tentukan tanggal target
        target_date = (now + timedelta(days=day_offset)).date()

        # Temukan entry prakiraan yang paling sesuai
        best_match = None
        smallest_diff = float('inf')

        for entry in forecast_list:
            dt_txt = entry['dt_txt']  # format 'YYYY-MM-DD HH:MM:SS'
            dt = datetime.strptime(dt_txt, '%Y-%m-%d %H:%M:%S')

            if dt.date() == target_date:
                if target_hour is not None:
                    diff = abs(dt.hour - target_hour)
                else:
                    diff = abs(dt.hour - 12)  # default siang hari

                if diff < smallest_diff:
                    smallest_diff = diff
                    best_match = entry

        if not best_match:
            return f"Tidak ada data prakiraan untuk {city.title()} pada tanggal tersebut."

        weather_desc = best_match['weather'][0]['description']
        suhu = best_match['main']['temp']
        jam = datetime.strptime(best_match['dt_txt'], '%Y-%m-%d %H:%M:%S').hour
        tanggal = datetime.strptime(best_match['dt_txt'], '%Y-%m-%d %H:%M:%S').strftime('%d %B %Y')
        rekomendasi = get_weather_recommendation(weather_desc)

        return (
            f"Cuaca di {city.title()} sekitar pukul {jam:02d}.00 pada {tanggal} adalah {weather_desc}, "
            f"suhu {suhu:.1f}°C.\n{rekomendasi}"
        )

    except Exception as e:
        return f"Terjadi kesalahan saat mengambil data cuaca: {e}"
    
# Fungsi utama respons chatbot

def initial_greeting_with_weather():
    city = detect_location_by_ip()
    if city:
        weather = get_weather(city, day_offset=0)
        return f"Halo! Ini ringkasan cuaca hari ini di {city.title()}:\n\n{weather}"
    else:
        return "Halo! Saya adalah asisten cuaca. Untuk memulai, sebutkan kota kamu ya. 😊"

def get_response(intents_list, intents_json, user_input):
    if not intents_list:
        return "Maaf, saya tidak mengerti. Bisa diulangi?"

    tag = intents_list[0]['intent']

    if tag == "cuaca":
        city = extract_city(user_input)
        day_offset = extract_day_offset(user_input)
        hour = extract_hour(user_input)

        if city:
            return get_weather(city, day_offset, hour)
        else:
            return "Silakan sebutkan nama kota yang ingin kamu ketahui cuacanya."

    for i in intents_json['intents']:
        if i['tag'] == tag:
            return random.choice(i['responses'])

    return "Maaf, saya tidak paham maksudmu."

def chatbot_response(msg):
    intents_list = predict_class(msg)
    return get_response(intents_list, intents, msg)

if __name__ == '__main__':
    print(initial_greeting_with_weather())
    while True:
        message = input("Anda: ")
        if message.lower() == "keluar":
            break
        resp = chatbot_response(message)
        print(f"Bot: {resp}")