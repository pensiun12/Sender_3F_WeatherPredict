import random
import json
import pickle
import numpy as np
import nltk
import requests
import spacy
import os
import re
from datetime import datetime, timedelta, date
from tensorflow.keras.models import load_model
from nltk.stem import WordNetLemmatizer
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Inisialisasi
lemmatizer = WordNetLemmatizer()

# Unduh resource NLTK yang diperlukan jika belum ada
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    print("Resource 'punkt' not found for NLTK. Downloading now...")
    nltk.download('punkt', quiet=True)
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    print("Resource 'wordnet' not found for NLTK. Downloading now...")
    nltk.download('wordnet', quiet=True)
try:
    nltk.data.find('corpora/omw-1.4')
except LookupError:
    print("Resource 'omw-1.4' (Open Multilingual Wordnet) not found. Downloading for better lemmatization support...")
    nltk.download('omw-1.4', quiet=True)


try:
    nlp = spacy.load("xx_ent_wiki_sm")
except OSError:
    print("Model spaCy 'xx_ent_wiki_sm' belum terunduh. Mencoba mengunduh sekarang...")
    import subprocess
    try:
        subprocess.check_call(['python', '-m', 'spacy', 'download', 'xx_ent_wiki_sm'])
        nlp = spacy.load("xx_ent_wiki_sm")
    except Exception as e:
        print(f"Gagal mengunduh model spaCy secara otomatis: {e}")
        print("Silakan coba jalankan 'python -m spacy download xx_ent_wiki_sm' secara manual di terminal Anda.")
        nlp = None
INTENTS_FILE = os.path.join(SCRIPT_DIR, 'intents.json')
WORDS_FILE = os.path.join(SCRIPT_DIR, 'words.pkl')
CLASSES_FILE = os.path.join(SCRIPT_DIR, 'classes.pkl')
MODEL_FILE = os.path.join(SCRIPT_DIR, 'chatbot_model.h5')

# Load model dan data
# Pastikan path ini benar relatif terhadap direktori kerja saat skrip dijalankan (misalnya, dari app.py)
try:
    intents = json.loads(open(INTENTS_FILE, encoding='utf-8').read())
    words = pickle.load(open(WORDS_FILE, 'rb'))
    classes = pickle.load(open(CLASSES_FILE, 'rb'))
    model = load_model(MODEL_FILE)
except FileNotFoundError as e:
    print(f"Error: File model atau data tidak ditemukan. Pastikan path sudah benar. Detail: {e}")
    print("Pastikan Anda menjalankan skrip dari direktori utama proyek yang berisi folder 'backend'.")
    # Anda bisa memutuskan untuk exit jika file-file ini krusial
    # exit()


# API Key dari WeatherAPI.com
API_KEY = '996e389b36e047b5812114744253005' # Ganti dengan API key Anda jika perlu

# KAMUS UNTUK TERJEMAHAN MANUAL KONDISI CUACA
WEATHER_CONDITION_TRANSLATIONS_ID = {
    "Patchy rain nearby": "Hujan ringan di beberapa tempat sekitar",
    "Patchy light rain": "Hujan ringan sporadis",
    "Light rain shower": "Hujan ringan sesaat",
    "Partly cloudy": "Berawan sebagian",
    "Cloudy": "Berawan",
    "Overcast": "Mendung total",
    "Sunny": "Cerah",
    "Clear": "Langit cerah", # Biasanya untuk malam hari
    "Mist": "Kabut tipis", # Atau Embun
    "Fog": "Kabut tebal",
    "Light rain": "Hujan ringan",
    "Moderate rain": "Hujan sedang",
    "Heavy rain": "Hujan lebat",
    "Light drizzle": "Gerimis ringan",
    "Patchy light drizzle": "Gerimis ringan sporadis",
    "Thundery outbreaks possible": "Potensi badai petir", # atau "Waspada potensi petir"
    "Patchy light rain with thunder": "Hujan ringan sporadis disertai petir",
    "Moderate or heavy rain shower": "Hujan sedang atau lebat sesaat",
    "Moderate or heavy rain with thunder": "Hujan sedang atau lebat disertai petir",
    "Light snow": "Salju ringan",
    "Moderate snow": "Salju sedang",
    "Heavy snow": "Salju lebat",
    "Blizzard": "Badai salju",
    "Freezing fog": "Kabut beku",
    "Freezing drizzle": "Gerimis beku",
    "Heavy freezing drizzle": "Gerimis beku lebat",
    "Light freezing rain": "Hujan beku ringan",
    "Moderate or heavy freezing rain": "Hujan beku sedang atau lebat",
    "Ice pellets": "Butiran es",
    "Light showers of ice pellets": "Hujan butiran es ringan sesaat",
    "Moderate or heavy showers of ice pellets": "Hujan butiran es sedang atau lebat sesaat",
    # Tambahkan lebih banyak sesuai kebutuhan dari output API
}

