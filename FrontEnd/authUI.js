import { auth, onAuthStateChanged, signOutUser } from './firebaseauth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Elemen UI di header yang berubah berdasarkan status login
    const loginButtonContainer = document.getElementById('loginButtonContainer');
    const userProfileDropdownDiv = document.getElementById('userProfileDropdown');
    const userProfileButton = document.getElementById('userProfileButton');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const logoutButton = document.getElementById('logoutButton');

    // Elemen untuk pop-up logout
    const logoutPopup = document.getElementById('logoutPopup');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

    // Fungsi untuk menampilkan pop-up logout
    function showLogoutPopup() {
        if (!logoutPopup) return;
        logoutPopup.style.display = 'flex';
        setTimeout(() => { logoutPopup.classList.add('show'); }, 10);
    }

    // Fungsi untuk menyembunyikan pop-up logout
    function hideLogoutPopup() {
        if (!logoutPopup) return;
        logoutPopup.classList.remove('show');
        setTimeout(() => { logoutPopup.style.display = 'none'; }, 300);
    }
    
    // Fungsi untuk menjalankan proses logout setelah konfirmasi
    async function performLogout() {
        hideLogoutPopup();
        try {
            await signOutUser();
            // Redirect ke homepage setelah logout berhasil
            window.location.href = 'homepage.html';
        } catch (error) {
            alert(`Logout gagal: ${error.message}`);
        }
    }

    // Fungsi untuk toggle dropdown profil pengguna
    function toggleUserDropdown(show) {
        if (!userDropdownMenu) return;
        // Gunakan parameter 'show' untuk secara eksplisit menampilkan/menyembunyikan
        if (show) {
            userDropdownMenu.classList.add('show');
        } else {
            userDropdownMenu.classList.remove('show');
        }
    }

    // --- SETUP EVENT LISTENERS ---

    // Toggle dropdown saat tombol profil diklik
    if (userProfileButton) {
        userProfileButton.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleUserDropdown(!userDropdownMenu.classList.contains('show'));
        });
    }

    // Tutup dropdown jika klik di luar area
    window.addEventListener('click', () => {
        if (userDropdownMenu?.classList.contains('show')) {
            toggleUserDropdown(false);
        }
    });

    // Munculkan pop-up saat tombol logout di dropdown diklik
    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            toggleUserDropdown(false); // Tutup dropdown
            showLogoutPopup();
        });
    }

    // Event listener untuk tombol di dalam pop-up
    if (confirmLogoutBtn) confirmLogoutBtn.addEventListener('click', performLogout);
    if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', hideLogoutPopup);
    if (logoutPopup) logoutPopup.addEventListener('click', (event) => {
        if (event.target === logoutPopup) hideLogoutPopup(); // Klik overlay
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && logoutPopup?.style.display === 'flex') hideLogoutPopup();
    });

    // --- ON AUTH STATE CHANGED (LISTENER UTAMA) ---
    // Memantau status login dan memperbarui UI header secara global
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // PENGGUNA LOGIN
            console.log("AuthUI: User is logged in", user.email);
            if (loginButtonContainer) loginButtonContainer.style.display = 'none';
            if (userProfileDropdownDiv) userProfileDropdownDiv.style.display = 'inline-flex';
            if (userEmailDisplay) userEmailDisplay.textContent = user.displayName || user.email; // Prioritaskan displayName dari Google

        } else {
            // PENGGUNA LOGOUT
            console.log("AuthUI: User is logged out");
            if (loginButtonContainer) loginButtonContainer.style.display = 'inline-block';
            if (userProfileDropdownDiv) userProfileDropdownDiv.style.display = 'none';
        }
    });
});