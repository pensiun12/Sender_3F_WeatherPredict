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