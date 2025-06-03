# VISUAL CROSSING #

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

# --- PATH SETUP (PENTING!) ---
# Pastikan path ini benar menuju file data Anda relatif terhadap chatbot_response.py
# Jika file data ada di folder yang sama dengan chatbot_response.py:
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_FILE = os.path.join(SCRIPT_DIR, 'intents.json')
WORDS_FILE = os.path.join(SCRIPT_DIR, 'words.pkl')
CLASSES_FILE = os.path.join(SCRIPT_DIR, 'classes.pkl')
MODEL_FILE = os.path.join(SCRIPT_DIR, 'chatbot_model.h5')

# Jika file data ada di SENDER_3F_WEATHERPREDICT/cuaca_ai/weatherapi/
# dan chatbot_response.py ada di SENDER_3F_WEATHERPREDICT/backend/weatherapi/
# ROOT_PROJECT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
# DATA_SUBDIR = os.path.join('cuaca_ai', 'weatherapi')
# INTENTS_FILE = os.path.join(ROOT_PROJECT_DIR, DATA_SUBDIR, 'intents.json')
# WORDS_FILE = os.path.join(ROOT_PROJECT_DIR, DATA_SUBDIR, 'words.pkl')
# CLASSES_FILE = os.path.join(ROOT_PROJECT_DIR, DATA_SUBDIR, 'classes.pkl')
# MODEL_FILE = os.path.join(ROOT_PROJECT_DIR, DATA_SUBDIR, 'chatbot_model.h5')


# Inisialisasi
lemmatizer = WordNetLemmatizer()

# Unduh resource NLTK yang diperlukan jika belum ada (biarkan kode ini)
# ... (kode download NLTK Anda) ...
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


# Load model spaCy (biarkan kode ini)
# ... (kode load spaCy Anda) ...
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

# Load model dan data (menggunakan path yang sudah didefinisikan di atas)
try:
    print(f"DEBUG: Memuat intents dari: {INTENTS_FILE}")
    intents = json.loads(open(INTENTS_FILE, encoding='utf-8').read())
    print(f"DEBUG: Memuat words dari: {WORDS_FILE}")
    words = pickle.load(open(WORDS_FILE, 'rb'))
    print(f"DEBUG: Memuat classes dari: {CLASSES_FILE}")
    classes = pickle.load(open(CLASSES_FILE, 'rb'))
    print(f"DEBUG: Memuat model dari: {MODEL_FILE}")
    model = load_model(MODEL_FILE)
    print("DEBUG: Semua file data dan model berhasil dimuat.")
except FileNotFoundError as e:
    print(f"ERROR FATAL: File model/data tidak ditemukan. Pastikan path sudah benar. Detail: {e}")
    intents, words, classes, model = None, None, None, None # Fallback
except Exception as e:
    print(f"ERROR FATAL: Gagal memuat model/data: {e}")
    intents, words, classes, model = None, None, None, None # Fallback


# --- PENGATURAN API BARU: VISUAL CROSSING ---
VC_API_KEY = 'NPNY44GESYP2J87F3KZRLRTVR' # API Key Visual Crossing Anda

