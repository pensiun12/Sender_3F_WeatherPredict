/* WEATHER API */

document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "996e389b36e047b5812114744253005"; // Your WeatherAPI.com API Key

  // HTML Element Selectors from your homepage.html
  const cityInputElement = document.getElementById("cityInput");
  const searchButtonElement = document.querySelector(".search-btn");
  const weatherIconElement = document.querySelector(".weather-icon img");
  const temperatureElement = document.querySelector(".temperature");
  const descriptionElement = document.querySelector(".desc");
  const dateElement = document.querySelector(".date");
  const locationElement = document.querySelector(".location");

  const humidityElement = document.querySelector(".cards .card:nth-child(1) .card-value");
  const windElement = document.querySelector(".cards .card:nth-child(2) .card-value");
  const uvIndexElement = document.querySelector(".cards .card:nth-child(3) .card-value");

  const sunriseElement = document.querySelector(".sun-info span:nth-child(1)");
  const sunsetElement = document.querySelector(".sun-info span:nth-child(2)");
  const sunElement = document.querySelector(".sun-path .sun-curve .sun");

  const hourlySliderElement = document.getElementById("hourlySlider");
  const dailyForecastElement = document.getElementById("dailyForecast");

  // --- Helper Functions ---

  function formatUnixTimestamp(timestamp, timezoneOffsetSeconds, format = "datetime") {
    const date = new Date((timestamp + timezoneOffsetSeconds) * 1000);
    const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' };

    if (format === "time") {
      return date.toLocaleTimeString("id-ID", optionsTime);
    }
    if (format === "date_full") { // For the main date display
      return date.toLocaleDateString("id-ID", optionsDate);
    }
    if (format === "day") { // For daily forecast cards
      return date.toLocaleDateString("id-ID", { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
    }
    return date.toLocaleDateString("id-ID", optionsDate) + " " + date.toLocaleTimeString("id-ID", optionsTime);
  }
  
  function formatWeatherApiTimeToHHMM(timeStr) { // e.g., "06:30 AM" or "05:45 PM"
    if (!timeStr || typeof timeStr !== 'string') return "--:--";
    const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!parts) return timeStr; // Return original if parsing fails

    let hours = parseInt(parts[1], 10);
    const minutes = parts[2];
    const modifier = parts[3].toUpperCase();

    if (modifier === 'PM' && hours !== 12) {
        hours += 12;
    } else if (modifier === 'AM' && hours === 12) { // Midnight case
        hours = 0;
    }
    return `${String(hours).padStart(2, '0')}:${minutes}`;
}


  function getWeatherApiIconUrl(iconPath) {
    if (!iconPath) return ""; // Return empty if no path
    // WeatherAPI icon paths are like //cdn.weatherapi.com/...
    return `https:${iconPath}`;
  }

  function getUvIndexDescription(uvi) {
    const uviValue = parseFloat(uvi);
    if (uviValue <= 2) return `${uviValue.toFixed(1)} (Rendah)`;
    if (uviValue <= 5) return `${uviValue.toFixed(1)} (Sedang)`;
    if (uviValue <= 7) return `${uviValue.toFixed(1)} (Tinggi)`;
    if (uviValue <= 10) return `${uviValue.toFixed(1)} (Sangat Tinggi)`;
    return `${uviValue.toFixed(1)} (Ekstrem)`;
  }

  function updateSunPosition(sunriseStr, sunsetStr, currentLocalEpoch, locationLocaltimeStr) {
    if (!sunElement || !sunriseStr || !sunsetStr || !locationLocaltimeStr) {
        if(sunElement) sunElement.style.opacity = "0";
        return;
    }

    const parseTimeToMillisecondsToday = (timeStr, dateReferenceStr) => {
        if (!timeStr || typeof timeStr !== 'string' || !dateReferenceStr) return null;
        
        const datePart = dateReferenceStr.split(' ')[0]; // Extracts "YYYY-MM-DD"
        const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!parts) return null;

        let hours = parseInt(parts[1], 10);
        const minutes = parseInt(parts[2], 10);
        const modifier = parts[3].toUpperCase();

        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0; // Midnight

        const dateObj = new Date(`${datePart}T00:00:00`); // Use local timezone of browser
        dateObj.setHours(hours, minutes, 0, 0);
        return dateObj.getTime();
    };

    const sunriseTimeMs = parseTimeToMillisecondsToday(sunriseStr, locationLocaltimeStr);
    const sunsetTimeMs = parseTimeToMillisecondsToday(sunsetStr, locationLocaltimeStr);
    const nowMs = currentLocalEpoch * 1000; // currentLocalEpoch is already for the location's time

    if (sunriseTimeMs === null || sunsetTimeMs === null || nowMs < sunriseTimeMs || nowMs > sunsetTimeMs) {
      sunElement.style.left = (nowMs < sunriseTimeMs) ? "0%" : "100%";
      sunElement.style.opacity = "0.5";
      sunElement.style.bottom = "0%";
      return;
    }
    sunElement.style.opacity = "1";

    const totalDaylight = sunsetTimeMs - sunriseTimeMs;
    const timeSinceSunrise = nowMs - sunriseTimeMs;
    let percentage = (timeSinceSunrise / totalDaylight) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    sunElement.style.left = `${percentage}%`;
    const x = percentage / 100;
    const yPercentage = 4 * 0.7 * (x - x * x) * 100;
    sunElement.style.bottom = `${yPercentage}%`;
  }

  // --- UI Update Functions ---
  function displayCurrentWeather(data) {
    const { current, location, forecast } = data;

    if (!current || !location || !forecast) {
      console.error("Invalid weather data for current weather:", data);
      alert("Tidak dapat menampilkan cuaca saat ini karena data tidak lengkap.");
      return;
    }

    weatherIconElement.src = getWeatherApiIconUrl(current.condition.icon);
    weatherIconElement.alt = current.condition.text;
    temperatureElement.innerHTML = `${Math.round(current.temp_c)} <span>°C</span>`;
    descriptionElement.textContent = current.condition.text;
    
    // Use location.localtime_epoch for the main date display
    const currentDate = new Date(location.localtime_epoch * 1000);
    dateElement.textContent = currentDate.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    locationElement.textContent = `📍 ${location.name.toUpperCase()}`;

    humidityElement.textContent = `${current.humidity}%`;
    windElement.textContent = `${Math.round(current.wind_kph)} KM/J`;
    uvIndexElement.textContent = getUvIndexDescription(current.uv);

    const todayAstro = forecast.forecastday[0].astro;
    sunriseElement.innerHTML = `Terbit<br>${formatWeatherApiTimeToHHMM(todayAstro.sunrise)}`;
    sunsetElement.innerHTML = `Terbenam<br>${formatWeatherApiTimeToHHMM(todayAstro.sunset)}`;
    updateSunPosition(todayAstro.sunrise, todayAstro.sunset, location.localtime_epoch, location.localtime);
  }

  function displayHourlyForecast(data, timezoneOffsetSeconds) {
    const { forecast } = data;
    if (!forecast || !forecast.forecastday || !forecast.forecastday[0] || !forecast.forecastday[0].hour) {
      console.error("Invalid weather data for hourly forecast:", data);
      hourlySliderElement.innerHTML = "<p>Prakiraan per jam tidak tersedia.</p>";
      return;
    }

    const hourly = forecast.forecastday[0].hour; // Hourly data for the current day
    hourlySliderElement.innerHTML = ""; 

    hourly.forEach(hour => {
      const card = document.createElement("div");
      card.classList.add("hour-card");
      card.innerHTML = `
        <div class="time">${formatUnixTimestamp(hour.time_epoch, timezoneOffsetSeconds, "time")}</div>
        <div class="icon"><img src="${getWeatherApiIconUrl(hour.condition.icon)}" alt="${hour.condition.text}" class="icon-img"></div>
        <div class="temp">${Math.round(hour.temp_c)}°</div>
        <div class="rain">💧 ${hour.chance_of_rain}%</div>
      `;
      hourlySliderElement.appendChild(card);
    });
    currentPositionHourly = 0;
    hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
  }

  function displayDailyForecast(data, timezoneOffsetSeconds) {
    const { forecast } = data;
    if (!forecast || !forecast.forecastday) {
      console.error("Invalid weather data for daily forecast:", data);
      dailyForecastElement.innerHTML = "<p>Prakiraan harian tidak tersedia.</p>";
      return;
    }

    const daily = forecast.forecastday; // Array of daily forecasts (e.g., 3 days)
    dailyForecastElement.innerHTML = ""; 

    daily.forEach(dayEntry => {
      const day = dayEntry.day;
      const card = document.createElement("div");
      card.classList.add("daily-card");
      card.innerHTML = `
        <div class="day">${formatUnixTimestamp(dayEntry.date_epoch, timezoneOffsetSeconds, "day")}</div>
        <div class="icon"><img src="${getWeatherApiIconUrl(day.condition.icon)}" alt="${day.condition.text}" class="icon-daily-img"></div>
        <div class="desc">${day.condition.text}</div>
        <div class="temp">${Math.round(day.mintemp_c)}°/${Math.round(day.maxtemp_c)}°C</div>
        <div class="wind">Angin ${Math.round(day.maxwind_kph)} km/j</div>
      `;
      dailyForecastElement.appendChild(card);
    });
    currentPositionDaily = 0;
    dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
  }

  // --- API Fetching ---
  async function getWeatherData(city) {
    if (!city) {
      alert("Masukkan nama kota terlebih dahulu!");
      return;
    }

    temperatureElement.innerHTML = `-- <span>°C</span>`;
    descriptionElement.textContent = "Memuat data...";
    locationElement.textContent = `📍 MEMUAT LOKASI...`;
    humidityElement.textContent = `--%`;
    windElement.textContent = `-- KM/J`;
    uvIndexElement.textContent = `--`;
    sunriseElement.innerHTML = `Terbit<br>--:--`;
    sunsetElement.innerHTML = `Terbenam<br>--:--`;
    if(sunElement) sunElement.style.opacity = "0";
    hourlySliderElement.innerHTML = `<p style="text-align: center; width: 100%;">Memuat prakiraan per jam...</p>`;
    dailyForecastElement.innerHTML = `<p style="text-align: center; width: 100%;">Memuat prakiraan harian...</p>`;
    
    // Request 3 days of forecast (includes current day)
    const forecastDays = 3; 
    const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=${forecastDays}&aqi=no&alerts=no&lang=id`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Respon error tidak valid." }})); // Catch if error response is not JSON
        throw new Error(errorData.error?.message || `Kota tidak ditemukan atau masalah jaringan: ${response.status}`);
      }
      const weatherData = await response.json();

      if (!weatherData.current || !weatherData.location || !weatherData.forecast) {
          throw new Error("Format data cuaca tidak sesuai.");
      }

      // Calculate timezoneOffsetSeconds for formatting epoch times from forecast if needed
      // location.localtime_epoch is local, current.last_updated_epoch is UTC
      // This offset helps convert UTC epoch times from forecast into local time
      const timezoneOffsetSeconds = weatherData.location.localtime_epoch - weatherData.current.last_updated_epoch;

      displayCurrentWeather(weatherData);
      displayHourlyForecast(weatherData, timezoneOffsetSeconds);
      displayDailyForecast(weatherData, timezoneOffsetSeconds);

    } catch (error) {
      console.error("Error fetching weather data:", error);
      alert(`Gagal mendapatkan data cuaca: ${error.message}`);
      descriptionElement.textContent = "Gagal memuat data.";
      locationElement.textContent = "Gagal memuat lokasi";
    }
  }

  // --- Event Listeners and Initial Load ---
  searchButtonElement?.addEventListener("click", () => {
    const city = cityInputElement.value.trim();
    getWeatherData(city);
  });

  cityInputElement?.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      const city = cityInputElement.value.trim();
      getWeatherData(city);
      event.preventDefault(); 
    }
  });

  getWeatherData("Malang"); // Initial load

  // --- SLIDER LOGIC (HOURLY) ---
  const btnLeftHourly = document.querySelector(".hourly-forecast .arrow-left");
  const btnRightHourly = document.querySelector(".hourly-forecast .arrow-right");
  const cardWidthHourly = 80 + 10; // Adjust based on your .hour-card CSS (width + gap)
  let currentPositionHourly = 0;

  btnLeftHourly?.addEventListener("click", () => {
    if (!hourlySliderElement || !hourlySliderElement.parentElement) return;
    const visibleWidth = hourlySliderElement.parentElement.offsetWidth;
    const cardsToScroll = Math.max(1, Math.floor(visibleWidth / cardWidthHourly) -1) || 1;
    currentPositionHourly += cardWidthHourly * cardsToScroll;
    if (currentPositionHourly > 0) currentPositionHourly = 0;
    hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
  });

  btnRightHourly?.addEventListener("click", () => {
    if (!hourlySliderElement || !hourlySliderElement.parentElement) return;
    const visibleWidth = hourlySliderElement.parentElement.offsetWidth;
    const totalWidth = hourlySliderElement.scrollWidth;
    const maxScroll = -(totalWidth - visibleWidth);
    
    if (currentPositionHourly <= maxScroll || totalWidth <= visibleWidth) return; 

    const cardsToScroll = Math.max(1, Math.floor(visibleWidth / cardWidthHourly) -1) || 1;
    currentPositionHourly -= cardWidthHourly * cardsToScroll;
    if (currentPositionHourly < maxScroll) currentPositionHourly = maxScroll;
    hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
  });

  // --- SLIDER LOGIC (DAILY) ---
  const btnLeftDaily = document.querySelector(".daily-forecast .arrow-left-day");
  const btnRightDaily = document.querySelector(".daily-forecast .arrow-right-day");
  const cardWidthDaily = 180 + 15; // Adjust based on your .daily-card CSS (width + gap)
  let currentPositionDaily = 0;

  btnLeftDaily?.addEventListener("click", () => {
    if (!dailyForecastElement || !dailyForecastElement.parentElement) return;
    const visibleWidth = dailyForecastElement.parentElement.offsetWidth;
    const cardsToScroll = Math.max(1, Math.floor(visibleWidth / cardWidthDaily)-1) || 1;
    currentPositionDaily += cardWidthDaily * cardsToScroll;
    if (currentPositionDaily > 0) currentPositionDaily = 0;
    dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
  });

  btnRightDaily?.addEventListener("click", () => {
    if (!dailyForecastElement || !dailyForecastElement.parentElement) return;
    const visibleWidth = dailyForecastElement.parentElement.offsetWidth;
    const totalWidth = dailyForecastElement.scrollWidth;
    const maxScrollDaily = -(totalWidth - visibleWidth);

    if (currentPositionDaily <= maxScrollDaily || totalWidth <= visibleWidth) return;

    const cardsToScroll = Math.max(1, Math.floor(visibleWidth / cardWidthDaily)-1) || 1;
    currentPositionDaily -= cardWidthDaily * cardsToScroll;
    if (currentPositionDaily < maxScrollDaily) currentPositionDaily = maxScrollDaily;
    dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
  });

  // --- Hamburger Menu Toggle ---
  const topNav = document.querySelector('.top-menu');
  const hamburger = document.querySelector('#hamburger-menu');

  hamburger?.addEventListener("click", (e) => {
    e.stopPropagation(); 
    topNav?.classList.toggle('active');
  });

  document.addEventListener('click', function (e) {
    if (topNav && hamburger && !hamburger.contains(e.target) && !topNav.contains(e.target)) {
      topNav.classList.remove('active');
    }
  });
});