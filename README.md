# Sender_3F_WeatherPredict
**🌤️ WeatherForecast App**
- Aplikasi ramalan cuaca berbasis web yang menyediakan informasi cuaca secara real-time dan prediksi cuaca per jam serta dilengkapi dengan chatbot AI.

**🎯 Target Device**
- Aplikasi ini dikembangkan khusus untuk dijalankan secara web-based pada server lokal (local host).

**🔍 Metodologi: Feature-Driven Development (FDD)**
- Aplikasi ini dikembangkan menggunakan metode Feature-Driven Development (FDD), sebuah pendekatan pengembangan perangkat lunak yang berfokus pada fitur (fitur-fitur yang diinginkan oleh pengguna).

**🌟 Fitur Aplikasi**
1. 🧠 ChatBot Cuaca
    - Memahami pertanyaan seperti "Bagaimana cuaca besok di Jakarta?"
    - Menjawab dengan informasi dari API cuaca
    - Natural Language Processing
2. 📍 Integrasi GPS
    - Deteksi lokasi otomatis
    - Menampilkan cuaca berdasarkan lokasi pengguna
3. 🏠 Home Page
    - Menampilkan cuaca saat ini, per jam, dan harian
    - Tampilan ikon cuaca (cerah, hujan, mendung, dll)
    - Informasi suhu, kelembaban, dan angin
4. ⚙️ Setting
    - Ganti satuan suhu (Celcius/Fahrenheit)
    - Ganti tema tampilan (Dark/Light)
    - Edit akun/profil pengguna

**🎯 Target Pasar**
Sender_3F_WeatherPredict adalah aplikasi web cuaca yang dirancang untuk membantu pengguna yang aktif di luar ruangan dalam mendapatkan informasi cuaca secara cepat, interaktif, dan akurat.
- 📌 Segmen Pengguna:
    - Komunitas Outdoor — pelari, pesepeda, pendaki gunung, hingga pegiat olahraga luar ruangan.
    - Pelaku Usaha Outdoor — pemilik kafe outdoor, foodtruck, event organizer, hingga penyedia layanan wisata alam.
    - Traveler & Backpacker — wisatawan domestik maupun mancanegara yang sering bepergian dan butuh info cuaca di destinasi tujuan.
    - Driver Ojek Online & Kurir — untuk membantu mengetahui kondisi cuaca di area operasional mereka.
- 📌 Alasan Pemilihan Target Pasar:
    - Perubahan cuaca di Indonesia cenderung cepat dan tidak menentu, terutama di wilayah urban dan dataran tinggi.
    - Tingginya aktivitas outdoor sepanjang tahun, baik untuk olahraga, hiburan, maupun pekerjaan.
    - Minimnya aplikasi cuaca berbasis web lokal yang interaktif dengan fitur chatbot berbasis bahasa natural dan integrasi GPS real-time.
    - Kebutuhan info cepat tanpa install aplikasi, cukup melalui browser di smartphone, tablet, atau desktop.


**👥 Struktur Tim & Kolaborator**
- 👨‍💼 Ketua Kelompok
    - Naoval
- 🧑‍🏫 Supervisor
    - Andin
    - Ajul
- 👥 Anggota Tim
    - Syafiq
    - Albert
    - Ferry
    - Miko
    - Zein
    - Naurotur
    - Ryan

## Teknologi yang Digunakan

* **Frontend**: HTML5, CSS3, JavaScript 
* **Backend**: Flask (Python)
* **AI**: TensorFlow (Keras API)
* **Database Pengguna & Otentikasi**: Firebase (Firebase Authentication, Cloud Firestore atau Realtime Database untuk data profil pengguna)
* **API Cuaca Eksternal**: Visual Crossing API, Weather API
* **Desain UI/UX (Perencanaan)**: Figma

## Prasyarat

Sebelum menjalankan proyek ini, pastikan Anda memiliki:
1.  **Python** (versi 3.7 atau lebih baru direkomendasikan).
2.  **pip** (Package Installer untuk Python, biasanya sudah terinstal bersama Python).
3.  **Git** (untuk meng-clone repository jika belum).
4.  Web browser modern (Chrome, Firefox, Edge, dll.).
5.  Koneksi internet (untuk mengunduh dependensi, model bahasa, dan mengakses API).

## Setup dan Instalasi

1.  **Clone Repository (Jika Belum):**
    ```bash
    git clone <https://github.com/pensiun12/Sender_3F_WeatherPredict>
    cd SENDER_3F_WEATHERPREDICT
    ```

