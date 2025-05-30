document.addEventListener("DOMContentLoaded", () => {
    const VC_API_KEY = "NPNY44GESYP2J87F3KZRLRTVR"; // API Key Visual Crossing Anda

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

    let globalSunriseEpoch, globalSunsetEpoch, globalTimezoneOffsetSeconds;
    let sunRealTimeUpdateInterval = null;
    let sunTimeElement = null;

    console.log("Initial Elements Check:");
    console.log("sunElement:", sunElement);

    if (sunElement && sunElement.parentElement) {
        sunTimeElement = document.createElement('div');
        sunTimeElement.id = 'sunTimeDisplay';
        sunTimeElement.classList.add('sun-time');
        sunElement.parentElement.insertBefore(sunTimeElement, sunElement);
        console.log("sunTimeElement created and added to DOM.");
    } else {
        console.error("Sun element or its parent not found. Cannot create sun time display.");
    }

    function formatUnixTimestamp(timestamp, timezoneOffsetSeconds, format = "datetime") {
        const localTimestampMs = (timestamp + timezoneOffsetSeconds) * 1000;
        const date = new Date(localTimestampMs);
        const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' };
        if (format === "time") return date.toLocaleTimeString("id-ID", optionsTime);
        if (format === "datetime_seconds") return date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' });
        if (format === "date") return date.toLocaleDateString("id-ID", optionsDate);
        if (format === "day") return date.toLocaleDateString("id-ID", { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
        return date.toLocaleDateString("id-ID", optionsDate);
    }

    function getLocalIconPath(vcIconName) {
        const basePath = "assets/";
        if (typeof vcIconName !== 'string') {
            console.warn("Nama ikon VC tidak valid untuk getLocalIconPath:", vcIconName);
            return basePath + "berawan.png";
        }
        const icon = vcIconName.toLowerCase();
        if (icon.includes('thunder')) return basePath + 'hujan petir.png';
        if (icon.includes('rain')) return basePath + 'hujan.png';
        if (icon.includes('showers')) return basePath + 'sebagian hujan.png';
        if (icon.includes('snow')) return basePath + 'berawan.png';
        if (icon.includes('fog')) return basePath + 'berawan.png';
        if (icon.includes('wind')) return basePath + 'angin.png';
        if (icon === 'partly-cloudy-day' || icon === 'partly-cloudy-night') return basePath + 'cerah berawan.png';
        if (icon === 'cloudy') return basePath + 'berawan.png';
        if (icon === 'clear-day' || icon === 'clear-night') return basePath + 'cerah.png';
        console.warn(`Tidak ada mapping ikon lokal untuk VC icon: ${vcIconName}, menggunakan default 'berawan.png'.`);
        return basePath + 'berawan.png';
    }

    function getIndonesianDescriptionFromVCIcon(vcIconName) {
        if (typeof vcIconName !== 'string') return "Cuaca tidak diketahui";
        const icon = vcIconName.toLowerCase();
        if (icon.includes('thunder')) return 'Hujan Petir';
        if (icon.includes('rain')) return 'Hujan';
        if (icon.includes('showers')) return 'Gerimis';
        if (icon.includes('snow')) return 'Salju';
        if (icon.includes('fog')) return 'Berkabut';
        if (icon.includes('wind')) return 'Berangin';
        if (icon === 'partly-cloudy-day' || icon === 'partly-cloudy-night') return 'Cerah Berawan';
        if (icon === 'cloudy') return 'Berawan';
        if (icon === 'clear-day' || icon === 'clear-night') return 'Cerah';
        return 'Cuaca Umum';
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

    function updateSunPositionAndRealTimeClock(sunriseTs, sunsetTs, currentTs, tzOffset) {
        if (!sunElement || !sunTimeElement) {
            console.warn("sunElement or sunTimeElement not found in updateSunPositionAndRealTimeClock");
            return;
        }

        const nowLocalMs = (currentTs + tzOffset) * 1000;
        const sunriseLocalMs = (sunriseTs + tzOffset) * 1000;
        const sunsetLocalMs = (sunsetTs + tzOffset) * 1000;
        
        let percentage;
        let isSunIconCurrentlyVisible = true; // Untuk mengatur opacity ikon matahari saja

        if (nowLocalMs < sunriseLocalMs) {
            percentage = 0;
            isSunIconCurrentlyVisible = false;
        } else if (nowLocalMs > sunsetLocalMs) {
            percentage = 100;
            isSunIconCurrentlyVisible = false;
        } else {
            const totalDaylight = sunsetLocalMs - sunriseLocalMs;
            const timeSinceSunrise = nowLocalMs - sunriseLocalMs;
            percentage = (timeSinceSunrise / totalDaylight) * 100;
            percentage = Math.max(0, Math.min(100, percentage));
            isSunIconCurrentlyVisible = true;
        }

        sunElement.style.left = `${percentage}%`;
        sunTimeElement.style.left = `${percentage}%`; // Waktu mengikuti posisi horizontal matahari

        const currentTimeDate = new Date();
        const hours = currentTimeDate.getHours().toString().padStart(2, '0');
        const minutes = currentTimeDate.getMinutes().toString().padStart(2, '0');
        const seconds = currentTimeDate.getSeconds().toString().padStart(2, '0');
        sunTimeElement.textContent = `${hours}:${minutes}:${seconds}`;

        // Atur opacity ikon matahari
        if (isSunIconCurrentlyVisible) {
            sunElement.style.opacity = "1";
        } else {
            sunElement.style.opacity = "0.3"; // Matahari meredup tapi tidak hilang
        }

        // Elemen waktu (sunTimeElement) akan selalu visible dan opaque 100%
        // jika sudah berhasil dimuat (diatur di displayCurrentWeather)
        // jadi tidak perlu mengubah opacity/visibility nya di sini lagi.
    }

    function startRealTimeSunUpdates() {
        if (sunRealTimeUpdateInterval) {
            clearInterval(sunRealTimeUpdateInterval);
        }

        if (globalSunriseEpoch === undefined || globalSunsetEpoch === undefined || globalTimezoneOffsetSeconds === undefined) {
            console.warn("Sunrise/sunset data not available to start real-time sun updates.");
            if(sunTimeElement) { // Sembunyikan jika data belum siap
                sunTimeElement.style.opacity = "0";
                sunTimeElement.style.visibility = "hidden";
            }
            return;
        }
        
        // Pastikan elemen waktu terlihat sebelum memulai interval
        if (sunTimeElement) {
            sunTimeElement.style.opacity = "1";
            sunTimeElement.style.visibility = "visible";
        }

        sunRealTimeUpdateInterval = setInterval(() => {
            const currentEpoch = Math.floor(Date.now() / 1000);
            updateSunPositionAndRealTimeClock(globalSunriseEpoch, globalSunsetEpoch, currentEpoch, globalTimezoneOffsetSeconds);
        }, 1000);
    }

    function displayCurrentWeather(currentConditions, resolvedAddress, timezoneOffsetSeconds) {
        if (!currentConditions) {
            console.error("Data cuaca saat ini tidak valid dari Visual Crossing:", currentConditions);
            if (descriptionElement) descriptionElement.textContent = "Data tidak tersedia";
            if (temperatureElement) temperatureElement.innerHTML = `-- <span>°C</span>`;
            if (weatherIconElement) weatherIconElement.src = getLocalIconPath('unknown-default');
            if (sunTimeElement) { // Sembunyikan waktu jika data tidak valid
                sunTimeElement.style.opacity = "0";
                sunTimeElement.style.visibility = "hidden";
            }
            return;
        }

        globalSunriseEpoch = currentConditions.sunriseEpoch;
        globalSunsetEpoch = currentConditions.sunsetEpoch;
        globalTimezoneOffsetSeconds = timezoneOffsetSeconds;

        const localIcon = getLocalIconPath(currentConditions.icon);
        const descriptiveText = getIndonesianDescriptionFromVCIcon(currentConditions.icon);

        if (weatherIconElement) {
            weatherIconElement.src = localIcon;
            weatherIconElement.alt = descriptiveText;
        }
        const tempValue = parseFloat(currentConditions.temp);
        if (temperatureElement) temperatureElement.innerHTML = `${isNaN(tempValue) ? '--' : Math.round(tempValue)} <span>°C</span>`;
        if (descriptionElement) descriptionElement.textContent = descriptiveText;
        if (dateElement) dateElement.textContent = formatUnixTimestamp(currentConditions.datetimeEpoch, timezoneOffsetSeconds, "date");
        if (locationElement && resolvedAddress) locationElement.textContent = `📍 ${resolvedAddress.split(',')[0].toUpperCase()}`;
        if (humidityElement) humidityElement.textContent = `${Math.round(currentConditions.humidity)}%`;
        if (windElement) windElement.textContent = `${Math.round(currentConditions.windspeed)} KM/J`;
        if (uvIndexElement) uvIndexElement.textContent = getUvIndexDescription(currentConditions.uvindex);
        if (sunriseElement) sunriseElement.innerHTML = `Terbit<br>${formatUnixTimestamp(currentConditions.sunriseEpoch, timezoneOffsetSeconds, "time")}`;
        if (sunsetElement) sunsetElement.innerHTML = `Terbenam<br>${formatUnixTimestamp(currentConditions.sunsetEpoch, timezoneOffsetSeconds, "time")}`;
        
        // Penting: Jadikan elemen waktu terlihat SEKARANG karena data sudah ada
        if (sunTimeElement) {
            sunTimeElement.style.opacity = "1";
            sunTimeElement.style.visibility = "visible";
        }

        const initialCurrentEpoch = Math.floor(Date.now() / 1000);
        updateSunPositionAndRealTimeClock(globalSunriseEpoch, globalSunsetEpoch, initialCurrentEpoch, globalTimezoneOffsetSeconds);
        startRealTimeSunUpdates();
    }

    function displayHourlyForecast(hoursData, timezoneOffsetSeconds) {
        if (!hoursData || !hourlySliderElement) {
            if (hourlySliderElement) hourlySliderElement.innerHTML = "<p>Data prakiraan per jam tidak tersedia.</p>";
            return;
        }
        hourlySliderElement.innerHTML = "";
        const displayHoursCount = 24;
        hoursData.slice(0, displayHoursCount).forEach(hour => {
            if (typeof hour.icon !== 'string') {
                console.warn("Data ikon jam tidak valid:", hour);
                return;
            }
            const card = document.createElement("div");
            card.classList.add("hour-card");
            const localIcon = getLocalIconPath(hour.icon);
            const descriptiveText = getIndonesianDescriptionFromVCIcon(hour.icon);
            const tempValue = parseFloat(hour.temp);
            const precipProbValue = parseFloat(hour.precipprob);

            card.innerHTML = `
                <div class="time">${formatUnixTimestamp(hour.datetimeEpoch, timezoneOffsetSeconds, "time")}</div>
                <div class="icon"><img src="${localIcon}" alt="${descriptiveText}" class="icon-img"></div>
                <div class="desc-hourly">${descriptiveText}</div>
                <div class="temp">${isNaN(tempValue) ? '--' : Math.round(tempValue)}°</div>
                <div class.rain">💧 ${isNaN(precipProbValue) ? 'N/A' : Math.round(precipProbValue)}%</div>
            `;
            hourlySliderElement.appendChild(card);
        });
        currentPositionHourly = 0;
        if (hourlySliderElement) hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
        console.log("[HOURLY] Prakiraan per jam (VC) selesai ditampilkan, kartu ditambahkan:", hourlySliderElement.children.length);
    }

    function displayDailyForecast(daysData, timezoneOffsetSeconds) {
        if (!daysData || !dailyForecastElement) {
            if (dailyForecastElement) dailyForecastElement.innerHTML = "<p>Data prakiraan harian tidak tersedia.</p>";
            return;
        }
        dailyForecastElement.innerHTML = "";
        daysData.slice(0, 7).forEach(day => {
            if (typeof day.icon !== 'string') {
                console.warn("Data ikon harian tidak valid:", day);
                return;
            }
            const card = document.createElement("div");
            card.classList.add("daily-card");
            const localIcon = getLocalIconPath(day.icon);
            const descriptiveText = getIndonesianDescriptionFromVCIcon(day.icon);
            const tempMinValue = parseFloat(day.tempmin);
            const tempMaxValue = parseFloat(day.tempmax);
            const windSpeedValue = parseFloat(day.windspeed);

            card.innerHTML = `
                <div class="day">${formatUnixTimestamp(day.datetimeEpoch, timezoneOffsetSeconds, "day")}</div>
                <div class="icon"><img src="${localIcon}" alt="${descriptiveText}" class="icon-daily-img"></div>
                <div class="desc">${descriptiveText}</div>
                <div class="temp">${isNaN(tempMinValue) ? '--' : Math.round(tempMinValue)}°/${isNaN(tempMaxValue) ? '--' : Math.round(tempMaxValue)}°C</div>
                <div class="wind">Angin ${isNaN(windSpeedValue) ? 'N/A' : Math.round(windSpeedValue)} km/j</div>
            `;
            dailyForecastElement.appendChild(card);
        });
        currentPositionDaily = 0;
        if (dailyForecastElement) dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
        console.log("[DAILY] Prakiraan harian (VC) selesai ditampilkan, kartu ditambahkan:", dailyForecastElement.children.length);
    }

    async function getWeatherData(cityName) {
        const cityToFetch = cityName;
        if (!cityToFetch) {
            alert("Nama kota tidak valid atau tidak tersedia untuk memuat cuaca.");
            if (cityInputElement) cityInputElement.value = "";
            if (descriptionElement) descriptionElement.textContent = "Masukkan nama kota";
            if (temperatureElement) temperatureElement.innerHTML = `-- <span>°C</span>`;
            if (weatherIconElement) weatherIconElement.src = getLocalIconPath('unknown-default');
            if (sunTimeElement) {
                sunTimeElement.style.opacity = "0";
                sunTimeElement.style.visibility = "hidden";
            }
            if (sunRealTimeUpdateInterval) clearInterval(sunRealTimeUpdateInterval);
            return;
        }
        if (cityInputElement) {
            cityInputElement.value = cityToFetch;
        }
        console.log(`[VC API] Memulai pengambilan data untuk kota: ${cityToFetch}`);
        if (descriptionElement) descriptionElement.textContent = "Memuat data...";
        if (temperatureElement) temperatureElement.innerHTML = `-- <span>°C</span>`;
        if (hourlySliderElement) hourlySliderElement.innerHTML = "<p>Memuat prakiraan per jam...</p>";
        if (dailyForecastElement) dailyForecastElement.innerHTML = "<p>Memuat prakiraan harian...</p>";
        if (sunTimeElement) { // Sembunyikan waktu saat loading
            sunTimeElement.style.opacity = "0";
            sunTimeElement.style.visibility = "hidden";
        }


        const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(cityToFetch)}/next7days?key=${VC_API_KEY}&contentType=json&unitGroup=metric&lang=id&include=hours,current,days`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                let errorMsg = response.statusText;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || JSON.stringify(errorData) || response.statusText;
                } catch (e) { /* Gagal parse JSON error */ }
                throw new Error(`Gagal mengambil data dari Visual Crossing: ${response.status} - ${errorMsg}`);
            }
            const data = await response.json();
            console.log("[VC API] Data berhasil diambil:", data);

            if (!data.currentConditions || !data.days || data.days.length === 0) {
                console.error("[VC API] Format data dari Visual Crossing tidak sesuai atau kosong.", data);
                throw new Error("Format data dari Visual Crossing tidak sesuai atau kosong.");
            }

            const timezoneOffsetSeconds = data.tzoffset * 3600;
            const resolvedAddress = data.resolvedAddress || data.address || cityToFetch;

            displayCurrentWeather(data.currentConditions, resolvedAddress, timezoneOffsetSeconds);
            
            if (data.days[0] && data.days[0].hours && Array.isArray(data.days[0].hours)) {
                displayHourlyForecast(data.days[0].hours, timezoneOffsetSeconds);
            } else {
                console.warn("[VC API] Data per jam (data.days[0].hours) tidak ditemukan atau bukan array.");
                if(hourlySliderElement) hourlySliderElement.innerHTML = "<p>Data per jam tidak tersedia untuk hari ini.</p>"
            }

            if (data.days && Array.isArray(data.days)) {
                displayDailyForecast(data.days, timezoneOffsetSeconds);
            } else {
                 console.warn("[VC API] Data harian (data.days) tidak ditemukan atau bukan array.");
                 if(dailyForecastElement) dailyForecastElement.innerHTML = "<p>Data prakiraan harian tidak tersedia.</p>"
            }

        } catch (error) {
            console.error("[VC API] Error fetching weather data:", error);
            alert(`Gagal mendapatkan data cuaca untuk ${cityToFetch}: ${error.message}`);
            if (descriptionElement) descriptionElement.textContent = "Gagal memuat data";
            if (temperatureElement) temperatureElement.innerHTML = `-- <span>°C</span>`;
            if (weatherIconElement) weatherIconElement.src = getLocalIconPath('unknown-default');
            if (sunTimeElement) {
                sunTimeElement.style.opacity = "0";
                sunTimeElement.style.visibility = "hidden";
            }
            if (sunRealTimeUpdateInterval) clearInterval(sunRealTimeUpdateInterval);
            globalSunriseEpoch = undefined;
            globalSunsetEpoch = undefined;
            globalTimezoneOffsetSeconds = undefined;
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

    // --- SLIDER LOGIC ---
    let currentPositionHourly = 0;
    const btnLeftHourly = document.querySelector(".hourly-forecast .arrow-left");
    const btnRightHourly = document.querySelector(".hourly-forecast .arrow-right");
    const getCardWidthHourly = () => ((hourlySliderElement?.querySelector('.hour-card')?.offsetWidth || 90) + 12);

    btnLeftHourly?.addEventListener("click", () => {
        if (!hourlySliderElement || hourlySliderElement.children.length === 0) return;
        const cardScrollWidth = getCardWidthHourly();
        currentPositionHourly += cardScrollWidth * 2;
        if (currentPositionHourly > 0) { currentPositionHourly = 0; }
        hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
    });
    btnRightHourly?.addEventListener("click", () => {
        if (!hourlySliderElement || !hourlySliderElement.parentElement || hourlySliderElement.children.length === 0) return;
        const cardScrollWidth = getCardWidthHourly();
        const containerWidth = hourlySliderElement.parentElement.offsetWidth;
        const totalCardsScrollWidth = hourlySliderElement.scrollWidth;
        const maxScroll = -(totalCardsScrollWidth - containerWidth);
        if (totalCardsScrollWidth <= containerWidth) {
            currentPositionHourly = 0;
        } else {
            currentPositionHourly -= cardScrollWidth * 2;
            if (currentPositionHourly < maxScroll) { currentPositionHourly = maxScroll; }
        }
        hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
    });

    let currentPositionDaily = 0;
    const btnLeftDaily = document.querySelector(".daily-forecast .arrow-left-day");
    const btnRightDaily = document.querySelector(".daily-forecast .arrow-right-day");
    const getCardWidthDaily = () => ((dailyForecastElement?.querySelector('.daily-card')?.offsetWidth || 180) + 15);

    btnLeftDaily?.addEventListener("click", () => {
        if (!dailyForecastElement || dailyForecastElement.children.length === 0) return;
        const cardScrollWidth = getCardWidthDaily();
        currentPositionDaily += cardScrollWidth * 2;
        if (currentPositionDaily > 0) { currentPositionDaily = 0; }
        dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
    });
    btnRightDaily?.addEventListener("click", () => {
        if (!dailyForecastElement || !dailyForecastElement.parentElement || dailyForecastElement.children.length === 0) return;
        const cardScrollWidth = getCardWidthDaily();
        const containerWidth = dailyForecastElement.parentElement.offsetWidth;
        const totalCardsScrollWidth = dailyForecastElement.scrollWidth;
        const maxScroll = -(totalCardsScrollWidth - containerWidth);
        if (totalCardsScrollWidth <= containerWidth) {
            currentPositionDaily = 0;
        } else {
            currentPositionDaily -= cardScrollWidth * 2;
            if (currentPositionDaily < maxScroll) { currentPositionDaily = maxScroll; }
        }
        dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
    });
    
    // --- Hamburger Menu Toggle ---
    const topNav = document.querySelector('.top-menu');
    const hamburger = document.querySelector('#hamburger-menu');
    hamburger?.addEventListener("click", (e) => { e.stopPropagation(); topNav?.classList.toggle('active'); });
    document.addEventListener('click', function (e) { if (topNav && hamburger && !hamburger.contains(e.target) && !topNav.contains(e.target)) { topNav.classList.remove('active'); } });
    
    initializeWeather();
});