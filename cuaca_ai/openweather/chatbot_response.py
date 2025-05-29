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

def extract_city(text):
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ("GPE", "LOC"):
            return ent.text.title()  # Pastikan kapitalisasi awal huruf
    return None