import os
import re
import time
import joblib
import datetime
import requests
import numpy as np
import pandas as pd
import nltk

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, mean_absolute_error

from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.utils import to_categorical

nltk.download('punkt')

API_KEY = os.getenv("WEATHER_API_KEY")
BASE_URL = "http://api.weatherapi.com/v1/forecast.json"

cities = [
    "Jakarta", "Surabaya", "Bandung", "Medan", "Makassar",
    "Kuala Lumpur", "Singapore", "Tokyo", "London", "New York",
    "Sydney", "Paris", "Cairo", "Los Angeles", "Berlin",
    "Dubai", "Bangkok", "Moscow", "Cape Town", "Toronto"
]

def fetch_forecast(city):
    url = f"{BASE_URL}?key={API_KEY}&q={city}&days=7&aqi=no&alerts=no"
    res = requests.get(url)
    if res.status_code != 200:
        print(f"Gagal ambil data untuk {city}: {res.status_code}")
        return None
    data = res.json()
    records = []
    for day in data['forecast']['forecastday']:
        for hour_data in day['hour']:
            records.append({
                'location': city,
                'datetime': hour_data['time'],
                'temp_c': hour_data['temp_c'],
                'condition': hour_data['condition']['text'],
                'humidity': hour_data['humidity'],
                'wind_kph': hour_data['wind_kph'],
                'pressure_mb': hour_data['pressure_mb'],
                'chance_of_rain': hour_data.get('chance_of_rain', 0),
                'lat': data['location']['lat'],
                'lon': data['location']['lon']
            })
    return pd.DataFrame(records)

# Ambil dan simpan data
all_data = []
for city in cities:
    df_city = fetch_forecast(city)
    if df_city is not None:
        all_data.append(df_city)
    time.sleep(1)

df_all = pd.concat(all_data, ignore_index=True)
df_all.to_csv("cuaca_banyak_kota.csv", index=False)
print("Data cuaca berhasil disimpan ke cuaca_banyak_kota.csv")

# Preprocessing
sequence_length = 24

def create_sequences(X, y):
    Xs, ys = [], []
    for i in range(len(X) - sequence_length):
        Xs.append(X[i:i+sequence_length])
        ys.append(y[i+sequence_length])
    return np.array(Xs), np.array(ys)

# Load dan siapkan data
print("Mempersiapkan data untuk training...")
df = pd.read_csv("cuaca_banyak_kota.csv")
feature_cols = ['temp_c', 'humidity', 'pressure_mb', 'wind_kph', 'chance_of_rain']
X = df[feature_cols]
y_temp = df['temp_c']
y_cond = df['condition']

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
le = LabelEncoder()
y_cond_enc = le.fit_transform(y_cond)

X_seq, y_temp_seq = create_sequences(X_scaled, y_temp.values)
_, y_cond_seq = create_sequences(X_scaled, y_cond_enc)
y_cond_cat = to_categorical(y_cond_seq)

# Model suhu
model_temp = Sequential([
    LSTM(128, input_shape=(X_seq.shape[1], X_seq.shape[2])),
    Dropout(0.3),
    Dense(64, activation='relu'),
    Dense(1)
])
model_temp.compile(optimizer='adam', loss='mae', metrics=['mae'])
model_temp.fit(X_seq, y_temp_seq, epochs=100, batch_size=32, validation_split=0.1)
model_temp.save("model_suhu.keras")

# Model kondisi
model_cond = Sequential([
    LSTM(128, input_shape=(X_seq.shape[1], X_seq.shape[2])),
    Dropout(0.3),
    Dense(64, activation='relu'),
    Dense(y_cond_cat.shape[1], activation='softmax')
])
model_cond.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model_cond.fit(X_seq, y_cond_cat, epochs=100, batch_size=32, validation_split=0.1)
model_cond.save("model_kondisi.keras")

# Simpan tools preprocessing
joblib.dump(scaler, "scaler.save")
joblib.dump(le, "label_encoder.save")
print("Model dan preprocessing tools disimpan.")

# Fungsi ambil data per kota

def ambil_data_cuaca(kota):
    url = f"{BASE_URL}?key={API_KEY}&q={kota}&days=7"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        forecast = data["forecast"]["forecastday"]
        cuaca_data = []
        for day in forecast:
            for hour in day["hour"]:
                cuaca_data.append([
                    hour["temp_c"],
                    hour["humidity"],
                    hour["pressure_mb"],
                    hour["wind_kph"],
                    hour.get("chance_of_rain", 0)
                ])
        return np.array(cuaca_data)
    else:
        print("Gagal mengambil data cuaca")
        return None

# Fungsi prediksi cuaca

def prediksi_cuaca(kota, tanggal, jam):
    model_temp = load_model("model_suhu.keras")
    model_cond = load_model("model_kondisi.keras")
    scaler = joblib.load("scaler.save")
    le = joblib.load("label_encoder.save")

    data = ambil_data_cuaca(kota)
    if data is None or data.shape[0] < 24:
        return "Data 24 jam sebelumnya tidak cukup untuk prediksi."

    X_input = scaler.transform(data)
    X_input = X_input[:24]
    X_input = np.expand_dims(X_input, axis=0)

    suhu_pred = model_temp.predict(X_input)[0][0]
    kondisi_pred = model_cond.predict(X_input)
    kondisi_label = le.inverse_transform([np.argmax(kondisi_pred)])[0]

    return f"Prediksi cuaca di {kota} pada {tanggal} jam {jam}: Suhu {suhu_pred:.1f}°C, kondisi {kondisi_label}"

# CLI chatbot sederhana
if __name__ == "__main__":
    print("===== Chatbot Prediksi Cuaca AI =====")
    print("Contoh: 'cuaca di Jakarta jam 15'")
    print("Ketik 'exit' untuk keluar.")
    while True:
        tanya = input("\n🤖 Kamu: ").lower()
        if tanya == 'exit':
            break
        lokasi = re.search(r'di (\w+)', tanya)
        jam = re.search(r'jam (\d+)', tanya)
        if lokasi and jam:
            kota = lokasi.group(1)
            jam = int(jam.group(1))
            tanggal = datetime.date.today().strftime('%Y-%m-%d')
            print("\n🤖", prediksi_cuaca(kota, tanggal, jam))
        else:
            print("\n🤖 Maaf, format pertanyaan tidak dikenali. Coba contoh: 'cuaca di Bandung jam 10'")