# --- Fungsi helper untuk format tanggal ke Bahasa Indonesia ---
def to_indonesian_date_str(date_obj):
    if not isinstance(date_obj, (datetime, date)):
        try: 
            date_obj = datetime.strptime(str(date_obj), '%Y-%m-%d').date()
        except ValueError:
            return str(date_obj) 

    days_id = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    months_id = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]
    
    day_name = days_id[date_obj.weekday()] 
    month_name = months_id[date_obj.month - 1] 
    
    return f"{day_name}, {date_obj.day} {month_name} {date_obj.year}"

# --- Fungsi preprocessing dan prediksi ---
def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return sentence_words

def bag_of_words(sentence, words_list):
    sentence_words_cleaned = clean_up_sentence(sentence)
    bag = [0] * len(words_list)
    for s_word in sentence_words_cleaned:
        for i, w in enumerate(words_list):
            if w == s_word:
                bag[i] = 1
    return np.array(bag)

def predict_class(sentence):
    # Pastikan 'words' (dari pickle) dan 'classes' (dari pickle) tersedia di scope ini
    # Jika dijalankan dari app.py, file-file ini harus bisa diakses.
    if 'words' not in globals() or 'classes' not in globals() or 'model' not in globals():
        print("Error: Model chatbot atau data pendukung (words, classes) tidak ter-load.")
        return [] # Kembalikan list kosong jika model tidak siap
        
    bow = bag_of_words(sentence, words)
    res = model.predict(np.array([bow]))[0]
    ERROR_THRESHOLD = 0.25
    results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r_val in results:
        return_list.append({"intent": classes[r_val[0]], "probability": str(r_val[1])})
    return return_list

# --- Ekstraksi informasi ---
def detect_location_by_ip():
    try:
        ip_info_response = requests.get("https://ipinfo.io/json", timeout=5)
        ip_info_response.raise_for_status() 
        ip_info = ip_info_response.json()
        return ip_info.get("city", None)
    except requests.exceptions.RequestException:
        try:
            response = requests.get(f"http://api.weatherapi.com/v1/ip.json?key={API_KEY}&q=auto:ip", timeout=5)
            response.raise_for_status()
            data = response.json()
            return data.get("city", None) # WeatherAPI mungkin mengembalikan nama region/negara, bukan hanya city
        except Exception:
            return None
    except Exception:
        return None

def extract_city(text):
    if nlp is None: 
        print("Peringatan: Model spaCy (nlp) tidak dimuat. Ekstraksi kota mungkin tidak akurat.")
        # Fallback sederhana jika spaCy tidak ada (kurang akurat)
        known_cities_pattern = r"\b(jakarta|bandung|surabaya|medan|malang|jogja|semarang|palembang|makassar|denpasar|solo|pekanbaru|padang|bandar lampung|bogor|bekasi|depok|tangerang)\b"
        match = re.search(known_cities_pattern, text.lower())
        if match:
            return match.group(1).title()
        return None

    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ("GPE", "LOC"): # GPE (Geopolitical Entity), LOC (Location)
            return ent.text.title()
    return None

