//DARKMODE//
document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('themeSelect');
  const body = document.body;

  // Function to apply the theme
  function applyTheme(theme) {
    if (theme === 'dark') {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme'); // Ensure light-theme is removed if present
      localStorage.setItem('theme', 'dark'); // Save user preference
    } else if (theme === 'light') {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme'); // Ensure dark-theme is removed if present
      localStorage.setItem('theme', 'light'); // Save user preference
    } else {
      // Default or 'Pilih' state
      body.classList.remove('dark-theme');
      body.classList.remove('light-theme');
      localStorage.removeItem('theme'); // Remove preference if default
    }
  }

  // Load theme from localStorage on page load
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    applyTheme(savedTheme);
    themeSelect.value = savedTheme; // Set the dropdown to the saved theme
  } else {
    // If no saved theme, set dropdown to 'Pilih' and apply default styles
    themeSelect.value = 'default';
  }


  // Event listener for dropdown change
  themeSelect.addEventListener('change', (event) => {
    const selectedTheme = event.target.value;
    applyTheme(selectedTheme);
  });

  //POP UP MESSAGE//
  const logoutOption = document.getElementById('logoutOption');
  const logoutPopup = document.getElementById('logoutPopup');
  
  if (logoutOption && logoutPopup) { // Hanya jalankan jika elemen pop-up dan tombol pemicu ada
      const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
      const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

      // Pastikan tombol di dalam pop-up juga ada
      if (!confirmLogoutBtn || !cancelLogoutBtn) {
          console.error('Tombol konfirmasi atau batal di dalam pop-up tidak ditemukan!');
          return;
      }

      // Fungsi untuk menampilkan pop-up
      function showLogoutPopup() {
          logoutPopup.style.display = 'flex'; // Mengubah dari none ke flex
          setTimeout(() => { // Memberi sedikit waktu untuk display flex bekerja sebelum transisi opacity
              logoutPopup.classList.add('show');
          }, 10); 
      }

      // Fungsi untuk menyembunyikan pop-up
      function hideLogoutPopup() {
          logoutPopup.classList.remove('show');
          // Tunggu animasi selesai sebelum menyembunyikan total dengan display: none
          setTimeout(() => {
               logoutPopup.style.display = 'none';
          }, 300); // Sesuaikan dengan durasi transisi CSS (0.3s)
      }

      // Event listener untuk opsi "Keluar"
      logoutOption.addEventListener('click', function(event) {
          event.preventDefault(); // Mencegah perilaku default jika "Keluar" adalah link
          showLogoutPopup();
      });

      // Event listener untuk tombol "Batal" di pop-up
      cancelLogoutBtn.addEventListener('click', function() {
          hideLogoutPopup();
      });

      // Event listener untuk tombol "Ya, Keluar" di pop-up
      confirmLogoutBtn.addEventListener('click', function() {
          hideLogoutPopup();
          // --- LOGIKA KELUAR AKTUAL DITAMBAHKAN DI SINI ---
          alert('Anda telah berhasil keluar!'); // Placeholder
          window.location.href = 'login.html';
         
            

          // Contoh: Menghapus data sesi dari localStorage (jika digunakan untuk status login)
          // localStorage.removeItem('userToken');
          // localStorage.removeItem('userData');
          // window.location.href = 'homepage.html'; // atau halaman lain setelah logout
      });

      // Opsional: Event listener untuk menutup pop-up jika area overlay (luar konten pop-up) diklik
      logoutPopup.addEventListener('click', function(event) {
          if (event.target === logoutPopup) { // Memastikan yang diklik adalah overlay, bukan kontennya
              hideLogoutPopup();
          }
      });

      // Opsional: Event listener untuk menutup pop-up dengan tombol 'Escape'
      document.addEventListener('keydown', function(event) {
          if (event.key === 'Escape' && logoutPopup.classList.contains('show')) {
              hideLogoutPopup();
          }
      });

  } else {
      
      if (window.location.pathname.includes('setting.html')) {
           if (!logoutOption) console.warn('Peringatan: Elemen dengan ID "logoutOption" tidak ditemukan di halaman pengaturan.');
           if (!logoutPopup) console.warn('Peringatan: Elemen dengan ID "logoutPopup" tidak ditemukan di halaman pengaturan.');
       }
  }
});
// End DARKMODE//

