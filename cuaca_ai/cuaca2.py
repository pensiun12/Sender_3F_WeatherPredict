# cuaca2.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, LSTM, Dropout
from tensorflow.keras.utils import to_categorical
import joblib
import requests

# Load Data (ubah path ini ke path lokal di komputermu)
df = pd.read_csv("cuaca_banyak_kota.csv")  
df['datetime'] = pd.to_datetime(df['datetime'])
df['hour'] = df['datetime'].dt.hour
df['dayofweek'] = df['datetime'].dt.dayofweek
df['month'] = df['datetime'].dt.month

# Encode kondisi cuaca
le = LabelEncoder()
df['condition_encoded'] = le.fit_transform(df['condition'])

# Fitur dan target
features = ['hour', 'dayofweek', 'month', 'humidity', 'wind_kph', 'chance_of_rain']
X = df[features]
y_temp = df['temp_c']
y_condition = df['condition_encoded']
n_classes = len(np.unique(y_condition))

# Normalisasi
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
joblib.dump(le, "label_encoder.pkl")
joblib.dump(scaler, "scaler.pkl")

# MODEL REGRESI SUHU
X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X_scaled, y_temp, test_size=0.2, random_state=42)
model_temp = Sequential([
    Dense(64, activation='relu', input_shape=(X_train_r.shape[1],)),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(1)
])
model_temp.compile(optimizer='adam', loss='mae')
model_temp.fit(X_train_r, y_train_r, epochs=50, batch_size=32, verbose=0)
model_temp.save("model_suhu.keras")

# MODEL KONDISI (LSTM)
y_cat = to_categorical(y_condition, num_classes=n_classes)
X_lstm = X_scaled.reshape((X_scaled.shape[0], 1, X_scaled.shape[1]))
X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X_lstm, y_cat, test_size=0.2, random_state=42)

model_condition = Sequential([
    LSTM(64, input_shape=(1, X_scaled.shape[1])),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dense(n_classes, activation='softmax')
])
model_condition.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model_condition.fit(X_train_c, y_train_c, epochs=50, batch_size=32, verbose=0)
model_condition.save("model_kondisi.keras")

# ======== PREDIKSI ========
API_KEY = "c5a26176501047528ea10759250405"

# Load model dan preprocessing
model_temp = load_model("model_suhu.keras")
model_condition = load_model("model_kondisi.keras")
le = joblib.load("label_encoder.pkl")
scaler = joblib.load("scaler.pkl")

# Ambil data dari API
def fetch_weather_data(location, date_str, hour):
    url = f"http://api.weatherapi.com/v1/history.json?key={API_KEY}&q={location}&dt={date_str}"
    res = requests.get(url)
    if res.status_code != 200:
        return None
    data = res.json()
    try:
        hour_data = data['forecast']['forecastday'][0]['hour'][hour]
        return {
            'hour': hour,
            'dayofweek': pd.Timestamp(date_str).dayofweek,
            'month': pd.Timestamp(date_str).month,
            'humidity': hour_data['humidity'],
            'wind_kph': hour_data['wind_kph'],
            'chance_of_rain': hour_data.get('chance_of_rain', 0)
        }
    except:
        return None

# Fungsi prediksi
def predict_weather(location, date_str, hour):
    input_data = fetch_weather_data(location, date_str, hour)
    if input_data is None:
        return "Maaf, data tidak tersedia untuk lokasi/waktu itu."

    features = scaler.transform([[input_data['hour'], input_data['dayofweek'],
                                  input_data['month'], input_data['humidity'],
                                  input_data['wind_kph'], input_data['chance_of_rain']]])

    suhu = model_temp.predict(features)[0][0]
    kondisi_probs = model_condition.predict(features.reshape((1, 1, -1)))
    kondisi = le.inverse_transform([np.argmax(kondisi_probs)])[0]

    return f"Prediksi cuaca di {location} pada {date_str} jam {hour}:00\nSuhu: {suhu:.1f}°C, Kondisi: {kondisi}"

# Contoh pemanggilan
if __name__ == "__main__":
    location = "malang"
    date = "2025-05-07"
    hour = 21
    print(predict_weather(location, date, hour))