def extract_day_offset(text):
    text = text.lower()
    if "lusa" in text:
        return 2
    elif "besok" in text:
        return 1
    elif "hari ini" in text or "sekarang" in text:
        return 0
    
    match_days_ahead = re.search(r'(\d+)\s+hari\s+(?:lagi|ke\s+depan|berikutnya)', text)
    if match_days_ahead:
        days = int(match_days_ahead.group(1))
        if 0 <= days <= 10: # Batas WeatherAPI forecast
            return days
    return None 

def month_name_to_number(month_name):
    months = {
        "januari": 1, "februari": 2, "maret": 3, "april": 4, "mei": 5, "juni": 6,
        "juli": 7, "agustus": 8, "september": 9, "oktober": 10, "november": 11, "desember": 12
    }
    return months.get(month_name.lower())

def extract_specific_date(text):
    text = text.lower()
    current_year = datetime.now().year

    # Format "tanggal DD MMMM YYYY" atau "DD MMMM YYYY"
    match_dmmy = re.search(r'(?:tanggal\s+)?(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})', text)
    if match_dmmy:
        day, month_name, year = int(match_dmmy.group(1)), match_dmmy.group(2), int(match_dmmy.group(3))
        month = month_name_to_number(month_name)
        if month:
            try:
                return date(year, month, day).strftime('%Y-%m-%d')
            except ValueError: pass # Tanggal tidak valid

    # Format "DD MMMM" (asumsi tahun ini)
    match_dmm = re.search(r'(?:tanggal\s+)?(\d{1,2})\s+([a-zA-Z]+)', text)
    if match_dmm:
        day, month_name = int(match_dmm.group(1)), match_dmm.group(2)
        month = month_name_to_number(month_name)
        if month:
            try: 
                target_date = date(current_year, month, day)
                # Jika tanggal sudah lewat tahun ini, dan kita hanya ingin prakiraan, bisa dianggap tidak valid
                # atau asumsikan tahun depan jika logikanya memungkinkan (tapi API terbatas)
                # if target_date < date.today(): return None # Untuk prakiraan masa depan saja
                return target_date.strftime('%Y-%m-%d')
            except ValueError: pass
    
    # Format DD/MM/YYYY atau DD-MM-YYYY
    match_slashes_dashes = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', text)
    if match_slashes_dashes:
        day, month, year = int(match_slashes_dashes.group(1)), int(match_slashes_dashes.group(2)), int(match_slashes_dashes.group(3))
        try:
            return date(year, month, day).strftime('%Y-%m-%d')
        except ValueError: pass

    # Format DD/MM atau DD-MM (asumsi tahun ini)
    match_slashes_dashes_noyear = re.search(r'(\d{1,2})[/-](\d{1,2})', text)
    if match_slashes_dashes_noyear:
        day, month = int(match_slashes_dashes_noyear.group(1)), int(match_slashes_dashes_noyear.group(2))
        try:
            target_date = date(current_year, month, day)
            # if target_date < date.today(): return None
            return target_date.strftime('%Y-%m-%d')
        except ValueError: pass
            
    return None


def extract_hour(text):
    match = re.search(r'jam\s*(\d{1,2})(?:\s*[:.]\s*(\d{2}))?', text.lower())
    if match:
        return int(match.group(1))
    match = re.search(r'pukul\s*(\d{1,2})(?:\s*[:.]\s*(\d{2}))?', text.lower())
    if match:
        return int(match.group(1))
    return None

