// FrontEnd/authUI.js

import { auth, onAuthStateChanged, signOutUser } from './firebaseauth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginButtonContainer = document.getElementById('loginButtonContainer');
    const userProfileDropdownDiv = document.getElementById('userProfileDropdown');
    const userProfileButton = document.getElementById('userProfileButton');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    
    // --- AWAL INTEGRASI LOGIKA POP-UP LOGOUT ---
    // Ambil referensi ke elemen logout button yang asli dari HTML
    const originalLogoutButton = document.getElementById('logoutButton'); 
    
    // Ambil referensi ke elemen pop-up dan tombol-tombol di dalamnya
    // Pastikan elemen-elemen ini ada di HTML Anda (homepage.html dan/atau setting.html)
    const logoutPopup = document.getElementById('logoutPopup');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    let currentLogoutHandler = null; // Untuk menyimpan event handler yang aktif

    // Fungsi untuk menampilkan pop-up
    function showLogoutPopup() {
        if (logoutPopup) {
            logoutPopup.style.display = 'flex';
            setTimeout(() => {
                logoutPopup.classList.add('show');
            }, 10);
        } else {
            console.error("Elemen logoutPopup tidak ditemukan!");
        }
    }

    // Fungsi untuk menyembunyikan pop-up
    function hideLogoutPopup() {
        if (logoutPopup) {
            logoutPopup.classList.remove('show');
            setTimeout(() => {
                logoutPopup.style.display = 'none';
            }, 300); // Sesuaikan dengan durasi transisi CSS
        }
    }

    // Fungsi yang akan menjalankan proses logout aktual
    async function performLogout() {
        toggleUserDropdown(false); // Tutup dropdown jika masih terbuka
        hideLogoutPopup(); // Sembunyikan pop-up
        try {
            await signOutUser();
            console.log('AuthUI: User signed out successfully via popup confirmation.');
            // UI akan diupdate oleh onAuthStateChanged
            // window.location.reload(); // Opsional, jika perlu refresh halaman total
        } catch (error) {
            console.error('AuthUI: Error signing out via popup: ', error);
            alert('Gagal logout: ' + error.message);
        }
    }

    // Setup event listener untuk tombol-tombol pop-up (jika pop-up ada)
    if (logoutPopup && confirmLogoutBtn && cancelLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', performLogout);
        cancelLogoutBtn.addEventListener('click', hideLogoutPopup);

        // Opsional: Tutup pop-up jika area overlay diklik
        logoutPopup.addEventListener('click', function(event) {
            if (event.target === logoutPopup) {
                hideLogoutPopup();
            }
        });

        // Opsional: Tutup pop-up dengan tombol 'Escape'
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && logoutPopup.style.display === 'flex' && logoutPopup.classList.contains('show')) {
                hideLogoutPopup();
            }
        });
    }
    // --- AKHIR INTEGRASI LOGIKA POP-UP LOGOUT ---


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
            event.stopPropagation();
            toggleUserDropdown(!userDropdownMenu?.classList.contains('show'));
        });
    }

    window.addEventListener('click', (event) => {
        if (userDropdownMenu?.classList.contains('show')) {
            if (userProfileButton && !userProfileButton.contains(event.target) && !userDropdownMenu.contains(event.target)) {
                toggleUserDropdown(false);
            }
        }
    });

    if (auth && onAuthStateChanged) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("AuthUI: User is logged in", user.email);
                if (loginButtonContainer) loginButtonContainer.style.display = 'none';
                if (userProfileDropdownDiv) userProfileDropdownDiv.style.display = 'inline-flex';
                if (userEmailDisplay) userEmailDisplay.textContent = user.email || 'Profil Pengguna';

                // Setup event listener untuk tombol logout yang asli dari HTML
                if (originalLogoutButton && logoutPopup) { // Pastikan pop-up juga ada untuk flow ini
                    // Hapus event listener lama jika ada untuk menghindari duplikasi
                    if (currentLogoutHandler) {
                        originalLogoutButton.removeEventListener('click', currentLogoutHandler);
                    }
                    
                    // Definisikan handler baru
                    currentLogoutHandler = (e) => {
                        e.preventDefault();
                        toggleUserDropdown(false); // Tutup dropdown dulu
                        showLogoutPopup();        // TAMPILKAN POP-UP, bukan langsung logout
                    };
                    
                    originalLogoutButton.addEventListener('click', currentLogoutHandler);
                } else if (originalLogoutButton && !logoutPopup) {
                    // Fallback jika pop-up tidak ada, langsung logout (kurang ideal)
                    console.warn("Logout popup not found, direct logout will be performed.");
                    if (currentLogoutHandler) {
                        originalLogoutButton.removeEventListener('click', currentLogoutHandler);
                    }
                    currentLogoutHandler = async (e) => {
                        e.preventDefault();
                        toggleUserDropdown(false);
                        try {
                            await signOutUser();
                            console.log('User signed out successfully (direct, no popup).');
                        } catch (error) {
                            console.error('Error signing out (direct, no popup): ', error);
                            alert('Gagal logout: ' + error.message);
                        }
                    };
                    originalLogoutButton.addEventListener('click', currentLogoutHandler);
                }

            } else {
                console.log("AuthUI: User is logged out");
                if (loginButtonContainer) loginButtonContainer.style.display = 'inline-block';
                if (userProfileDropdownDiv) userProfileDropdownDiv.style.display = 'none';
                toggleUserDropdown(false);
                // Jika ada handler logout, hapus saat user logout (opsional, tergantung bagaimana elemen dirender ulang)
                if (originalLogoutButton && currentLogoutHandler) {
                    originalLogoutButton.removeEventListener('click', currentLogoutHandler);
                    currentLogoutHandler = null;
                }
            }
        });
    } else {
        console.error("Firebase auth object or onAuthStateChanged function is not available.");
        if (loginButtonContainer) loginButtonContainer.style.display = 'inline-block';
        if (userProfileDropdownDiv) userProfileDropdownDiv.style.display = 'none';
    }
});