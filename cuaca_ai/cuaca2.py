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