# KAMUS UNTUK TERJEMAHAN KONDISI CUACA DARI VISUAL CROSSING
# String kondisi dari Visual Crossing bisa bervariasi.
# Anda perlu melihat respons API untuk melengkapi ini.
# Contoh: "Partially cloudy", "Clear", "Rain, Partially cloudy", "Overcast", "Snow", "Fog"
WEATHER_CONDITION_TRANSLATIONS_ID_VC = {
    "Clear": "Cerah",
    "Partially cloudy": "Berawan Sebagian",
    "Cloudy": "Berawan", # Visual Crossing mungkin hanya "Cloudy" atau "Overcast"
    "Overcast": "Mendung Total",
    "Rain": "Hujan",
    "Light Rain": "Hujan Ringan", # VC mungkin lebih spesifik
    "Heavy Rain": "Hujan Lebat",
    "Showers": "Hujan Ringan Sesaat", # VC mungkin punya istilah sendiri untuk "showers"
    "Rain, Partially cloudy": "Hujan, Berawan Sebagian",
    "Rain, Overcast": "Hujan, Mendung Total",
    "Thunderstorm": "Badai Petir", # Atau VC mungkin: "Rain, Thunder"
    "Snow": "Salju",
    "Fog": "Kabut",
    "type_21": "Berawan Sebagian", # <--- TAMBAHKAN INI
    "type_42": "Potensi Hujan Ringan", # <--- TAMBAHKAN INI
    "type_21, type_42": "Berawan Sebagian dengan Potensi Hujan Ringan",
    "Mist": "Kabut Tipis",
    # Tambahkan lebih banyak terjemahan berdasarkan string "conditions" yang dikembalikan Visual Crossing
    # dan juga "icon" yang dikembalikan (misal "rain", "snow", "fog", "wind", "cloudy", "partly-cloudy-day", "clear-day")
}

# --- Fungsi helper untuk format tanggal ke Bahasa Indonesia (tetap sama) ---
def to_indonesian_date_str(date_obj):
    if not isinstance(date_obj, (datetime, date)):
        try:
            date_obj = datetime.strptime(str(date_obj), '%Y-%m-%d').date()
        except ValueError:
            return str(date_obj)
    days_id = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    months_id = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    day_name = days_id[date_obj.weekday()]
    month_name = months_id[date_obj.month - 1]
    return f"{day_name}, {date_obj.day} {month_name} {date_obj.year}"

# --- Fungsi preprocessing dan prediksi (tetap sama) ---
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
    if not model or not words or not classes: # Pengecekan tambahan
        print("ERROR: Model NLU, words, atau classes tidak dimuat dengan benar di predict_class.")
        return []
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
def detect_location_by_ip(): # Disederhanakan, hanya ipinfo.io
    try:
        ip_info_response = requests.get("https://ipinfo.io/json", timeout=5)
        ip_info_response.raise_for_status()
        ip_info = ip_info_response.json()
        return ip_info.get("city", None)
    except Exception as e:
        print(f"Peringatan: Gagal mendeteksi lokasi via ipinfo.io: {e}")
        return None

# --- Fungsi extract_city, extract_day_offset, month_name_to_number, extract_specific_date, extract_hour (tetap sama) ---
# ... (salin semua fungsi ekstraksi Anda yang sudah ada di sini) ...
def extract_city(text):
    if nlp is None:
        print("Peringatan: Model spaCy (nlp) tidak dimuat. Ekstraksi kota mungkin tidak akurat.")
        known_cities_pattern = r"\b(jakarta|bandung|surabaya|medan|malang|jogja|semarang|palembang|makassar|denpasar|solo|pekanbaru|padang|bandar lampung|bogor|bekasi|depok|tangerang|tuban)\b" # Tambah Tuban jika sering dipakai
        match = re.search(known_cities_pattern, text.lower())
        if match:
            return match.group(1).title()
        return None
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ("GPE", "LOC"):
            return ent.text.title()
    return None

def extract_day_offset(text):
    text = text.lower()
    if "lusa" in text: return 2
    elif "besok" in text: return 1
    elif "hari ini" in text or "sekarang" in text: return 0
    match_days_ahead = re.search(r'(\d+)\s+hari\s+(?:lagi|ke\s+depan|berikutnya)', text)
    if match_days_ahead:
        days = int(match_days_ahead.group(1))
        if 0 <= days <= 14: # Visual Crossing bisa sampai 15 hari, tapi jaga-jaga
            return days
    return None