def get_weather_recommendation(weather_desc_input):
    desc = weather_desc_input.lower() # weather_desc_input sudah melalui proses terjemahan manual jika ada
    if any(keyword in desc for keyword in ["hujan", "rintik", "gerimis"]): # Fokus ke kata kunci Indonesia utama
        return "🌧️ Disarankan membawa payung atau jas hujan dan memakai jaket tahan air."
    elif any(keyword in desc for keyword in ["cerah", "terik", "langit cerah"]):
        return "☀️ Cuaca cerah! Gunakan pakaian ringan dan sunscreen ya. Jangan lupa kacamata hitam."
    elif any(keyword in desc for keyword in ["berawan", "awan", "mendung"]):
        return "⛅ Cuaca berawan. Aktivitas luar ruangan masih oke, tetap jaga kesehatan."
    elif any(keyword in desc for keyword in ["kabut"]): # Kabut tipis, kabut tebal, kabut beku
        return "🌫️ Hati-hati saat berkendara karena kabut, jarak pandang mungkin terbatas."
    elif any(keyword in desc for keyword in ["angin", "berangin"]):
        return "💨 Cuaca berangin, kenakan pakaian yang cukup hangat dan hati-hati dengan benda yang mudah terbang."
    elif any(keyword in desc for keyword in ["badai", "petir", "guntur"]):
        return "⛈️ Waspada badai atau petir! Sebaiknya hindari aktivitas di luar ruangan jika tidak mendesak."
    elif any(keyword in desc for keyword in ["salju", "butiran es"]):
        return "❄️ Cuaca bersalju! Kenakan pakaian hangat dan hati-hati di jalan."
    else: # Fallback jika tidak ada kondisi spesifik yang cocok
        return f"Kondisi cuaca: {weather_desc_input}. Tetap jaga kesehatan ya! 😊"


