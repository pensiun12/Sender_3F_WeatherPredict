import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- Konfigurasi Firebase Anda ---
const firebaseConfig = {
    apiKey: "AIzaSyAk3WyOshRliF4rXnpTi_UwdHGnlv0mMPs", // Jaga kerahasiaan ini
    authDomain: "weather-predict-sender.firebaseapp.com",
    projectId: "weather-predict-sender",
    storageBucket: "weather-predict-sender.appspot.com",
    messagingSenderId: "621664124169",
    appId: "1:621664124169:web:df7fe7d78e48499f0f27d8",
    measurementId: "G-MYL40F077S"
};

// --- Inisialisasi Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Mendaftarkan pengguna baru dengan email dan password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<import("firebase/auth").UserCredential>}
 * @throws {Error} Firebase jika pendaftaran gagal.
 */
export async function signUpUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Firebase Auth: User created successfully.", userCredential.user);
        return userCredential;
    } catch (error) {
        console.error("Firebase Auth Error (signUpUser):", error);
        // Melempar error agar bisa ditangkap oleh blok .catch() di UI
        throw error;
    }
}

/**
 * Melakukan login pengguna dengan email dan password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<import("firebase/auth").UserCredential>}
 * @throws {Error} Firebase jika login gagal.
 */
export async function signInUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Firebase Auth: User signed in successfully.", userCredential.user);
        return userCredential;
    } catch (error) {
        console.error("Firebase Auth Error (signInUser):", error);
        throw error;
    }
}

/**
 * Melakukan login atau signup pengguna dengan akun Google via pop-up.
 * @returns {Promise<import("firebase/auth").UserCredential>}
 * @throws {Error} Firebase jika proses gagal.
 */
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("Firebase Auth: Successfully signed in with Google.", result.user);
        return result;
    } catch (error) {
        console.error("Firebase Auth Error (signInWithGoogle):", error);
        // Menangani error umum dari pop-up
        if (error.code === 'auth/popup-closed-by-user') {
            console.warn("Google sign-in popup closed by user.");
            // Tidak perlu melempar error besar, cukup biarkan proses berhenti
            // atau lempar error custom jika perlu penanganan khusus di UI.
        }
        throw error;
    }
}

/**
 * Melakukan logout pengguna yang sedang aktif.
 * @returns {Promise<void>}
 * @throws {Error} Firebase jika logout gagal.
 */
export async function signOutUser() {
    try {
        await signOut(auth);
        console.log("Firebase Auth: User signed out successfully.");
    } catch (error) {
        console.error("Firebase Auth Error (signOutUser):", error);
        throw error;
    }
}

// Ekspor objek 'auth' dan fungsi 'onAuthStateChanged' untuk digunakan di tempat lain,
// terutama untuk memantau status login secara global.
export { auth, onAuthStateChanged };