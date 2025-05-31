// FrontEnd/authUI.js (File Baru)

// Impor fungsi yang diperlukan dari firebaseauth.js
import { auth, onAuthStateChanged, signOutUser } from './firebaseauth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginButtonContainer = document.getElementById('loginButtonContainer');
    const userProfileDropdownDiv = document.getElementById('userProfileDropdown');
    const userProfileButton = document.getElementById('userProfileButton');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const logoutButton = document.getElementById('logoutButton');

    // Fungsi untuk toggle dropdown
    function toggleUserDropdown(show) {
        if (userDropdownMenu) {
            if (show) {
                userDropdownMenu.classList.add('show');
            } else {
                userDropdownMenu.classList.remove('show');
            }
        }
    }

    if (userProfileButton) {
        userProfileButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Mencegah event bubbling ke window
            toggleUserDropdown(!userDropdownMenu.classList.contains('show'));
        });
    }

    // Menutup dropdown jika klik di luar area dropdown
    window.addEventListener('click', (event) => {
        if (userDropdownMenu && userDropdownMenu.classList.contains('show')) {
            // Pastikan target klik bukan bagian dari tombol profil atau menu itu sendiri
            if (userProfileButton && !userProfileButton.contains(event.target) && !userDropdownMenu.contains(event.target)) {
                toggleUserDropdown(false);
            }
        }
    });

    // Menggunakan onAuthStateChanged untuk memantau status login pengguna
    if (auth && onAuthStateChanged) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Pengguna Login
                console.log("AuthUI: User is logged in", user.email);
                if (loginButtonContainer) loginButtonContainer.style.display = 'none';
                if (userProfileDropdownDiv) userProfileDropdownDiv.style.display = 'inline-flex'; // atau 'flex' atau 'block' sesuai kebutuhan

                if (userEmailDisplay) {
                    userEmailDisplay.textContent = user.email || 'Profil Pengguna'; 
                }

                // Fungsi Logout
                if (logoutButton) {
                    // Hapus event listener lama jika ada untuk menghindari multiple attachment
                    const newLogoutButton = logoutButton.cloneNode(true);
                    if (logoutButton.parentNode) {
                        logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
                    }
                    
                    newLogoutButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        toggleUserDropdown(false); 
                        try {
                            await signOutUser();
                            // Pengalihan atau pembaruan UI lebih lanjut bisa dilakukan di sini jika diperlukan
                            // Contoh: redirect ke homepage agar UI bersih
                            // window.location.href = "homepage.html"; // Atau biarkan onAuthStateChanged di bawah yang menangani
                            console.log('User signed out successfully from UI.');
                            // Reload mungkin diperlukan jika ada state UI lain yang bergantung pada login
                            // window.location.reload();
                        } catch (error) {
                            console.error('Error signing out from UI: ', error);
                            alert('Gagal logout: ' + error.message); // Kembalikan alert untuk error logout jika perlu
                        }
                    });
                }

            } else {
                // Pengguna Logout atau belum Login
                console.log("AuthUI: User is logged out");
                if (loginButtonContainer) loginButtonContainer.style.display = 'inline-block'; // Atau 'flex'
                if (userProfileDropdownDiv) userProfileDropdownDiv.style.display = 'none';
                toggleUserDropdown(false); 
            }
        });
    } else {
        console.error("Firebase auth object or onAuthStateChanged function is not available. Ensure firebaseauth.js is loaded correctly and exports them.");
        // Fallback UI jika Firebase tidak termuat dengan benar
        if (loginButtonContainer) loginButtonContainer.style.display = 'inline-block';
        if (userProfileDropdownDiv) userProfileDropdownDiv.style.display = 'none';
    }
});