def get_weather(city, day_offset=None, specific_date_str=None, target_hour=None):
    try:
        today = date.today()
        target_date_obj = today # Inisialisasi target_date_obj
        days_param_for_api = 1 

        if specific_date_str:
            try:
                target_date_obj = datetime.strptime(specific_date_str, '%Y-%m-%d').date()
                if target_date_obj < today:
                    return f"Maaf, saya hanya bisa memberikan prakiraan cuaca untuk hari ini atau masa depan. Tanggal {to_indonesian_date_str(target_date_obj)} sudah berlalu."
                
                delta_days = (target_date_obj - today).days
                if delta_days > 10: # Batas API (biasanya 10-14 hari untuk WeatherAPI free)
                    return f"Maaf, saya hanya bisa memberikan prakiraan cuaca hingga 10 hari ke depan. Tanggal {to_indonesian_date_str(target_date_obj)} terlalu jauh."
                days_param_for_api = delta_days + 1 # API 'days' adalah 1-indexed dari hari ini
            except ValueError:
                return "Format tanggal tidak valid."
        elif day_offset is not None:
            if day_offset < 0: 
                return "Maaf, saya tidak bisa menampilkan cuaca kemarin menggunakan API prakiraan."
            if day_offset > 10:
                return f"Maaf, saya hanya bisa memberikan prakiraan cuaca hingga 10 hari ke depan. {day_offset} hari ke depan terlalu jauh."
            target_date_obj = today + timedelta(days=day_offset)
            days_param_for_api = day_offset + 1 # Jika day_offset=0 (hari ini), days_param_for_api=1
        
        # Jika tidak ada specific_date_str atau day_offset, maka target_date_obj = today dan days_param_for_api = 1

        forecast_url = f"http://api.weatherapi.com/v1/forecast.json?key={API_KEY}&q={city}&days={days_param_for_api}&aqi=no&alerts=no&lang=id"
        
        response = requests.get(forecast_url, timeout=10) 
        response.raise_for_status() # Raise HTTPError untuk status 4xx/5xx
        data = response.json()

        if 'error' in data: # Error spesifik dari API WeatherAPI
            return f"Maaf, terjadi kesalahan dari API: {data['error']['message']}"

        # Cari data prakiraan untuk tanggal target (target_date_obj)
        forecast_day_data = None
        if 'forecast' in data and 'forecastday' in data['forecast']:
            for day_data_from_api in data['forecast']['forecastday']:
                if day_data_from_api['date'] == target_date_obj.strftime('%Y-%m-%d'):
                    forecast_day_data = day_data_from_api
                    break
        
        if not forecast_day_data:
            # Ini bisa terjadi jika API tidak mengembalikan data untuk tanggal yang diminta (meskipun days_param_for_api sudah disesuaikan)
            return f"Tidak ada data prakiraan untuk {city.title()} pada tanggal {to_indonesian_date_str(target_date_obj)}."

        # Format tanggal tampilan menggunakan fungsi helper
        date_object_for_display = datetime.strptime(forecast_day_data['date'], '%Y-%m-%d').date()
        display_date_str = to_indonesian_date_str(date_object_for_display)

        # Logika untuk prakiraan per jam
        if target_hour is not None and 'hour' in forecast_day_data:
            best_hour_match = None
            smallest_diff = float('inf')
            for hour_entry in forecast_day_data['hour']:
                entry_hour = datetime.strptime(hour_entry['time'], '%Y-%m-%d %H:%M').hour
                diff = abs(entry_hour - target_hour)
                if diff < smallest_diff:
                    smallest_diff = diff
                    best_hour_match = hour_entry
                if diff == 0: # Jam persis ditemukan
                    break
            
            if best_hour_match:
                original_weather_desc_hourly = best_hour_match['condition']['text']
                # Terapkan terjemahan manual
                weather_desc_hourly = WEATHER_CONDITION_TRANSLATIONS_ID.get(original_weather_desc_hourly, original_weather_desc_hourly)
                
                suhu_hourly = best_hour_match['temp_c']
                jam_dt_obj = datetime.strptime(best_hour_match['time'], '%Y-%m-%d %H:%M')
                jam_hourly = jam_dt_obj.hour
                
                rekomendasi_hourly = get_weather_recommendation(weather_desc_hourly)
                
                response_message_hourly_prefix = f"Prakiraan cuaca di {city.title()} sekitar pukul {jam_hourly:02d}:00 pada {display_date_str}"
                if target_date_obj == today and jam_hourly < datetime.now().hour:
                    response_message_hourly_prefix = f"Info cuaca di {city.title()} sekitar pukul {jam_hourly:02d}:00 pada {display_date_str} (telah berlalu)"
                
                return (
                    f"{response_message_hourly_prefix}:\n"
                    f"Kondisi: {weather_desc_hourly}, Suhu: {suhu_hourly:.1f}°C.\n{rekomendasi_hourly}"
                )
        
        # Jika tidak ada target_hour atau data per jam tidak diproses, gunakan ringkasan harian
        daily_summary = forecast_day_data['day']
        original_weather_desc_daily = daily_summary['condition']['text']
        # Terapkan terjemahan manual
        weather_desc_daily = WEATHER_CONDITION_TRANSLATIONS_ID.get(original_weather_desc_daily, original_weather_desc_daily)

        avg_suhu_daily = daily_summary['avgtemp_c']
        max_suhu_daily = daily_summary['maxtemp_c']
        min_suhu_daily = daily_summary['mintemp_c']
        chance_of_rain_daily = daily_summary.get('daily_chance_of_rain', 0) 
        rekomendasi_daily = get_weather_recommendation(weather_desc_daily)

        return (
            f"Prakiraan cuaca untuk {city.title()} pada {display_date_str}:\n"
            f"Kondisi: {weather_desc_daily}.\n"
            f"Suhu rata-rata {avg_suhu_daily:.1f}°C (antara {min_suhu_daily:.1f}°C - {max_suhu_daily:.1f}°C).\n"
            f"Kemungkinan hujan: {chance_of_rain_daily}%.\n"
            f"{rekomendasi_daily}"
        )

    except requests.exceptions.HTTPError as http_err:
        error_message = f"Gagal mengambil data cuaca (HTTP Error): {http_err.response.status_code}."
        if http_err.response.status_code == 400: # Bad Request
             try:
                error_data = http_err.response.json()
                api_error_code = error_data.get("error", {}).get("code")
                if api_error_code == 1006: # Kode error WeatherAPI untuk "No matching location found."
                    error_message = f"Maaf, saya tidak dapat menemukan informasi cuaca untuk kota '{city}'. Pastikan nama kota benar."
                elif api_error_code: # Error lain dari API
                    error_message = f"Maaf, terjadi kesalahan dari API: {error_data.get('error',{}).get('message', 'Tidak ada detail')}"
             except: pass # Jika gagal parse JSON error, gunakan pesan error_message di atas
        elif http_err.response.status_code == 401: # Unauthorized
            error_message = "Gagal mengambil data cuaca: API Key tidak valid atau bermasalah."
        elif http_err.response.status_code == 403: # Forbidden
            error_message = "Gagal mengambil data cuaca: Akses ke API ditolak (mungkin terkait batas penggunaan atau izin)."
        return error_message + " Coba lagi nanti atau periksa nama kota/API Key."
    except requests.exceptions.Timeout:
        return "Gagal terhubung ke layanan cuaca: Waktu koneksi habis. Coba lagi nanti."
    except requests.exceptions.RequestException as req_err: # Error koneksi lainnya
        return f"Gagal terhubung ke layanan cuaca: {req_err}. Periksa koneksi internet Anda."
    except Exception as e: # Error tak terduga lainnya
        # import traceback # Untuk debugging mendalam
        # traceback.print_exc() # Untuk debugging mendalam
        return f"Terjadi kesalahan internal saat memproses permintaan cuaca: {type(e).__name__} - {e}"