# month_name_to_number, extract_specific_date, extract_hour (sama seperti sebelumnya)
def month_name_to_number(month_name):
    months = {"januari": 1, "februari": 2, "maret": 3, "april": 4, "mei": 5, "juni": 6, "juli": 7, "agustus": 8, "september": 9, "oktober": 10, "november": 11, "desember": 12}
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
            try: return date(year, month, day).strftime('%Y-%m-%d')
            except ValueError: pass
    # Format "DD MMMM" (asumsi tahun ini)
    match_dmm = re.search(r'(?:tanggal\s+)?(\d{1,2})\s+([a-zA-Z]+)', text)
    if match_dmm:
        day, month_name = int(match_dmm.group(1)), match_dmm.group(2)
        month = month_name_to_number(month_name)
        if month:
            try: return date(current_year, month, day).strftime('%Y-%m-%d')
            except ValueError: pass
    # Format DD/MM/YYYY atau DD-MM-YYYY
    match_slashes_dashes = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', text)
    if match_slashes_dashes:
        day, month, year = int(match_slashes_dashes.group(1)), int(match_slashes_dashes.group(2)), int(match_slashes_dashes.group(3))
        try: return date(year, month, day).strftime('%Y-%m-%d')
        except ValueError: pass
    # Format DD/MM atau DD-MM (asumsi tahun ini)
    match_slashes_dashes_noyear = re.search(r'(\d{1,2})[/-](\d{1,2})', text)
    if match_slashes_dashes_noyear:
        day, month = int(match_slashes_dashes_noyear.group(1)), int(match_slashes_dashes_noyear.group(2))
        try: return date(current_year, month, day).strftime('%Y-%m-%d')
        except ValueError: pass
    return None

def extract_hour(text):
    match_jam = re.search(r'(?:jam|pukul)\s*(\d{1,2})(?:\s*[:.]\s*(\d{2}))?', text.lower())
    if match_jam:
        return int(match_jam.group(1)) # Mengambil jam saja
    return None

# --- Fungsi get_weather_recommendation (mungkin perlu penyesuaian kata kunci kondisi dari Visual Crossing) ---
def get_weather_recommendation(vc_condition_string):
    desc = vc_condition_string.lower()
    # Terjemahkan dulu jika perlu, atau langsung pakai kata kunci Inggris dari VC
    # Saya akan gunakan beberapa kata kunci Inggris yang umum dari VC
    if "rain" in desc or "showers" in desc or "drizzle" in desc:
        return "🌧️ Disarankan membawa payung atau jas hujan."
    elif "thunder" in desc:
        return "⛈️ Waspada badai atau petir! Sebaiknya hindari aktivitas di luar ruangan."
    elif "clear" in desc: # 'Clear' dari VC
        return "☀️ Cuaca cerah! Cocok untuk aktivitas luar ruangan."
    elif "cloudy" in desc or "overcast" in desc: # 'Partially cloudy', 'Cloudy', 'Overcast'
        return "⛅ Cuaca berawan. Aktivitas masih nyaman."
    elif "snow" in desc or "ice pellets" in desc or "blizzard" in desc:
        return "❄️ Cuaca bersalju! Kenakan pakaian hangat."
    elif "fog" in desc or "mist" in desc:
        return "🌫️ Hati-hati berkendara karena kabut, jarak pandang mungkin terbatas."
    elif "wind" in desc: # VC mungkin tidak punya kondisi "wind" saja, biasanya tergabung
        return "💨 Cuaca berangin, hati-hati dengan benda yang mudah terbang."
    elif any(keyword in desc for keyword in ["hujan", "rintik", "gerimis", "potensi hujan ringan"]): # Tambahkan terjemahan baru
        return "🌧️ Disarankan membawa payung atau jas hujan."
    elif any(keyword in desc for keyword in ["cerah"]):
        return "☀️ Cuaca cerah! Cocok untuk aktivitas luar."
    elif any(keyword in desc for keyword in ["berawan sebagian", "berawan", "mendung"]): # Tambahkan terjemahan baru
        return "⛅ Cuaca berawan, tetap nyaman untuk beraktivitas."
    else:
        # Jika tidak ada yang cocok, kembalikan deskripsi apa adanya dengan pesan umum
        return f"Kondisi cuaca: {vc_condition_string}. Tetap jaga kesehatan ya! 😊"


