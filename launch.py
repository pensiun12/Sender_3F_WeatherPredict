# launch.py (letakkan di root folder SENDER_3F_WEATHERPREDICT)

import subprocess
import os
import platform
import time
import signal

# Tentukan path relatif terhadap lokasi launch.py
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, 'backend')
FRONTEND_DIR = os.path.join(ROOT_DIR, 'FrontEnd')

BACKEND_SCRIPT = 'app.py' # Nama skrip di dalam folder backend

# Port yang akan digunakan (bisa Anda sesuaikan)
BACKEND_PORT = 5000  # Pastikan ini sesuai dengan port yang app.py Anda gunakan
FRONTEND_PORT = 8000

# Variabel untuk menyimpan proses yang berjalan
backend_process = None
frontend_process = None

def start_servers():
    global backend_process, frontend_process

    print(f"Mencoba memulai Backend Server (app.py) dari: {BACKEND_DIR}...")
    # Perintah untuk menjalankan backend
    # Menggunakan 'python' atau 'python3' tergantung instalasi Anda
    python_executable = 'python3' if platform.system() != 'Windows' else 'python'

    try:
        # Menjalankan backend/app.py
        # cwd (current working directory) penting agar app.py menemukan file relatifnya dengan benar
        backend_process = subprocess.Popen(
            [python_executable, BACKEND_SCRIPT],
            cwd=BACKEND_DIR
        )
        print(f"Backend server dimulai (PID: {backend_process.pid}). Seharusnya berjalan di http://localhost:{BACKEND_PORT}")
    except FileNotFoundError:
        print(f"ERROR: Tidak bisa menemukan '{python_executable}' atau '{BACKEND_SCRIPT}' di '{BACKEND_DIR}'. Pastikan Python terinstal dan path benar.")
        return False
    except Exception as e:
        print(f"ERROR saat memulai backend: {e}")
        return False

    # Beri sedikit waktu untuk backend_process benar-benar mulai sebelum memulai frontend
    time.sleep(3)

    print(f"\nMencoba memulai Frontend Server untuk direktori: {FRONTEND_DIR} di port {FRONTEND_PORT}...")
    try:
        # Menjalankan server HTTP sederhana untuk folder FrontEnd
        # Perintah: python -m http.server <PORT>
        # cwd penting agar server menyajikan file dari folder yang benar
        frontend_process = subprocess.Popen(
            [python_executable, '-m', 'http.server', str(FRONTEND_PORT)],
            cwd=FRONTEND_DIR
        )
        print(f"Frontend server dimulai (PID: {frontend_process.pid}). Akses di http://localhost:{FRONTEND_PORT}/homepage.html")
    except FileNotFoundError:
        print(f"ERROR: Tidak bisa menemukan '{python_executable}'. Pastikan Python terinstal.")
        # Jika backend gagal start, kita mungkin ingin menghentikan backend yang sudah terlanjur jalan
        if backend_process:
            backend_process.terminate()
            backend_process.wait()
        return False
    except Exception as e:
        print(f"ERROR saat memulai frontend: {e}")
        if backend_process:
            backend_process.terminate()
            backend_process.wait()
        return False
        
    return True

def cleanup_servers(signum=None, frame=None):
    global backend_process, frontend_process
    print("\nMenerima sinyal untuk berhenti. Menghentikan server...")
    
    if frontend_process and frontend_process.poll() is None: # Jika proses masih berjalan
        print(f"Menghentikan frontend server (PID: {frontend_process.pid})...")
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=5) # Tunggu maksimal 5 detik
            print("Frontend server dihentikan.")
        except subprocess.TimeoutExpired:
            print("Frontend server tidak berhenti dalam waktu yang ditentukan, paksa hentikan.")
            frontend_process.kill()
            frontend_process.wait()
            print("Frontend server dipaksa berhenti.")
            
    if backend_process and backend_process.poll() is None: # Jika proses masih berjalan
        print(f"Menghentikan backend server (PID: {backend_process.pid})...")
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
            print("Backend server dihentikan.")
        except subprocess.TimeoutExpired:
            print("Backend server tidak berhenti dalam waktu yang ditentukan, paksa hentikan.")
            backend_process.kill()
            backend_process.wait()
            print("Backend server dipaksa berhenti.")
            
    print("Semua server telah dihentikan. Keluar.")
    exit(0)

if __name__ == "__main__":
    # Daftarkan signal handler untuk Ctrl+C (SIGINT) dan sinyal terminasi lainnya
    signal.signal(signal.SIGINT, cleanup_servers)
    signal.signal(signal.SIGTERM, cleanup_servers)
    
    if platform.system() == "Windows":
        # Penanganan Ctrl+C di Windows untuk subprocess bisa lebih rumit
        # dan mungkin tidak selalu menghentikan child process dengan baik dari skrip Python.
        # Pengguna mungkin perlu menutup jendela cmd yang dibuka oleh Popen secara manual.
        # Untuk solusi yang lebih baik di Windows, mungkin perlu library pihak ketiga atau pendekatan berbeda.
        print("INFO: Untuk menghentikan server di Windows, tutup jendela terminal masing-masing ATAU tekan Ctrl+C di terminal ini (mungkin tidak selalu menghentikan semua proses anak).")


    if start_servers():
        print("\n==================================================================")
        print("Kedua server seharusnya sudah berjalan.")
        print(f"Akses Frontend UI di: http://localhost:{FRONTEND_PORT}/homepage.html")
        print(f"Backend API kemungkinan di: http://localhost:{BACKEND_PORT}")
        print("Tekan Ctrl+C di terminal ini untuk mencoba menghentikan kedua server.")
        print("==================================================================")
        
        # Jaga skrip utama tetap berjalan agar bisa menangkap sinyal Ctrl+C
        # dan menunggu proses anak (meskipun mereka adalah server yang berjalan terus)
        try:
            while True:
                # Cek apakah proses anak masih berjalan, jika tidak, keluar.
                if (backend_process and backend_process.poll() is not None) or \
                   (frontend_process and frontend_process.poll() is not None):
                    print("Salah satu server berhenti secara tidak terduga.")
                    break
                time.sleep(1)
        except KeyboardInterrupt:
            # cleanup_servers akan dipanggil oleh signal handler
            pass
        finally:
            # Pastikan cleanup dipanggil jika loop berhenti karena alasan lain
            if not (signal.getsignal(signal.SIGINT) == cleanup_servers or signal.getsignal(signal.SIGTERM) == cleanup_servers):
                 # Ini berarti kita keluar bukan karena sinyal yang sudah dihandle, jadi panggil cleanup manual
                 cleanup_servers()
            elif (backend_process and backend_process.poll() is None) or (frontend_process and frontend_process.poll() is None):
                # Jika salah satu masih jalan tapi kita mau keluar dari script utama (misal karena error di atas)
                cleanup_servers()

    else:
        print("\nTidak semua server berhasil dimulai. Silakan periksa pesan error di atas.")