// Data prakiraan per jam
function updateWeather() {
    const city = document.getElementById("cityInput").value;
    alert("Fitur pencarian untuk kota " + city + " akan dikembangkan.");
    // Di sini bisa ditambahkan pemanggilan API cuaca nyata di masa depan
  }
  const hourlyData = [
    { time: "01:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "20°", rain: "0%" },
    { time: "02:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "20°", rain: "0%" },
    { time: "03:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "20°", rain: "0%" },
    { time: "04:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "20°", rain: "0%" },
    { time: "05:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "20°", rain: "0%" },
    { time: "06:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "07:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "08:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "09:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "10:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "11:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "12:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "13:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "14:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "15:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "16:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "17:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "18:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "19:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "20:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "21:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "22:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "23:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
    { time: "00:00", icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-img">', temp: "30°", rain: "20%" },
  ];
  
  // Data prakiraan harian
  const dailyData = [
    {
      day: "Jumat, 25 April",
      icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-daily-img">',
      desc: "Sebagian Hujan",
      temp: "32°C",
      wind: "Angin pada 15 hingga 25 km/jam",
    },
    {
      day: "Sabtu, 26 April",
      icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-daily-img">',
      desc: "Cerah",
      temp: "32°C",
      wind: "Angin pada 15 hingga 25 km/jam",
    },
    {
      day: "Minggu, 27 April",
      icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-daily-img">',
      desc: "Hujan",
      temp: "32°C",
      wind: "Angin pada 15 hingga 25 km/jam",
    },
    {
      day: "Senin, 28 April",
      icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-daily-img">',
      desc: "Cerah Berawan",
      temp: "30°C",
      wind: "Angin pada 15 hingga 25 km/jam",
    },
    {
      day: "Selasa, 29 April",
      icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-daily-img">',
      desc: "Hujan",
      temp: "30°C",
      wind: "Angin pada 15 hingga 25 km/jam",
    },
    {
        day: "Rabu, 30 April",
        icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-daily-img">',
        desc: "Hujan",
        temp: "30°C",
        wind: "Angin pada 15 hingga 25 km/jam",
      },
    {
        day: "Kamis, 31 April",
        icon: '<img src="assets/cerah.png" alt="cloudy" class="icon-daily-img">',
        desc: "Hujan",
        temp: "30°C",
        wind: "Angin pada 15 hingga 25 km/jam",
    },
  ];
  
  // Render prakiraan per jam
  const hourlySlider = document.getElementById("hourlySlider");
  
  hourlyData.forEach((hour) => {
    const card = document.createElement("div");
    card.classList.add("hour-card");
    card.innerHTML = `
      <div class="time">${hour.time}</div>
      <div class="icon">${hour.icon}</div>
      <div class="temp">${hour.temp}</div>
      <div class="rain">💧 ${hour.rain}</div>
    `;
    hourlySlider.appendChild(card);
  });
  
  // Slider geser kanan kiri
  const btnLeft = document.querySelector(".arrow-left");
  const btnRight = document.querySelector(".arrow-right");
  const cardWidth = 80 + 12; // lebar kartu + margin kiri kanan
  let currentPosition = 0;
  
  btnLeft.addEventListener("click", () => {
    currentPosition += cardWidth * 2; // geser 2 kartu
    if (currentPosition > 0) currentPosition = 0;
    hourlySlider.style.transform = `translateX(${currentPosition}px)`;
  });
  
  btnRight.addEventListener("click", () => {
    const maxScroll = -(hourlySlider.scrollWidth - hourlySlider.parentElement.offsetWidth);
    currentPosition -= cardWidth * 2;
    if (currentPosition < maxScroll) currentPosition = maxScroll;
    hourlySlider.style.transform = `translateX(${currentPosition}px)`;
  });
  
  
  // Render prakiraan harian dengan slider geser
const dailyForecast = document.getElementById("dailyForecast");

// Render kartu harian
dailyData.forEach((day) => {
  const card = document.createElement("div");
  card.classList.add("daily-card");
  card.innerHTML = `
    <div class="day">${day.day}</div>
    <div class="icon">${day.icon}</div>
    <div class="desc">${day.desc}</div>
    <div class="temp">${day.temp}</div>
    <div class="wind">${day.wind}</div>
  `;
  dailyForecast.appendChild(card);
});

// Tombol geser kiri dan kanan untuk daily forecast
const btnLeftDaily = document.querySelector(".arrow-left-day");
const btnRightDaily = document.querySelector(".arrow-right-day");
const cardWidthDaily = 130 + 15; // lebar kartu + margin (sesuaikan dengan CSS)
let currentPositionDaily = 0;

btnLeftDaily.addEventListener("click", () => {
  currentPositionDaily += cardWidthDaily * 2; // geser 2 kartu
  if (currentPositionDaily > 0) currentPositionDaily = 0;
  dailyForecast.style.transform = `translateX(${currentPositionDaily}px)`;
});

btnRightDaily.addEventListener("click", () => {
  const maxScrollDaily = -(dailyForecast.scrollWidth - dailyForecast.parentElement.offsetWidth);
  currentPositionDaily -= cardWidthDaily * 2;
  if (currentPositionDaily < maxScrollDaily) currentPositionDaily = maxScrollDaily;
  dailyForecast.style.transform = `translateX(${currentPositionDaily}px)`;
});

  
  // Fungsi dummy update weather
  function updateWeather() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
      alert("Masukkan nama kota terlebih dahulu!");
      return;
    }
    alert(`Fitur pencarian untuk kota ${city} akan dikembangkan.`);
}
/* RESPONSIF */
//Toggle class active
const topNav = document.querySelector('.top-menu')

//Hamburger menu di klik
document.querySelector('#hamburger-menu').onclick =()=>{
    topNav.classList.toggle('active');
};

//klik diluar untuk menghilangkan sidebar
const Hamburger = document.querySelector('#hamburger-menu');

document.addEventListener('click', function(e){
    if(!Hamburger.contains(e.target) && !topNav.contains(e.target)){
        topNav.classList.remove('active');
    }
})

/* selesai responsif */  
/* CHATBOT PAGE */
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatContainer = document.getElementById("chatContainer");

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") sendMessage();
});

function addChatMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "user" ? "chat-msg user" : "chat-msg bot";
  msgDiv.textContent = text;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addChatMessage("user", message);
  userInput.value = "";

  fetch("http://localhost:5000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  })
    .then((res) => res.json())
    .then((data) => {
      addChatMessage("bot", data.reply);
    })
    .catch((err) => {
      console.error("Error:", err);
      addChatMessage("bot", "Terjadi kesalahan. Silakan coba lagi nanti.");
    });
}
