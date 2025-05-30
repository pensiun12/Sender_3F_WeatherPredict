// FrontEnd/firebaseauth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; // Ganti dengan versi terbaru jika perlu
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged, // Untuk memantau status login
  signOut // Untuk logout
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; // Ganti dengan versi terbaru jika perlu
// Hapus getAnalytics jika tidak digunakan secara spesifik sekarang untuk auth
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAk3WyOshRliF4rXnpTi_UwdHGnlv0mMPs", // Jaga kerahasiaan API Key Anda jika memungkinkan (misalnya dengan environment variables di build process)
  authDomain: "weather-predict-sender.firebaseapp.com",
  projectId: "weather-predict-sender",
  storageBucket: "weather-predict-sender.appspot.com", // Pastikan ini benar, biasanya .appspot.com
  messagingSenderId: "621664124169",
  appId: "1:621664124169:web:df7fe7d78e48499f0f27d8",
  measurementId: "G-MYL40F077S" // Opsional untuk auth dasar
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const analytics = getAnalytics(app); // Hapus atau komentari jika tidak langsung digunakan untuk auth

const provider = new GoogleAuthProvider(); // Untuk Google Sign-In

// --- Fungsi untuk Sign Up dengan Email & Password ---
async function signUpUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Signed up
    const user = userCredential.user;
    console.log("User signed up:", user);
    window.location.href = "login.html"; // Arahkan ke halaman login setelah berhasil
    return user;
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Error signing up:", errorCode, errorMessage);
    alert(`Pendaftaran gagal: ${errorMessage}`);
    return null;
  }
}

// --- Fungsi untuk Login dengan Email & Password ---
async function signInUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Signed in
    const user = userCredential.user;
    console.log("User signed in:", user);
    window.location.href = "homepage.html"; // Arahkan ke homepage setelah berhasil
    return user;
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Error signing in:", errorCode, errorMessage);
    alert(`Login gagal: ${errorMessage}`);
    return null;
  }
}

// --- Fungsi untuk Sign In dengan Google ---
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    // The signed-in user info.
    const user = result.user;
    console.log("User signed in with Google:", user);
    alert("Login dengan Google berhasil!");
    window.location.href = "homepage.html"; // Arahkan ke homepage setelah berhasil
    return user;
  } catch (error) {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData ? error.customData.email : 'N/A';
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    console.error("Error signing in with Google:", errorCode, errorMessage, email, credential);
    alert(`Login dengan Google gagal: ${errorMessage}`);
    return null;
  }
}

// --- Fungsi untuk Logout ---
async function signOutUser() {
  try {
    await signOut(auth);
    console.log("User signed out");
    alert("Anda berhasil logout.");
    window.location.href = "homepage.html"; // Arahkan ke homepage atau halaman login
  } catch (error) {
    console.error("Error signing out:", error);
    alert(`Logout gagal: ${error.message}`);
  }
}

// --- Memantau Perubahan Status Autentikasi ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Pengguna login
    console.log("User is logged in:", user);
    // Anda bisa menyembunyikan tombol login/signup dan menampilkan info pengguna/tombol logout
    // Contoh: updateUIForLoggedInUser(user);
  } else {
    // Pengguna logout
    console.log("User is logged out");
    // Anda bisa menampilkan tombol login/signup dan menyembunyikan info pengguna/tombol logout
    // Contoh: updateUIForLoggedOutUser();
  }
});

// Ekspor fungsi agar bisa digunakan di file HTML/JS lain
export { auth, signUpUser, signInUser, signInWithGoogle, signOutUser, onAuthStateChanged };