# --- FUNGSI get_weather DIMODIFIKASI UNTUK VISUAL CROSSING ---
def get_weather(city, day_offset=None, specific_date_str=None, target_hour=None, unit_group='metric'):
    if not city:
        return "Mohon sebutkan nama kota untuk prakiraan cuaca."

    print(f"DEBUG get_weather: city='{city}', day_offset='{day_offset}', specific_date_str='{specific_date_str}', target_hour='{target_hour}', unit_group='{unit_group}'")

    today = date.today()
    query_date_str = "" # Untuk API Visual Crossing (YYYY-MM-DD)

    if specific_date_str:
        try:
            target_date_obj = datetime.strptime(specific_date_str, '%Y-%m-%d').date()
            if target_date_obj < today:
                return f"Maaf, saya hanya bisa memberikan prakiraan untuk hari ini atau masa depan. Tanggal {to_indonesian_date_str(target_date_obj)} sudah berlalu."
            if (target_date_obj - today).days > 14: # VC free tier biasanya 15 hari
                return f"Maaf, saya hanya bisa memberikan prakiraan hingga 14 hari ke depan. Tanggal {to_indonesian_date_str(target_date_obj)} terlalu jauh."
            query_date_str = target_date_obj.strftime('%Y-%m-%d')
        except ValueError:
            return "Format tanggal spesifik tidak valid. Gunakan YYYY-MM-DD."
    elif day_offset is not None:
        if day_offset < 0:
            return "Maaf, saya tidak bisa menampilkan cuaca kemarin."
        if day_offset > 14:
            return f"Maaf, saya hanya bisa memberikan prakiraan hingga 14 hari ke depan. {day_offset} hari ke depan terlalu jauh."
        target_date_obj = today + timedelta(days=day_offset)
        query_date_str = target_date_obj.strftime('%Y-%m-%d')
    else: # Default hari ini jika tidak ada offset atau tanggal spesifik
        target_date_obj = today
        query_date_str = "today" # Visual Crossing bisa pakai 'today', 'tomorrow', atau YYYY-MM-DD

    # Visual Crossing Timeline API endpoint
    # Untuk satu hari, kita bisa menggunakan /timeline/{city}/{date}
    # include=hours,current,days akan memberi kita detail yang cukup.
    # 'current' berguna jika query_date_str adalah 'today'
    # 'days' akan memberi ringkasan untuk hari itu
    # 'hours' akan memberi detail per jam untuk hari itu
    
    # Jika query_date_str adalah 'today', API akan otomatis menyertakan currentConditions
    # Jika query_date_str adalah tanggal spesifik, currentConditions mungkin tidak relevan atau tidak ada.
    # Kita akan fokus pada data di dalam 'days' array.
    
    api_url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{city.replace(' ', '%20')}/{query_date_str}?key={VC_API_KEY}&unitGroup={unit_group}&contentType=json&include=hours,days&lang=id"
    # 'lang=id' di VC mungkin tidak menerjemahkan semua, tapi bisa membantu
    
    print(f"DEBUG get_weather: API URL Visual Crossing: {api_url}")

    try:
        response = requests.get(api_url, timeout=15)
        response.raise_for_status() # Akan melempar HTTPError untuk status 4xx/5xx
        data = response.json()

        if not data or 'days' not in data or not data['days']:
            return f"Tidak ada data prakiraan yang ditemukan untuk {city.title()} pada tanggal yang diminta."

        # Data hari yang kita inginkan ada di data['days'][0] karena kita query untuk 1 hari (atau 'today')
        day_data = data['days'][0]
        
        # Format tanggal tampilan dari data API (untuk konsistensi)
        actual_date_obj = datetime.strptime(day_data['datetime'], '%Y-%m-%d').date()
        display_date_str_vc = to_indonesian_date_str(actual_date_obj)
        
        # Ambil deskripsi kondisi utama untuk hari itu dan coba terjemahkan
        original_conditions_daily = day_data.get('conditions', 'Tidak diketahui')
        translated_conditions_daily = WEATHER_CONDITION_TRANSLATIONS_ID_VC.get(original_conditions_daily, original_conditions_daily)

        # Logika untuk prakiraan per jam jika target_hour diberikan
        if target_hour is not None and 'hours' in day_data:
            best_hour_match = None
            # Cari jam yang paling mendekati target_hour
            for hour_entry in day_data['hours']:
                entry_hour = datetime.fromtimestamp(hour_entry['datetimeEpoch']).hour
                if entry_hour == target_hour:
                    best_hour_match = hour_entry
                    break
            # Jika tidak ada jam pas, bisa cari yang terdekat (opsional, untuk sekarang kita cari yang pas)

            if best_hour_match:
                original_conditions_hourly = best_hour_match.get('conditions', 'Tidak diketahui')
                translated_conditions_hourly = WEATHER_CONDITION_TRANSLATIONS_ID_VC.get(original_conditions_hourly, original_conditions_hourly)
                
                suhu_hourly = best_hour_match['temp'] # Suhu sudah dalam unit yang diminta (C atau F)
                jam_dt_obj = datetime.fromtimestamp(best_hour_match['datetimeEpoch'])
                jam_hourly_display = jam_dt_obj.strftime('%H:%M')
                
                rekomendasi_hourly = get_weather_recommendation(translated_conditions_hourly)
                
                prefix_pesan_jam = f"Prakiraan cuaca di {data.get('resolvedAddress', city.title())} sekitar pukul {jam_hourly_display} pada {display_date_str_vc}"
                if actual_date_obj == today and jam_dt_obj.hour < datetime.now().hour:
                     prefix_pesan_jam = f"Info cuaca di {data.get('resolvedAddress', city.title())} sekitar pukul {jam_hourly_display} pada {display_date_str_vc} (telah berlalu)"

                return (
                    f"{prefix_pesan_jam}:\n"
                    f"Kondisi: {translated_conditions_hourly}, Suhu: {suhu_hourly:.1f}°{ 'C' if unit_group == 'metric' else 'F' }.\n"
                    f"{rekomendasi_hourly}"
                )
            else: # Jika jam spesifik diminta tapi tidak ketemu datanya
                return f"Tidak ada data prakiraan per jam untuk pukul {target_hour:02d}:00 di {city.title()} pada {display_date_str_vc}. Berikut ringkasan harian:\n" + \
                       get_daily_summary_from_vc_day_data(day_data, data.get('resolvedAddress', city.title()), display_date_str_vc, unit_group)

        # Jika tidak ada target_hour, berikan ringkasan harian
        return get_daily_summary_from_vc_day_data(day_data, data.get('resolvedAddress', city.title()), display_date_str_vc, unit_group)

    except requests.exceptions.HTTPError as http_err:
        error_message = f"Gagal mengambil data cuaca dari Visual Crossing (HTTP Error {http_err.response.status_code})."
        # Anda bisa menambahkan penanganan error spesifik dari Visual Crossing jika ada dokumentasinya
        # Untuk sekarang, kita kembalikan pesan generik
        try:
            error_details = http_err.response.text # VC mungkin mengirim pesan error dalam teks/html
            print(f"DEBUG VC Error Details: {error_details}") # Untuk debugging
            if "API key is not valid" in error_details.lower():
                error_message = "Gagal mengambil data cuaca: API Key Visual Crossing tidak valid."
            elif " encuentra ninguna ubicaci" in error_details.lower() or "location not found" in error_details.lower(): # Contoh jika VC pakai bahasa lain atau ada pesan spesifik
                error_message = f"Maaf, saya tidak dapat menemukan informasi cuaca untuk kota '{city}'. Pastikan nama kota benar."
        except:
            pass # Biarkan error_message default jika tidak bisa parse detail
        return error_message + " Silakan coba lagi nanti."
    except requests.exceptions.Timeout:
        return "Gagal terhubung ke layanan cuaca Visual Crossing: Waktu koneksi habis."
    except requests.exceptions.RequestException as req_err:
        return f"Gagal terhubung ke layanan cuaca Visual Crossing: {req_err}. Periksa koneksi internet."
    except Exception as e:
        print(f"ERROR get_weather Visual Crossing: Tipe - {type(e).__name__}, Pesan - {e}")
        # import traceback
        # traceback.print_exc() # Untuk debugging mendalam
        return f"Terjadi kesalahan internal saat memproses permintaan cuaca untuk Visual Crossing."