# --- Fungsi utama respons chatbot ---
def initial_greeting_with_weather():
    city = detect_location_by_ip()
    if city:
        weather_today = get_weather(city, day_offset=0) # Selalu minta untuk hari ini (offset 0)
        return f"Halo! Saya adalah asisten cuaca.\n{weather_today}"
    else:
        return "Halo! Saya adalah asisten cuaca. Untuk memulai, sebutkan kota Anda ya. 😊"

def get_response(intents_list_predicted, intents_json_data, user_input_msg):
    tag = "unknown" 
    if intents_list_predicted: 
        tag = intents_list_predicted[0]['intent']
    
    city_extracted = extract_city(user_input_msg)
    day_offset_extracted = extract_day_offset(user_input_msg)
    specific_date_extracted = extract_specific_date(user_input_msg) # format YYYY-MM-DD atau None
    hour_extracted = extract_hour(user_input_msg)

    # Jika ada entitas cuaca terdeteksi dan intent bukan "cuaca", mungkin paksa jadi "cuaca"
    if (city_extracted or day_offset_extracted is not None or specific_date_extracted) and tag not in ["cuaca", "sapaan_awal_cuaca"]:
        # Lebih baik jika intent model NLU Anda sudah baik.
        # Ini bisa menjadi fallback jika model NLU gagal mengklasifikasikan query cuaca.
        # print(f"Debug: Entitas cuaca terdeteksi, mengubah tag dari '{tag}' ke 'cuaca'")
        tag = "cuaca"

    if tag == "cuaca":
        if not city_extracted: 
            # Coba deteksi IP jika kota tidak disebutkan secara eksplisit
            detected_ip_city = detect_location_by_ip()
            if detected_ip_city:
                 # Bisa buat ini lebih interaktif, misal dengan menyimpan state dan bertanya konfirmasi
                 return f"Saya mendeteksi lokasi Anda mungkin di {detected_ip_city}. Untuk kota mana Anda ingin tahu cuacanya? Atau ketik 'cuaca di {detected_ip_city}'."
            return "Untuk kota mana Anda ingin mengetahui cuacanya?"
        
        # Prioritaskan specific_date jika ada, lalu day_offset
        if specific_date_extracted:
            return get_weather(city_extracted, specific_date_str=specific_date_extracted, target_hour=hour_extracted)
        # Jika day_offset_extracted adalah 0 (hari ini) atau lebih besar. None juga akan dilewati.
        elif day_offset_extracted is not None: 
            return get_weather(city_extracted, day_offset=day_offset_extracted, target_hour=hour_extracted)
        else: # Default ke hari ini jika tidak ada info tanggal/offset sama sekali
            return get_weather(city_extracted, day_offset=0, target_hour=hour_extracted)

    # Handle intents lain dari intents.json
    if 'intents' in intents_json_data:
        for intent_data in intents_json_data['intents']:
            if intent_data['tag'] == tag:
                return random.choice(intent_data['responses'])
    
    # Fallback jika tidak ada intent yang cocok atau model NLU gagal
    # Jika masih ada entitas cuaca yang terdeteksi tapi intent tidak cocok, coba berikan info cuaca juga
    if city_extracted and (day_offset_extracted is not None or specific_date_extracted):
        print(f"Debug: Fallback ke info cuaca karena entitas terdeteksi ({city_extracted}) tapi tag tidak cocok ({tag}).")
        if specific_date_extracted:
            return get_weather(city_extracted, specific_date_str=specific_date_extracted, target_hour=hour_extracted)
        elif day_offset_extracted is not None:
            return get_weather(city_extracted, day_offset=day_offset_extracted, target_hour=hour_extracted)
        else: # Default hari ini
            return get_weather(city_extracted, day_offset=0, target_hour=hour_extracted)
            
    return "Maaf, saya kurang mengerti maksud Anda. Bisa coba tanyakan tentang cuaca di suatu kota, misalnya 'cuaca Malang besok'?"


