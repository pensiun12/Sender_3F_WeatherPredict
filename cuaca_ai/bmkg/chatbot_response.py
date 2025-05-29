import random
import json
import pickle
import numpy as np
import nltk
import requests
import spacy
import pandas as pd
import re
from datetime import datetime, timedelta
from tensorflow.keras.models import load_model
from nltk.stem import WordNetLemmatizer

lemmatizer = WordNetLemmatizer()
intents = json.loads(open('cuaca_ai/bmkg/intents.json', encoding='utf-8').read())
words = pickle.load(open('cuaca_ai/bmkg/words.pkl', 'rb'))
classes = pickle.load(open('cuaca_ai/bmkg/classes.pkl', 'rb'))
model = load_model('cuaca_ai/bmkg/chatbot_model.h5')

nlp = spacy.load("xx_ent_wiki_sm")

df_kota = pd.read_csv(
    'cuaca_ai/bmkg/kode_kota_indonesia.csv',
    sep=r'[\t;,]',
    engine='python',
    encoding='utf-8',
    header=0,
    names=['kode_adm', 'city_name'],
    on_bad_lines='skip'
)
df_kota['city_name_normalized'] = df_kota['city_name'].str.lower().str.strip()

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
            return ent.text.lower().strip()
    words_in_text = [w.lower() for w in nltk.word_tokenize(text)]
    for word in words_in_text:
        if word in df_kota['city_name_normalized'].values:
            return word
    for i in range(len(words_in_text)-1):
        two_words = words_in_text[i] + ' ' + words_in_text[i+1]
        if two_words in df_kota['city_name_normalized'].values:
            return two_words
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
    return 0  # default

def extract_hour(text):
    match = re.search(r'jam (\d{1,2})', text)
    if match:
        return int(match.group(1))
    match = re.search(r'pukul (\d{1,2})', text)
    if match:
        return int(match.group(1))
    return None

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
    
def is_date_in_bmkg_data(target_date, cuaca_list):
    return any(item["local_datetime"].startswith(target_date) for item in cuaca_list)

def get_weather_from_bmkg(city_name, day_offset=0, target_hour=None):
    city_normalized = city_name.lower().strip()
    matched = df_kota[df_kota['city_name_normalized'] == city_normalized]

    if matched.empty:
        matched = df_kota[df_kota['city_name_normalized'].str.contains(rf'\b{re.escape(city_normalized)}\b', regex=True)]

    if matched.empty:
        return f"Maaf, saya belum mendukung kota '{city_name}' untuk cuaca BMKG."

    kode_adm = matched.iloc[0]['kode_adm']
    kota_asli = matched.iloc[0]['city_name'].title()
    url = f"https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_adm}"

    try:
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return "Maaf, gagal mengambil data dari BMKG."

        data = response.json()
        cuaca_list = data["data"][0]["cuaca"][0]
        now = datetime.now() + timedelta(days=day_offset)
        target_date_str = now.strftime('%Y-%m-%d')

        if not is_date_in_bmkg_data(target_date_str, cuaca_list):
            return (
                f"Maaf, data cuaca untuk tanggal {target_date_str} belum tersedia dari BMKG.\n"
                "Berikut prakiraan terbaru yang tersedia:\n" +
                get_weather_from_bmkg(city_name, day_offset=0, target_hour=target_hour)
            )

        if target_hour is not None:
            for item in cuaca_list:
                dt = datetime.fromisoformat(item["local_datetime"])
                if dt.strftime('%Y-%m-%d') == target_date_str and dt.hour == target_hour:
                    cuaca = item["weather_desc"]
                    suhu = item["t"]
                    kelembapan = item["hu"]
                    rekomendasi = get_weather_recommendation(cuaca)
                    return (
                        f"Cuaca di {kota_asli} sekitar pukul {target_hour:02d}.00 pada {dt.strftime('%d %B %Y')} adalah {cuaca}, "
                        f"suhu {suhu}°C, kelembapan {kelembapan}%.\n{rekomendasi}"
                    )
            return f"Maaf, saya tidak menemukan data cuaca pukul {target_hour:02d}.00 untuk {kota_asli} pada {target_date_str}."

        else:
            for item in cuaca_list:
                dt = datetime.fromisoformat(item["local_datetime"])
                if dt.strftime('%Y-%m-%d') == target_date_str:
                    cuaca = item["weather_desc"]
                    suhu = item["t"]
                    kelembapan = item["hu"]
                    rekomendasi = get_weather_recommendation(cuaca)
                    return (
                        f"Cuaca di {kota_asli} pada {dt.strftime('%d %B %Y %H:%M')} adalah {cuaca}, "
                        f"suhu sekitar {suhu}°C, kelembapan {kelembapan}%.\n{rekomendasi}"
                    )
            return f"Maaf, tidak ada data cuaca untuk tanggal {target_date_str}."

    except Exception as e:
        return f"Terjadi kesalahan saat mengambil data cuaca: {e}"

def initial_greeting_with_weather():
    city = detect_location_by_ip()
    if city:
        weather = get_weather_from_bmkg(city, day_offset=0)
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
            return get_weather_from_bmkg(city, day_offset, hour)
        else:
            return "Silakan sebutkan nama kota yang ingin kamu ketahui cuacanya."

    for i in intents_json['intents']:
        if i['tag'] == tag:
            return random.choice(i['responses'])

    return "Maaf, saya tidak paham maksudmu."

def chatbot_response(msg):
    intents_list = predict_class(msg)
    return get_response(intents_list, intents, msg)