def get_daily_summary_from_vc_day_data(day_data, resolved_address, display_date_str_vc, unit_group):
    """Helper function to format daily summary from Visual Crossing day data."""
    original_conditions_daily = day_data.get('conditions', 'Tidak diketahui')
    translated_conditions_daily = WEATHER_CONDITION_TRANSLATIONS_ID_VC.get(original_conditions_daily, original_conditions_daily)
    
    avg_suhu_daily = day_data.get('temp', day_data.get('tempmax')) # Rata-rata atau Max jika avg tidak ada
    max_suhu_daily = day_data.get('tempmax', '--')
    min_suhu_daily = day_data.get('tempmin', '--')
    
    # Visual Crossing menyediakan 'precipprob' (persentase kemungkinan presipitasi)
    # dan 'precip' (jumlah presipitasi aktual)
    chance_of_precip_daily = day_data.get('precipprob', 0) 
    
    rekomendasi_daily = get_weather_recommendation(translated_conditions_daily)
    unit_symbol = 'C' if unit_group == 'metric' else 'F'

    return (
        f"Prakiraan cuaca untuk {resolved_address} pada {display_date_str_vc}:\n"
        f"Kondisi: {translated_conditions_daily}.\n"
        f"Suhu rata-rata {avg_suhu_daily:.1f}°{unit_symbol} (antara {min_suhu_daily:.1f}°{unit_symbol} - {max_suhu_daily:.1f}°{unit_symbol}).\n"
        f"Kemungkinan presipitasi (hujan): {chance_of_precip_daily}%.\n"
        f"{rekomendasi_daily}"
    )

