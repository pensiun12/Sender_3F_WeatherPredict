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
intents = json.loads(open('cuaca_ai/openweather/intents.json', encoding='utf-8').read())
words = pickle.load(open('cuaca_ai/openweather/words.pkl', 'rb'))
classes = pickle.load(open('cuaca_ai/openweather/classes.pkl', 'rb'))
model = load_model('cuaca_ai/openweather/chatbot_model.h5')

# API Key dari OpenWeatherMap
API_KEY = 'b713b4d39383e47c069a01dab4a2b673'