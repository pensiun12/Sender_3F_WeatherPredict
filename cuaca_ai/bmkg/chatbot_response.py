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
intents = json.loads(open('bmkg/intents.json', encoding='utf-8').read())
words = pickle.load(open('bmkg/words.pkl', 'rb'))
classes = pickle.load(open('bmkg/classes.pkl', 'rb'))
model = load_model('bmkg/chatbot_model.h5')

nlp = spacy.load("xx_ent_wiki_sm")

df_kota = pd.read_csv(
    'bmkg/kode_kota_indonesia.csv',
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