def chatbot_response(msg):
    # Pastikan intents (dari JSON) tersedia
    if 'intents' not in globals():
        print("Error: Data intents.json tidak ter-load.")
        return "Maaf, saya sedang mengalami masalah internal untuk memproses permintaan Anda."
        
    intents_list = predict_class(msg)
    response = get_response(intents_list, intents, msg)
    return response

# Bagian ini hanya untuk testing langsung skrip chatbot_response.py
if __name__ == '__main__':
    # Pastikan semua file model dan data telah di-load di awal skrip jika dijalankan langsung
    if 'words' not in globals() or 'classes' not in globals() or 'model' not in globals() or 'intents' not in globals():
        print("Menjalankan tes, tetapi beberapa file model/data mungkin belum ter-load dengan benar karena skrip ini idealnya diimpor.")
    
    print(initial_greeting_with_weather())
    
    # Contoh tes tambahan
    # print("\n--- Tes Tambahan ---")
    # print(f"Tes untuk 'Malang besok': {chatbot_response('cuaca di Malang besok')}")
    # print(f"Tes untuk 'Jakarta 2 hari ke depan': {chatbot_response('cuaca di Jakarta 2 hari ke depan')}")
    # print(f"Tes untuk 'Bandung tanggal 5 Juni 2025': {chatbot_response('cuaca di Bandung tanggal 5 Juni 2025')}")
    # print(f"Tes untuk 'Surabaya 07/06/2025 jam 3 sore': {chatbot_response('cuaca di Surabaya 07/06/2025 jam 3 sore')}")
    # print(f"Tes untuk 'Medan patchy rain nearby': {chatbot_response('cuaca di Medan jika patchy rain nearby')}") # Ini akan dicoba diterjemahkan
    # print(f"Tes untuk 'sapaan': {chatbot_response('halo')}")
    # print("--------------------")

    while True:
        message = input("Anda: ")
        if message.lower() == "keluar":
            break
        resp = chatbot_response(message)
        print(f"Bot: {resp}")