# --- Fungsi utama respons chatbot (tetap sama, tapi sekarang memanggil get_weather yang baru) ---
def initial_greeting_with_weather():
    city = detect_location_by_ip()
    response_message = "Halo! Saya adalah asisten cuaca. "
    if city:
        # Untuk Visual Crossing, unit bisa diatur. Default 'metric' (Celsius)
        weather_today = get_weather(city, day_offset=0, unit_group='metric') 
        response_message += f"Saat ini di {city.title()}:\n{weather_today}"
    else:
        response_message += "Untuk memulai, sebutkan kota Anda ya. 😊"
    return response_message

def get_response(intents_list_predicted, intents_json_data, user_input_msg):
    tag = "unknown"
    if intents_list_predicted:
        tag = intents_list_predicted[0]['intent']
    
    print(f"DEBUG get_response: Pesan='{user_input_msg}', Intent Terprediksi='{tag}'")

    city_extracted = extract_city(user_input_msg)
    day_offset_extracted = extract_day_offset(user_input_msg)
    specific_date_extracted = extract_specific_date(user_input_msg)
    hour_extracted = extract_hour(user_input_msg)

    print(f"DEBUG get_response: Ekstraksi: Kota='{city_extracted}', Offset Hari='{day_offset_extracted}', Tgl Spesifik='{specific_date_extracted}', Jam='{hour_extracted}'")
    
    # Default unit ke metric (Celsius), bisa diubah jika ada preferensi pengguna
    # Jika Anda menyimpan preferensi unit di sisi server (misal per user), ambil di sini
    # Untuk sekarang, kita hardcode 'metric' atau Anda bisa meneruskannya dari app.py jika frontend mengirimnya
    unit_preference = 'metric' 

    # Logika untuk paksa tag 'cuaca' jika ada entitas cuaca (biarkan kode ini)
    if (city_extracted or day_offset_extracted is not None or specific_date_extracted) and tag not in ["cuaca", "sapaan_awal_cuaca", "terima_kasih", "salam", "penutup", "tidak_mengerti"]: # Tambahkan intent non-cuaca lain jika ada
        print(f"DEBUG: Entitas cuaca terdeteksi, tag diubah dari '{tag}' menjadi 'cuaca'.")
        tag = "cuaca"


    if tag == "cuaca":
        if not city_extracted:
            detected_ip_city = detect_location_by_ip()
            if detected_ip_city:
                return f"Saya mendeteksi lokasi Anda mungkin di {detected_ip_city}. Untuk kota mana Anda ingin tahu cuacanya? Atau ketik 'cuaca di {detected_ip_city}'."
            return "Untuk kota mana Anda ingin mengetahui cuacanya?"
        
        # Panggil get_weather dengan unit_group
        if specific_date_extracted:
            return get_weather(city_extracted, specific_date_str=specific_date_extracted, target_hour=hour_extracted, unit_group=unit_preference)
        elif day_offset_extracted is not None:
            return get_weather(city_extracted, day_offset=day_offset_extracted, target_hour=hour_extracted, unit_group=unit_preference)
        else: # Default ke hari ini
            return get_weather(city_extracted, day_offset=0, target_hour=hour_extracted, unit_group=unit_preference)

    # Handle intents lain dari intents.json (biarkan kode ini)
    if intents and 'intents' in intents: # Pastikan intents sudah dimuat
        for intent_data in intents['intents']:
            if intent_data['tag'] == tag:
                return random.choice(intent_data['responses'])
    
    # Fallback (biarkan kode ini, mungkin tambahkan pengecekan entitas lagi)
    if city_extracted: # Jika kota terdeteksi tapi intent tidak jelas, coba berikan cuaca hari ini
        print(f"DEBUG: Fallback ke info cuaca hari ini untuk {city_extracted} karena tag tidak cocok ({tag}).")
        return get_weather(city_extracted, day_offset=0, unit_group=unit_preference)
        
    return "Maaf, saya kurang mengerti maksud Anda. Bisa coba tanyakan tentang cuaca di suatu kota, misalnya 'cuaca Malang besok'?"


def chatbot_response(msg):
    if not all([intents, words, classes, model]): # Cek semua dependensi model NLU
        print("ERROR FATAL di chatbot_response: Model NLU atau data pendukung (intents, words, classes, model) tidak dimuat.")
        return "Maaf, saya sedang mengalami masalah internal untuk memproses permintaan Anda (data model tidak siap)."
        
    intents_list = predict_class(msg)
    response = get_response(intents_list, intents, msg) # intents di sini adalah intents dari JSON yang sudah di-load global
    return response

# Bagian if __name__ == '__main__': (biarkan kode ini untuk testing mandiri)
# ... (kode Anda untuk testing jika skrip dijalankan langsung) ...
if __name__ == '__main__':
    if not all([words, classes, model, intents]):
        print("PERINGATAN: Menjalankan tes, tetapi beberapa file model/data mungkin belum ter-load dengan benar.")
    
    print("Bot siap diajak bicara (ketik 'keluar' untuk berhenti):")
    print(f"Bot: {initial_greeting_with_weather()}")
    
    while True:
        message = input("Anda: ")
        if message.lower() == "keluar":
            break
        resp = chatbot_response(message)
        print(f"Bot: {resp}")