2.  **Setup Backend:**
    * Masuk ke direktori backend:
        ```bash
        cd backend
        ```
    * **Buat dan Aktifkan Virtual Environment Python (Sangat Direkomendasikan):**
        Ini akan mengisolasi dependensi proyek Anda.
        ```bash
        python -m venv venv_backend 
        # Untuk Windows:
        venv_backend\Scripts\activate
        # Untuk macOS/Linux:
        source venv_backend/bin/activate
        ```
        Setelah aktif, prompt terminal Anda akan diawali dengan `(venv_backend)`.
    * **Install Dependensi Python:**
        Di dalam virtual environment yang aktif dan di folder `backend/`, jalankan:
        ```bash
        pip install -r requirements.txt
        ```
        
    * **Download Model Bahasa NLTK & spaCy:**
        Skrip `chatbot_response.py` mencoba mengunduh resource NLTK (`punkt`, `wordnet`, `omw-1.4`) dan model spaCy (`xx_ent_wiki_sm`) secara otomatis jika tidak ditemukan. Namun, jika gagal karena masalah jaringan atau izin, Anda mungkin perlu menjalankannya secara manual dari interpreter Python atau skrip terpisah (pastikan virtual environment aktif):
        ```python
        # Untuk NLTK
        import nltk
        nltk.download('punkt')
        nltk.download('wordnet')
        nltk.download('omw-1.4')

        # Untuk spaCy
        # import spacy
        # spacy.download('xx_ent_wiki_sm') 
        # ATAU jalankan di terminal: python -m spacy download xx_ent_wiki_sm
        ```
    * Kembali ke root direktori proyek (jika Anda tadi masuk ke `backend` untuk instalasi):
        ```bash
        cd .. 
        ```

3.  **Konfigurasi Firebase (Frontend):**
    * Buka proyek Firebase Anda di [Firebase Console](https://console.firebase.google.com/).
    * Pastikan **Firebase Authentication** sudah diaktifkan (dengan provider Email/Password atau metode lain yang Anda gunakan).
    * Pastikan **Cloud Firestore** atau **Realtime Database** sudah diaktifkan jika Anda menggunakannya untuk data profil pengguna.
    * Dari pengaturan proyek Firebase Anda ("Project settings" > "General"), dapatkan objek konfigurasi Firebase untuk aplikasi web Anda (berisi `apiKey`, `authDomain`, `projectId`, dll.).
    * Masukkan konfigurasi ini ke dalam file `FrontEnd/firebaseauth.js` pada variabel `firebaseConfig`.
        ```javascript
        // FrontEnd/firebaseauth.js
        const firebaseConfig = {
            apiKey: "AIzaSyYOUR_API_KEY_HERE", // GANTI DENGAN MILIK ANDA
            authDomain: "your-project-id.firebaseapp.com", // GANTI
            projectId: "your-project-id", // GANTI
            storageBucket: "your-project-id.appspot.com", // GANTI
            messagingSenderId: "YOUR_SENDER_ID", // GANTI
            appId: "YOUR_APP_ID" // GANTI
        };
        ```
        **Peringatan Keamanan:** Untuk proyek yang akan dibagikan atau bersifat publik, **jangan pernah memasukkan API key atau konfigurasi sensitif secara langsung ke dalam kode yang di-commit ke Git.** Gunakan variabel lingkungan atau metode konfigurasi sisi server yang aman. Untuk demo lokal atau proyek pribadi, ini mungkin bisa diterima dengan hati-hati.

4.  **Konfigurasi API Key Visual Crossing (Backend):**
    * API Key Visual Crossing Anda (`NPNY44GESYP2J87F3KZRLRTVR`) saat ini kemungkinan tertulis langsung (hardcoded) di file `backend/weatherapi/chatbot_response.py` pada variabel `VC_API_KEY`.
        ```python
        # backend/weatherapi/chatbot_response.py
        VC_API_KEY = 'YOUR_API_KEY_HERE' # API Key Visual Crossing atau API Key lainnya yang Anda miliki
        ```
    * Pastikan key ini benar dan aktif. Sama seperti Firebase config, untuk proyek publik, API key sebaiknya tidak di-hardcode.

## Cara Menjalankan Aplikasi Menggunakan `launch.py`

Setelah semua setup dan konfigurasi selesai:

1.  Buka satu terminal atau command prompt.
2.  Navigasi ke **root direktori proyek** Anda (`SENDER_3F_WEATHERPREDICT/`).
3.  Jika Anda menggunakan virtual environment untuk backend, **aktifkan virtual environment tersebut terlebih dahulu** dari root direktori:
    ```bash
    # Windows:
    # backend\venv_backend\Scripts\activate
    # macOS/Linux:
    # source backend/venv_backend/bin/activate
    ```
4.  Jalankan skrip peluncur:
    ```bash
    python launch.py
    ```
    (Atau `python3 launch.py` tergantung konfigurasi Python Anda).

5.  Skrip `launch.py` akan:
    * Memulai server backend Flask (biasanya di `http://localhost:5000`, cek output terminal untuk port pastinya).
    * Memulai server HTTP sederhana untuk menyajikan file frontend (biasanya di `http://localhost:8000`, cek output terminal untuk port pastinya).

6.  **Akses Aplikasi:**
    * Buka web browser Anda.
    * Kunjungi alamat server frontend, biasanya: **`http://localhost:8000/homepage.html`** (sesuaikan port jika berbeda dari output `launch.py`).

7.  **Menghentikan Aplikasi:**
    * Kembali ke terminal tempat Anda menjalankan `launch.py`.
    * Tekan `Ctrl+C`. Skrip `launch.py` dirancang untuk mencoba menghentikan kedua server anak.

## Catatan Tambahan

* Pastikan tidak ada aplikasi lain yang menggunakan port yang sama (misalnya port 5000 untuk backend atau 8000 untuk frontend). Anda bisa mengubah port di `launch.py` dan `backend/app.py` jika perlu.
* Jika terjadi error CORS saat frontend mencoba mengakses API backend, pastikan konfigurasi `flask-CORS` di `backend/app.py` sudah benar dan mengizinkan origin dari server frontend Anda (misalnya `origins="http://localhost:8000"`).



