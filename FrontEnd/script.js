/* OPEN WEATHER MAP */

document.addEventListener("DOMContentLoaded", () => {
    const API_KEY = "72f221c6382758fe32c8bd07a1c023d7"; // Your OpenWeatherMap API Key

    // HTML Element Selectors
    const cityInputElement = document.getElementById("cityInput");
    const searchButtonElement = document.querySelector(".search-btn");
    const weatherIconElement = document.querySelector(".weather-icon img");
    const temperatureElement = document.querySelector(".temperature");
    const descriptionElement = document.querySelector(".sidebar .desc");
    const dateElement = document.querySelector(".date");
    const locationElement = document.querySelector(".location");

    const humidityElement = document.querySelector(".cards .card:nth-child(1) .card-value");
    const windElement = document.querySelector(".cards .card:nth-child(2) .card-value");
    const uvIndexElement = document.querySelector(".cards .card:nth-child(3) .card-value");

    const sunriseElement = document.querySelector(".sun-info span:nth-child(1)");
    const sunsetElement = document.querySelector(".sun-info span:nth-child(2)");
    const sunElement = document.querySelector(".sun-path .sun");

    const hourlySliderElement = document.getElementById("hourlySlider");
    const dailyForecastElement = document.getElementById("dailyForecast");

    // --- Console log untuk verifikasi elemen awal ---
    console.log("Initial Elements Check:");
    console.log("cityInputElement:", cityInputElement);
    console.log("hourlySliderElement:", hourlySliderElement);
    console.log("dailyForecastElement:", dailyForecastElement);
    // --- Akhir console log verifikasi elemen awal ---

    // --- Helper Functions ---
    function mpsToKmh(mps) {
        return Math.round(mps * 3.6);
    }

    function formatUnixTimestamp(timestamp, timezoneOffsetSeconds, format = "datetime") {
        const localTimestampMs = (timestamp + timezoneOffsetSeconds) * 1000;
        const date = new Date(localTimestampMs);
        const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' };

        if (format === "time") return date.toLocaleTimeString("id-ID", optionsTime);
        if (format === "date") return date.toLocaleDateString("id-ID", optionsDate);
        if (format === "day") return date.toLocaleDateString("id-ID", { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
        return date.toLocaleDateString("id-ID", optionsDate);
    }

    function getWeatherIconUrl(iconCode, size = "@2x") {
        return `https://openweathermap.org/img/wn/${iconCode}${size}.png`;
    }

    function getUvIndexDescription(uvi) {
        if (uvi === null || uvi === undefined) return "-- (N/A)";
        const uviValue = parseFloat(uvi);
        if (uviValue <= 2) return `${uviValue.toFixed(1)} (Rendah)`;
        if (uviValue <= 5) return `${uviValue.toFixed(1)} (Sedang)`;
        if (uviValue <= 7) return `${uviValue.toFixed(1)} (Tinggi)`;
        if (uviValue <= 10) return `${uviValue.toFixed(1)} (Sangat Tinggi)`;
        return `${uviValue.toFixed(1)} (Ekstrem)`;
    }

    function updateSunPosition(sunriseTimestamp, sunsetTimestamp, currentTimestamp, timezoneOffsetSeconds) {
        if (!sunElement) return;
        const nowLocalMs = (currentTimestamp + timezoneOffsetSeconds) * 1000;
        const sunriseLocalMs = (sunriseTimestamp + timezoneOffsetSeconds) * 1000;
        const sunsetLocalMs = (sunsetTimestamp + timezoneOffsetSeconds) * 1000;

        if (nowLocalMs < sunriseLocalMs || nowLocalMs > sunsetLocalMs) {
            sunElement.style.left = nowLocalMs < sunriseLocalMs ? "0%" : "100%";
            sunElement.style.opacity = "0.5";
            return;
        }
        sunElement.style.opacity = "1";
        const totalDaylight = sunsetLocalMs - sunriseLocalMs;
        const timeSinceSunrise = nowLocalMs - sunriseLocalMs;
        let percentage = (timeSinceSunrise / totalDaylight) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        sunElement.style.left = `${percentage}%`;
    }

    // --- UI Update Functions ---
    function displayCurrentWeather(data, cityName, timezoneOffsetSeconds, uviValue = null) {
        if (!data || !data.weather) {
            console.error("Invalid current weather data:", data);
            return;
        }
        if (weatherIconElement) {
            weatherIconElement.src = getWeatherIconUrl(data.weather[0].icon, "@4x");
            weatherIconElement.alt = data.weather[0].description;
        }
        if (temperatureElement) temperatureElement.innerHTML = `${Math.round(data.main.temp)} <span>°C</span>`;
        if (descriptionElement) descriptionElement.textContent = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
        if (dateElement) dateElement.textContent = formatUnixTimestamp(data.dt, timezoneOffsetSeconds, "date");
        if (locationElement) locationElement.textContent = `📍 ${cityName.toUpperCase()}`;
        if (humidityElement) humidityElement.textContent = `${data.main.humidity}%`;
        if (windElement) windElement.textContent = `${mpsToKmh(data.wind.speed)} KM/J`;
        if (uvIndexElement) uvIndexElement.textContent = getUvIndexDescription(uviValue);
        if (sunriseElement) sunriseElement.innerHTML = `Terbit<br>${formatUnixTimestamp(data.sys.sunrise, timezoneOffsetSeconds, "time")}`;
        if (sunsetElement) sunsetElement.innerHTML = `Terbenam<br>${formatUnixTimestamp(data.sys.sunset, timezoneOffsetSeconds, "time")}`;
        updateSunPosition(data.sys.sunrise, data.sys.sunset, data.dt, timezoneOffsetSeconds);
    }

    function displayHourlyForecast(forecastItems, timezoneOffsetSeconds) {
        if (!forecastItems || !hourlySliderElement) {
            if (hourlySliderElement) hourlySliderElement.innerHTML = "<p>Data prakiraan per jam tidak tersedia.</p>";
            return;
        }
        hourlySliderElement.innerHTML = "";
        forecastItems.slice(0, 8).forEach(item => { // Ambil 8 item = 24 jam (karena data per 3 jam)
            const card = document.createElement("div");
            card.classList.add("hour-card");
            const description = item.weather[0].description.charAt(0).toUpperCase() + item.weather[0].description.slice(1);
            card.innerHTML = `
                <div class="time">${formatUnixTimestamp(item.dt, timezoneOffsetSeconds, "time")}</div>
                <div class="icon"><img src="${getWeatherIconUrl(item.weather[0].icon, "")}" alt="${description}" class="icon-img"></div>
                <div class="desc-hourly">${description}</div>
                <div class="temp">${Math.round(item.main.temp)}°</div>
                <div class="rain">💧 ${Math.round(item.pop * 100)}%</div>
            `;
            hourlySliderElement.appendChild(card);
        });
        currentPositionHourly = 0; // Reset posisi slider
        if (hourlySliderElement) hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
        console.log("[HOURLY] Prakiraan per jam selesai ditampilkan, kartu ditambahkan:", hourlySliderElement.children.length);
    }

    function displayDailyForecast(forecastItems, timezoneOffsetSeconds) {
        if (!forecastItems || !dailyForecastElement) {
            if (dailyForecastElement) dailyForecastElement.innerHTML = "<p>Data prakiraan harian tidak tersedia.</p>";
            return;
        }
        const dailyDataAggregated = {};
        forecastItems.forEach(item => {
            const dateKey = formatUnixTimestamp(item.dt, timezoneOffsetSeconds, "date").split(", ")[1];
            if (!dailyDataAggregated[dateKey]) {
                dailyDataAggregated[dateKey] = {
                    minTemps: [], maxTemps: [], weatherConditions: [], windSpeeds: [], dtForDay: item.dt
                };
            }
            dailyDataAggregated[dateKey].minTemps.push(item.main.temp_min);
            dailyDataAggregated[dateKey].maxTemps.push(item.main.temp_max);
            dailyDataAggregated[dateKey].weatherConditions.push({ icon: item.weather[0].icon, description: item.weather[0].description });
            dailyDataAggregated[dateKey].windSpeeds.push(item.wind.speed);
            const itemHour = new Date((item.dt + timezoneOffsetSeconds) * 1000).getUTCHours();
            if (itemHour >= 11 && itemHour <= 14) { // Coba ambil kondisi cuaca tengah hari
                 dailyDataAggregated[dateKey].representativeWeather = { icon: item.weather[0].icon, description: item.weather[0].description };
                 dailyDataAggregated[dateKey].dtForDay = item.dt;
            }
        });
        dailyForecastElement.innerHTML = "";
        let daysCount = 0;
        const todayDateKey = formatUnixTimestamp(Date.now()/1000, timezoneOffsetSeconds, "date").split(", ")[1];
        for (const dateKey in dailyDataAggregated) {
            if (dateKey === todayDateKey) continue;
            if (daysCount >= 7) break; // Tampilkan maks 7 hari
            const dayEntry = dailyDataAggregated[dateKey];
            const minTemp = Math.round(Math.min(...dayEntry.minTemps));
            const maxTemp = Math.round(Math.max(...dayEntry.maxTemps));
            const avgWind = mpsToKmh(dayEntry.windSpeeds.reduce((a, b) => a + b, 0) / dayEntry.windSpeeds.length);
            const weather = dayEntry.representativeWeather || dayEntry.weatherConditions[0]; // Fallback ke kondisi pertama jika tidak ada yang representatif
            const description = weather.description.charAt(0).toUpperCase() + weather.description.slice(1);
            const card = document.createElement("div");
            card.classList.add("daily-card");
            card.innerHTML = `
                <div class="day">${formatUnixTimestamp(dayEntry.dtForDay, timezoneOffsetSeconds, "day")}</div>
                <div class="icon"><img src="${getWeatherIconUrl(weather.icon, "@2x")}" alt="${description}" class="icon-daily-img"></div>
                <div class="desc">${description}</div>
                <div class="temp">${minTemp}°/${maxTemp}°C</div>
                <div class="wind">Angin ${avgWind} km/j</div>
            `;
            dailyForecastElement.appendChild(card);
            daysCount++;
        }
        currentPositionDaily = 0; // Reset posisi slider
        if (dailyForecastElement) dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
        console.log("[DAILY] Prakiraan harian selesai ditampilkan, kartu ditambahkan:", dailyForecastElement.children.length);
    }

    // --- API Fetching ---
    async function getWeatherData(cityName) {
        const cityToFetch = cityName;
        if (!cityToFetch) {
            alert("Nama kota tidak valid atau tidak tersedia untuk memuat cuaca.");
            return;
        }
        if (cityInputElement) {
            cityInputElement.value = cityToFetch;
        }
        console.log(`[API] Memulai pengambilan data untuk kota: ${cityToFetch}`);

        let lat, lon, displayName;
        try {
            const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityToFetch)}&limit=1&appid=${API_KEY}`);
            if (!geoResponse.ok) throw new Error(`Kota tidak ditemukan (GeoAPI): ${geoResponse.status} - ${cityToFetch}`);
            const geoData = await geoResponse.json();
            if (geoData.length === 0) {
                alert(`Kota "${cityToFetch}" tidak ditemukan via OpenWeatherMap Geocoding.`);
                console.warn(`[API] Kota tidak ditemukan (GeoAPI): ${cityToFetch}`);
                return;
            }
            lat = geoData[0].lat;
            lon = geoData[0].lon;
            displayName = geoData[0].name;
            console.log(`[API] Koordinat untuk ${displayName}: Lat=${lat}, Lon=${lon}`);
        } catch (error) {
            console.error("[API] Error fetching coordinates:", error);
            alert(`Gagal mendapatkan data lokasi untuk ${cityToFetch}: ${error.message}`);
            return;
        }

        try {
            const [currentWeatherResponse, forecastResponse, uvResponse] = await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`),
                fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`),
                fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`).catch(e => { console.warn("[API] Panggilan API UV gagal.", e); return null;})
            ]);

            if (!currentWeatherResponse.ok) throw new Error(`Cuaca saat ini: ${currentWeatherResponse.statusText} (${currentWeatherResponse.status})`);
            if (!forecastResponse.ok) throw new Error(`Prakiraan: ${forecastResponse.statusText} (${forecastResponse.status})`);

            const currentWeatherData = await currentWeatherResponse.json();
            const forecastData = await forecastResponse.json();
            let uviValue = null;
            if (uvResponse && uvResponse.ok) {
                const uvData = await uvResponse.json();
                uviValue = uvData.value;
            } else if(uvResponse) {
                 console.warn(`[API] Gagal mengambil data UV: ${uvResponse.statusText} (${uvResponse.status})`);
            }
            console.log("[API] Data cuaca berhasil diambil.");

            const timezoneOffsetSeconds = currentWeatherData.timezone;
            displayCurrentWeather(currentWeatherData, displayName, timezoneOffsetSeconds, uviValue);
            displayHourlyForecast(forecastData.list, timezoneOffsetSeconds);
            displayDailyForecast(forecastData.list, timezoneOffsetSeconds);
        } catch (error) {
            console.error("[API] Error fetching weather data:", error);
            alert(`Gagal mendapatkan data cuaca untuk ${displayName}: ${error.message}`);
        }
    }

    async function getCityFromIP() {
        try {
            console.log("[IPGEO] Mencoba mendapatkan kota dari IP...");
            const response = await fetch('https://ip-api.com/json/?fields=status,city,message');
            if (!response.ok) {
                throw new Error(`IP Geolocation request failed with status ${response.status}`);
            }
            const data = await response.json();
            if (data.status === 'success' && data.city) {
                console.log("[IPGEO] Kota terdeteksi dari IP:", data.city);
                return data.city;
            } else {
                console.warn("[IPGEO] Tidak dapat menentukan kota dari IP. API Response:", data.message || data);
                return null;
            }
        } catch (error) {
            console.error("[IPGEO] Error fetching city by IP:", error);
            return null;
        }
    }

    async function initializeWeather() {
        const cityFromIP = await getCityFromIP();
        if (cityFromIP) {
            getWeatherData(cityFromIP);
        } else {
            console.log("[INIT] Gagal deteksi IP, menggunakan kota default (Malang).");
            getWeatherData("Malang");
        }
    }

    // --- Event Listeners ---
    searchButtonElement?.addEventListener("click", () => {
        const cityTyped = cityInputElement.value.trim();
        if (cityTyped) {
            getWeatherData(cityTyped);
        } else {
            alert("Masukkan nama kota terlebih dahulu!");
        }
    });

    cityInputElement?.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            const cityTyped = cityInputElement.value.trim();
            if (cityTyped) {
                getWeatherData(cityTyped);
            } else {
                alert("Masukkan nama kota terlebih dahulu!");
            }
        }
    });

    // --- SLIDER LOGIC (HOURLY) ---
    let currentPositionHourly = 0;
    const btnLeftHourly = document.querySelector(".hourly-forecast .arrow-left");
    const btnRightHourly = document.querySelector(".hourly-forecast .arrow-right");
    const getCardWidthHourly = () => {
        const card = hourlySliderElement?.querySelector('.hour-card');
        const width = card?.offsetWidth || 90; // fallback width
        // console.log('[SLIDER-H] getCardWidthHourly - card:', card, 'width:', width);
        return width + 12; // 12 adalah gap
    }

    console.log("Slider Buttons Check (Hourly):"); // Verifikasi tombol slider
    console.log("btnLeftHourly:", btnLeftHourly);
    console.log("btnRightHourly:", btnRightHourly);

    btnLeftHourly?.addEventListener("click", () => {
        console.log('[SLIDER-H] Tombol KIRI per jam diklik');
        if (!hourlySliderElement || hourlySliderElement.children.length === 0) {
            console.error('[SLIDER-H] Elemen slider per jam tidak ditemukan atau tidak ada kartu.');
            return;
        }
        const cardScrollWidth = getCardWidthHourly();
        console.log('[SLIDER-H KIRI]', {
            childrenCount: hourlySliderElement.children.length,
            cardScrollWidth: cardScrollWidth,
            currentPositionBefore: currentPositionHourly
        });

        currentPositionHourly += cardScrollWidth * 2; // Geser 2 kartu
        if (currentPositionHourly > 0) {
            currentPositionHourly = 0;
            console.log('[SLIDER-H KIRI] Disesuaikan ke posisi 0.');
        }
        console.log('[SLIDER-H KIRI] currentPositionAfter:', currentPositionHourly);
        hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
    });

    btnRightHourly?.addEventListener("click", () => {
        console.log('[SLIDER-H] Tombol KANAN per jam diklik');
        if (!hourlySliderElement || !hourlySliderElement.parentElement || hourlySliderElement.children.length === 0) {
            console.error('[SLIDER-H] Elemen slider per jam tidak ditemukan, parent tidak ada, atau tidak ada kartu.');
            return;
        }

        const cardScrollWidth = getCardWidthHourly();
        const containerWidth = hourlySliderElement.parentElement.offsetWidth;
        const totalCardsScrollWidth = hourlySliderElement.scrollWidth;
        const maxScroll = -(totalCardsScrollWidth - containerWidth);

        console.log('[SLIDER-H KANAN]', {
            childrenCount: hourlySliderElement.children.length,
            cardScrollWidth: cardScrollWidth,
            containerWidth: containerWidth,
            totalCardsScrollWidth: totalCardsScrollWidth,
            calculatedMaxScroll: maxScroll,
            currentPositionBefore: currentPositionHourly
        });

        if (totalCardsScrollWidth <= containerWidth) {
            console.log('[SLIDER-H KANAN] Konten pas di kontainer, tidak perlu scroll atau reset ke 0.');
            currentPositionHourly = 0;
        } else {
            currentPositionHourly -= cardScrollWidth * 2;
            if (currentPositionHourly < maxScroll) {
                currentPositionHourly = maxScroll;
                console.log('[SLIDER-H KANAN] Disesuaikan ke maxScroll.');
            }
        }
        console.log('[SLIDER-H KANAN] currentPositionAfter:', currentPositionHourly);
        hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
    });


    // --- SLIDER LOGIC (DAILY) ---
    let currentPositionDaily = 0;
    const btnLeftDaily = document.querySelector(".daily-forecast .arrow-left-day");
    const btnRightDaily = document.querySelector(".daily-forecast .arrow-right-day");
    const getCardWidthDaily = () => {
        const card = dailyForecastElement?.querySelector('.daily-card');
        const width = card?.offsetWidth || 180; // fallback width
        // console.log('[SLIDER-D] getCardWidthDaily - card:', card, 'width:', width);
        return width + 15; // 15 adalah gap
    }

    console.log("Slider Buttons Check (Daily):"); // Verifikasi tombol slider
    console.log("btnLeftDaily:", btnLeftDaily);
    console.log("btnRightDaily:", btnRightDaily);

    btnLeftDaily?.addEventListener("click", () => {
        console.log('[SLIDER-D] Tombol KIRI harian diklik');
        if (!dailyForecastElement || dailyForecastElement.children.length === 0) {
            console.error('[SLIDER-D] Elemen slider harian tidak ditemukan atau tidak ada kartu.');
            return;
        }
        const cardScrollWidth = getCardWidthDaily();
        console.log('[SLIDER-D KIRI]', {
            childrenCount: dailyForecastElement.children.length,
            cardScrollWidth: cardScrollWidth,
            currentPositionBefore: currentPositionDaily
        });

        currentPositionDaily += cardScrollWidth * 2;
        if (currentPositionDaily > 0) {
            currentPositionDaily = 0;
            console.log('[SLIDER-D KIRI] Disesuaikan ke posisi 0.');
        }
        console.log('[SLIDER-D KIRI] currentPositionAfter:', currentPositionDaily);
        dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
    });

    btnRightDaily?.addEventListener("click", () => {
        console.log('[SLIDER-D] Tombol KANAN harian diklik');
        if (!dailyForecastElement || !dailyForecastElement.parentElement || dailyForecastElement.children.length === 0) {
            console.error('[SLIDER-D] Elemen slider harian tidak ditemukan, parent tidak ada, atau tidak ada kartu.');
            return;
        }

        const cardScrollWidth = getCardWidthDaily();
        const containerWidth = dailyForecastElement.parentElement.offsetWidth;
        const totalCardsScrollWidth = dailyForecastElement.scrollWidth;
        const maxScroll = -(totalCardsScrollWidth - containerWidth);

        console.log('[SLIDER-D KANAN]', {
            childrenCount: dailyForecastElement.children.length,
            cardScrollWidth: cardScrollWidth,
            containerWidth: containerWidth,
            totalCardsScrollWidth: totalCardsScrollWidth,
            calculatedMaxScroll: maxScroll,
            currentPositionBefore: currentPositionDaily
        });

        if (totalCardsScrollWidth <= containerWidth) {
            console.log('[SLIDER-D KANAN] Konten pas di kontainer, tidak perlu scroll atau reset ke 0.');
            currentPositionDaily = 0;
        } else {
            currentPositionDaily -= cardScrollWidth * 2;
            if (currentPositionDaily < maxScroll) {
                currentPositionDaily = maxScroll;
                console.log('[SLIDER-D KANAN] Disesuaikan ke maxScroll.');
            }
        }
        console.log('[SLIDER-D KANAN] currentPositionAfter:', currentPositionDaily);
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

    initializeWeather(); // Memulai dengan deteksi IP atau default
});