document.addEventListener("DOMContentLoaded", () => {
    const VC_API_KEY = "NPNY44GESYP2J87F3KZRLRTVR"; // API Key Visual Crossing Anda
    const TEMP_UNIT_KEY = 'weatherAppTemperatureUnitPreference'; // Key untuk localStorage satuan suhu
    const FAVORITES_KEY = 'weatherAppUserFavoritesVC'; // Key unik untuk localStorage lokasi favorit

    // --- LOGIKA UNTUK HALAMAN PENGATURAN (setting.html) ---
    const temperatureUnitSelect_settingsPage = document.getElementById('temperatureUnitSelect');
    const tempUnitStatusMessage_settingsPage = document.getElementById('tempUnitStatus');
    if (temperatureUnitSelect_settingsPage) {
        // console.log("VisualCrossing.js: Menjalankan logika untuk setting.html (Satuan Suhu)");
        const savedUnit_settingsPage = localStorage.getItem(TEMP_UNIT_KEY) || 'metric';
        temperatureUnitSelect_settingsPage.value = savedUnit_settingsPage;
        temperatureUnitSelect_settingsPage.addEventListener('change', function() {
            const selectedUnit = this.value;
            localStorage.setItem(TEMP_UNIT_KEY, selectedUnit);
            if (tempUnitStatusMessage_settingsPage) {
                tempUnitStatusMessage_settingsPage.textContent = 'Preferensi satuan suhu disimpan!';
                setTimeout(() => {
                    if (tempUnitStatusMessage_settingsPage) tempUnitStatusMessage_settingsPage.textContent = '';
                }, 2500);
            }
            // console.log('Preferensi unit suhu diubah (dari settings page) ke:', selectedUnit);
        });
    }
    // --- AKHIR LOGIKA HALAMAN PENGATURAN ---

    // HTML Element Selectors (untuk homepage.html)
    const cityInputElement = document.getElementById("cityInput");
    const searchButtonElement = document.querySelector(".search-btn");
    const weatherIconElement = document.querySelector(".weather-icon-container img");
    const temperatureElement = document.querySelector(".temperature");
    const descriptionElement = document.querySelector(".sidebar .desc");
    const dateElement = document.querySelector(".date");
    const displayedLocationNameSpan = document.getElementById('displayedLocationName');
    const favoriteLocationIcon = document.getElementById('favoriteLocationIcon');
    const humidityElement = document.querySelector(".cards .card:nth-child(1) .card-value");
    const windElement = document.querySelector(".cards .card:nth-child(2) .card-value");
    const uvIndexElement = document.querySelector(".cards .card:nth-child(3) .card-value");
    const sunriseElement = document.querySelector(".sun-info span:nth-child(1)");
    const sunsetElement = document.querySelector(".sun-info span:nth-child(2)");
    const sunElement = document.querySelector(".sun-path .sun");
    const hourlySliderElement = document.getElementById("hourlySlider");
    const dailyForecastElement = document.getElementById("dailyForecast");
    const weatherVideoElement = document.getElementById('weatherVideoBackground');

    // Variabel global
    let globalSunriseEpoch, globalSunsetEpoch, globalTimezoneOffsetSeconds;
    let sunRealTimeUpdateInterval = null;
    let sunTimeElement = null;

    // Kondisi untuk menjalankan logika homepage
    if (cityInputElement && temperatureElement && displayedLocationNameSpan) {

        if (sunElement && sunElement.parentElement) {
            sunTimeElement = document.createElement('div');
            sunTimeElement.id = 'sunTimeDisplay';
            sunTimeElement.classList.add('sun-time');
            sunElement.parentElement.insertBefore(sunTimeElement, sunElement);
        }

        function getTemperatureUnitPreference() { return localStorage.getItem(TEMP_UNIT_KEY) || 'metric'; }
        function getTemperatureSymbol(unitPreference) { return unitPreference === 'us' ? '°F' : '°C'; }
        
        function getFavoriteLocations() { const favorites = localStorage.getItem(FAVORITES_KEY); return favorites ? JSON.parse(favorites) : []; }
        function saveFavoriteLocations(favoritesArray) { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritesArray)); }
        function addLocationToFavorites(locationName) { if (!locationName || typeof locationName !== 'string' || locationName.trim() === "") return false; const favorites = getFavoriteLocations(); const upperCaseLocationName = locationName.trim().toUpperCase(); if (!favorites.includes(upperCaseLocationName)) { favorites.push(upperCaseLocationName); saveFavoriteLocations(favorites); console.log(`"${locationName}" ditambahkan ke favorit.`); return true; } return false; }
        function removeLocationFromFavorites(locationName) { if (!locationName || typeof locationName !== 'string' || locationName.trim() === "") return false; let favorites = getFavoriteLocations(); const upperCaseLocationName = locationName.trim().toUpperCase(); if (favorites.includes(upperCaseLocationName)) { favorites = favorites.filter(fav => fav !== upperCaseLocationName); saveFavoriteLocations(favorites); console.log(`"${locationName}" dihapus dari favorit.`); return true; } return false; }
        function isLocationFavorite(locationName) { if (!locationName || typeof locationName !== 'string' || locationName.trim() === "") return false; const favorites = getFavoriteLocations(); return favorites.includes(locationName.trim().toUpperCase());}
        function updateFavoriteIconState(locationName) { if (!favoriteLocationIcon) return; const isValidLocation = locationName && typeof locationName === 'string' && locationName.trim() !== ""; const isFav = isValidLocation ? isLocationFavorite(locationName) : false; if (isFav) { favoriteLocationIcon.classList.remove('far'); favoriteLocationIcon.classList.add('fas'); favoriteLocationIcon.classList.add('is-favorite'); favoriteLocationIcon.title = "Hapus dari favorit"; } else { favoriteLocationIcon.classList.remove('fas'); favoriteLocationIcon.classList.add('far'); favoriteLocationIcon.classList.remove('is-favorite'); favoriteLocationIcon.title = "Tandai sebagai favorit"; }}
        
        const navFavoritesTrigger = document.getElementById('navFavoritesLink');
        const navFavoritesListUL = document.getElementById('navFavoritesList');
        function populateFavoritesDropdown() { 
            if (!navFavoritesListUL) { console.warn("Elemen ul#navFavoritesList untuk dropdown favorit di navigasi tidak ditemukan."); return; } 
            const favorites = getFavoriteLocations(); 
            const currentItems = Array.from(navFavoritesListUL.children); 
            currentItems.forEach(item => { if (!item.classList.contains('no-favorites-msg')) { navFavoritesListUL.removeChild(item); } }); 
            let noFavMsgElement = navFavoritesListUL.querySelector('.no-favorites-msg'); 
            if (!noFavMsgElement) { noFavMsgElement = document.createElement('li'); noFavMsgElement.className = 'no-favorites-msg'; noFavMsgElement.textContent = 'Belum ada lokasi favorit.'; noFavMsgElement.style.padding = "10px 15px"; noFavMsgElement.style.color = "#777"; noFavMsgElement.style.fontStyle = "italic"; noFavMsgElement.style.display = "none"; navFavoritesListUL.insertBefore(noFavMsgElement, navFavoritesListUL.firstChild); } 
            if (favorites.length === 0) { noFavMsgElement.style.display = 'list-item'; } 
            else { 
                noFavMsgElement.style.display = 'none'; 
                favorites.forEach(cityName => { 
                    const li = document.createElement('li'); 
                    const a = document.createElement('a'); 
                    a.href = '#'; 
                    a.textContent = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase(); 
                    a.dataset.city = cityName; 
                    a.addEventListener('click', function(e) { e.preventDefault(); const cityToSearch = this.dataset.city; if (typeof getWeatherData === 'function') { getWeatherData(cityToSearch); } if (cityInputElement) cityInputElement.value = this.textContent; if (navFavoritesListUL) navFavoritesListUL.classList.remove('show'); if (navFavoritesTrigger && navFavoritesTrigger.parentElement) { navFavoritesTrigger.parentElement.classList.remove('open'); } }); 
                    li.appendChild(a); 
                    navFavoritesListUL.appendChild(li); 
                }); 
            }
        }
        if (navFavoritesTrigger && navFavoritesListUL) { 
            navFavoritesTrigger.addEventListener('click', (event) => { 
                event.preventDefault(); 
                event.stopPropagation(); 
                populateFavoritesDropdown(); 
                navFavoritesListUL.classList.toggle('show'); 
                if (navFavoritesTrigger.parentElement) { 
                    navFavoritesTrigger.parentElement.classList.toggle('open', navFavoritesListUL.classList.contains('show')); 
                } 
            }); 
            document.addEventListener('click', (event) => { 
                const triggerContainer = document.getElementById('navFavoritesContainer'); 
                if (triggerContainer && !triggerContainer.contains(event.target) && navFavoritesListUL.classList.contains('show')) { 
                    navFavoritesListUL.classList.remove('show'); 
                    if (navFavoritesTrigger.parentElement) navFavoritesTrigger.parentElement.classList.remove('open'); 
                } 
            }); 
        }
        if (favoriteLocationIcon && displayedLocationNameSpan) { 
            favoriteLocationIcon.addEventListener('click', () => { 
                const currentLocationName = displayedLocationNameSpan.textContent.trim(); 
                if (!currentLocationName || currentLocationName === "MEMUAT LOKASI..." || currentLocationName === "LOKASI TIDAK DIKETAHUI" || currentLocationName === "N/A") { console.warn("Tidak bisa memfavoritkan lokasi yang belum valid atau diketahui:", currentLocationName); 
                    return; 
                } 
                if (isLocationFavorite(currentLocationName)) { removeLocationFromFavorites(currentLocationName); } 
                else { addLocationToFavorites(currentLocationName); } 
                updateFavoriteIconState(currentLocationName); 
                if (navFavoritesListUL && navFavoritesListUL.classList.contains('show')) { populateFavoritesDropdown(); } 
            }); 
        }

        const weatherVideoMap = { 
            'clear-day': 'assets/videos/clear day.mp4',
            'clear-night': 'assets/videos/clear day.mp4',
            'partly-cloudy-day': 'assets/videos/partly-cloudy-day.mp4',
            'partly-cloudy-night': 'assets/videos/partly-cloudy-day.mp4',
            'cloudy': 'assets/videos/cloudy.mp4',
            'rain': 'assets/videos/rain.mp4',
            'showers-day': 'assets/videos/showers.mp4',
            'showers-night': 'assets/videos/shiwers.mp4',
            'snow': 'assets/videos/salju.mp4',
            'fog': 'assets/videos/fog.mp4',
            'wind': 'assets/videos/wind.mp4',
            'thunder-rain': 'assets/videos/thunder.mp4',
            'thunder-showers-day': 'assets/videos/thunder.mp4',
            'thunder-showers-night': 'assets/videos/thunder.mp4',
            'default': 'assets/videos/clear day.mp4'
        };
        function updateWeatherVideoBackground(vcIconName) { 
            if (!weatherVideoElement) {return;} 
            if (typeof vcIconName !== 'string' || vcIconName.trim() === '') {vcIconName = 'default';} 
            const iconKey = vcIconName.toLowerCase(); 
            const newVideoSrc = weatherVideoMap[iconKey] || weatherVideoMap['default']; 
            if (weatherVideoElement.currentSrc && weatherVideoElement.currentSrc.includes(newVideoSrc.split('/').pop())) { return; } 
            weatherVideoElement.src = newVideoSrc; 
            weatherVideoElement.load(); 
            weatherVideoElement.play().catch(error => { console.error("Error saat mencoba memutar video:", newVideoSrc, error); });
        }
        
        function formatUnixTimestamp(timestamp, timezoneOffsetSeconds, format = "datetime") { /* ... kode Anda ... */ 
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
        function getLocalIconPath(vcIconName) { /* ... kode Anda ... */ 
            const basePath = "assets/"; if (typeof vcIconName !== 'string') { console.warn("Nama ikon VC tidak valid untuk getLocalIconPath:", vcIconName); 
                return basePath + "berawan.png"; } const icon = vcIconName.toLowerCase(); 
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
        function getIndonesianDescriptionFromVCIcon(vcIconName) { /* ... kode Anda ... */ 
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
        function getUvIndexDescription(uvi) { /* ... kode Anda ... */ 
             if (uvi === null || uvi === undefined) return "-- (N/A)"; 
             const uviValue = parseFloat(uvi); 
             if (uviValue <= 2) return `${uviValue.toFixed(1)} (Rendah)`; 
             if (uviValue <= 5) return `${uviValue.toFixed(1)} (Sedang)`; 
             if (uviValue <= 7) return `${uviValue.toFixed(1)} (Tinggi)`; 
             if (uviValue <= 10) return `${uviValue.toFixed(1)} (Sangat Tinggi)`; 
             return `${uviValue.toFixed(1)} (Ekstrem)`;
        }
        function updateSunPositionAndRealTimeClock(sunriseTs, sunsetTs, currentTs, tzOffset) { /* ... kode Anda ... */ 
            if (!sunElement || !sunTimeElement) { return; } const nowLocalMs = (currentTs + tzOffset) * 1000; 
            const sunriseLocalMs = (sunriseTs + tzOffset) * 1000; 
            const sunsetLocalMs = (sunsetTs + tzOffset) * 1000; 
            let percentage; let isSunIconCurrentlyVisible = true; 
            if (nowLocalMs < sunriseLocalMs) { 
                percentage = 0; isSunIconCurrentlyVisible = false;
             } 
             else if (nowLocalMs > sunsetLocalMs) { 
                percentage = 100; isSunIconCurrentlyVisible = false; 
             } 
             else { const totalDaylight = sunsetLocalMs - sunriseLocalMs; 
                const timeSinceSunrise = nowLocalMs - sunriseLocalMs; 
                percentage = (timeSinceSunrise / totalDaylight) * 100; 
                percentage = Math.max(0, Math.min(100, percentage)); 
                isSunIconCurrentlyVisible = true; 
             } sunElement.style.left = `${percentage}%`; 
             sunTimeElement.style.left = `${percentage}%`; 
            const currentTimeDate = new Date(); 
            const hours = currentTimeDate.getHours().toString().padStart(2, '0'); 
            const minutes = currentTimeDate.getMinutes().toString().padStart(2, '0'); 
            const seconds = currentTimeDate.getSeconds().toString().padStart(2, '0'); 
            sunTimeElement.textContent = `${hours}:${minutes}:${seconds}`; 
            if (isSunIconCurrentlyVisible) { 
                sunElement.style.opacity = "1"; 
            } else { 
                sunElement.style.opacity = "0.3"; 
            }
        }
        function startRealTimeSunUpdates() { /* ... kode Anda ... */ 
             if (sunRealTimeUpdateInterval) { 
                clearInterval(sunRealTimeUpdateInterval); 
             } 
             if (globalSunriseEpoch === undefined || globalSunsetEpoch === undefined || globalTimezoneOffsetSeconds === undefined) { 
                if(sunTimeElement) { 
                    sunTimeElement.style.opacity = "0"; 
                    sunTimeElement.style.visibility = "hidden"; 
                } return; 
            } if (sunTimeElement) { 
                sunTimeElement.style.opacity = "1"; 
                sunTimeElement.style.visibility = "visible"; 
              } sunRealTimeUpdateInterval = setInterval(() => { const currentEpoch = Math.floor(Date.now() / 1000); 
                updateSunPositionAndRealTimeClock(globalSunriseEpoch, globalSunsetEpoch, currentEpoch, globalTimezoneOffsetSeconds); 
            }, 1000);
        }

        function displayCurrentWeather(currentConditions, resolvedAddress, timezoneOffsetSeconds) { /* ... kode lengkap Anda ... */ 
            const tempUnitPref = getTemperatureUnitPreference(); 
            const tempSymbol = getTemperatureSymbol(tempUnitPref); 
            if (!currentConditions) { 
                if (descriptionElement) descriptionElement.textContent = "Data tidak tersedia"; 
                if (temperatureElement) temperatureElement.innerHTML = `-- <span>${tempSymbol}</span>`; 
                if (weatherIconElement) weatherIconElement.src = getLocalIconPath('unknown-default'); 
                if (displayedLocationNameSpan) displayedLocationNameSpan.textContent = "N/A"; updateFavoriteIconState(null); 
                if (sunTimeElement) { sunTimeElement.style.opacity = "0"; sunTimeElement.style.visibility = "hidden"; } 
                if (typeof updateWeatherVideoBackground === 'function') { updateWeatherVideoBackground('default');

                } return; 
            } globalSunriseEpoch = currentConditions.sunriseEpoch; 
            globalSunsetEpoch = currentConditions.sunsetEpoch; 
            globalTimezoneOffsetSeconds = timezoneOffsetSeconds; 
            const localIconPath = getLocalIconPath(currentConditions.icon); 
            const indonesianDescription = getIndonesianDescriptionFromVCIcon(currentConditions.icon); 
            if (weatherIconElement) { weatherIconElement.src = localIconPath; 
                weatherIconElement.alt = indonesianDescription; 
            } const tempValue = parseFloat(currentConditions.temp); 
            if (temperatureElement) temperatureElement.innerHTML = `${isNaN(tempValue) ? '--' : Math.round(tempValue)} <span>${tempSymbol}</span>`; 
            if (descriptionElement) descriptionElement.textContent = indonesianDescription; 
            if (dateElement) dateElement.textContent = formatUnixTimestamp(currentConditions.datetimeEpoch, timezoneOffsetSeconds, "date"); 
            const justCityName = resolvedAddress ? resolvedAddress.split(',')[0] : null; 
            if (displayedLocationNameSpan) { displayedLocationNameSpan.textContent = justCityName ? justCityName.toUpperCase() : "LOKASI TIDAK DIKETAHUI"; 

            } updateFavoriteIconState(justCityName); 
            if (humidityElement) humidityElement.textContent = `${Math.round(currentConditions.humidity)}%`; 
            let windSpeedToDisplay = Math.round(currentConditions.windspeed); let windUnit = "KM/J"; 
            if (tempUnitPref === 'us') { windSpeedToDisplay = Math.round(currentConditions.windspeed * 1.60934); 

            } if (windElement) windElement.textContent = `${windSpeedToDisplay} ${windUnit}`; 
            if (uvIndexElement) uvIndexElement.textContent = getUvIndexDescription(currentConditions.uvindex); 
            if (sunriseElement) sunriseElement.innerHTML = `Terbit<br>${formatUnixTimestamp(currentConditions.sunriseEpoch, timezoneOffsetSeconds, "time")}`; 
            if (sunsetElement) sunsetElement.innerHTML = `Terbenam<br>${formatUnixTimestamp(currentConditions.sunsetEpoch, timezoneOffsetSeconds, "time")}`; 
            if (sunTimeElement) { sunTimeElement.style.opacity = "1"; 
                sunTimeElement.style.visibility = "visible"; 
            } const initialCurrentEpoch = Math.floor(Date.now() / 1000); 
            updateSunPositionAndRealTimeClock(globalSunriseEpoch, globalSunsetEpoch, initialCurrentEpoch, globalTimezoneOffsetSeconds); 
            startRealTimeSunUpdates(); 
            if (typeof updateWeatherVideoBackground === 'function' && currentConditions && typeof currentConditions.icon === 'string') { 
                updateWeatherVideoBackground(currentConditions.icon); 
            } else if (typeof updateWeatherVideoBackground === 'function') { updateWeatherVideoBackground('default'); 

            }
        }
        function displayHourlyForecast(hoursData, timezoneOffsetSeconds) { /* ... kode lengkap Anda ... */ 
            const tempUnitPref = getTemperatureUnitPreference(); 
            const tempSymbol = getTemperatureSymbol(tempUnitPref); 
            if (!hoursData || !hourlySliderElement) { 
                if (hourlySliderElement) hourlySliderElement.innerHTML = "<p style='text-align:center; width:100%;'>Data prakiraan per jam tidak tersedia.</p>"; 
                return; 
            } 
            hourlySliderElement.innerHTML = ""; 
            const displayHoursCount = 24; hoursData.slice(0, displayHoursCount).forEach(hour => { 
                if (typeof hour.icon !== 'string') { console.warn("Data ikon jam tidak valid:", hour); 
                return; 
            } const card = document.createElement("div"); 
            card.classList.add("hour-card"); const localIcon = getLocalIconPath(hour.icon); 
            const descriptiveText = getIndonesianDescriptionFromVCIcon(hour.icon); const tempValue = parseFloat(hour.temp); 
            const precipProbValue = parseFloat(hour.precipprob); 
            card.innerHTML = ` <div class="time">${formatUnixTimestamp(hour.datetimeEpoch, timezoneOffsetSeconds, "time")}</div> 
            <div class="icon"><img src="${localIcon}" alt="${descriptiveText}" class="icon-img"></div> 
            <div class="desc-hourly">${descriptiveText}</div> 
            <div class="temp">${isNaN(tempValue) ? '--' : Math.round(tempValue)}${tempSymbol}</div> 
            <div class="rain">💧 ${isNaN(precipProbValue) ? 'N/A' : Math.round(precipProbValue)}%</div> `; 
            hourlySliderElement.appendChild(card); }); 
            currentPositionHourly = 0; 
            if (hourlySliderElement) hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
        }
        function displayDailyForecast(daysData, timezoneOffsetSeconds) { /* ... kode lengkap Anda ... */ 
            const tempUnitPref = getTemperatureUnitPreference(); 
            const tempSymbolOnly = getTemperatureSymbol(tempUnitPref).replace('°',''); 
            if (!daysData || !dailyForecastElement) { 
                if (dailyForecastElement) dailyForecastElement.innerHTML = "<p style='text-align:center; width:100%;'>Data prakiraan harian tidak tersedia.</p>"; 
                return; 
            } 
            dailyForecastElement.innerHTML = ""; 
            daysData.slice(0, 7).forEach(day => { 
                if (typeof day.icon !== 'string') { console.warn("Data ikon harian tidak valid:", day); 
                return; 
            } 
            const card = document.createElement("div"); 
            card.classList.add("daily-card"); 
            const localIcon = getLocalIconPath(day.icon); 
            const descriptiveText = getIndonesianDescriptionFromVCIcon(day.icon); 
            const tempMinValue = parseFloat(day.tempmin); const tempMaxValue = parseFloat(day.tempmax); 
            let windSpeedToDisplay = Math.round(day.windspeed); let windUnit = "km/j"; 
            if (tempUnitPref === 'us') { windSpeedToDisplay = Math.round(day.windspeed * 1.60934); 

            } 
            card.innerHTML = ` <div class="day">${formatUnixTimestamp(day.datetimeEpoch, timezoneOffsetSeconds, "day")}</div> 
            <div class="icon"><img src="${localIcon}" alt="${descriptiveText}" class="icon-daily-img"></div> 
            <div class="desc">${descriptiveText}</div> 
            <div class="temp">${isNaN(tempMinValue) ? '--' : Math.round(tempMinValue)}°/${isNaN(tempMaxValue) ? '--' : Math.round(tempMaxValue)}°${tempSymbolOnly}</div> 
            <div class="wind">Angin ${isNaN(windSpeedToDisplay) ? 'N/A' : windSpeedToDisplay} ${windUnit}</div> `; 
            dailyForecastElement.appendChild(card); 
        }); 
        currentPositionDaily = 0; if (dailyForecastElement) dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
        }
        async function getWeatherData(cityName) { /* ... kode lengkap Anda ... */ 
            const cityToFetch = cityName; 
            const currentSelectedUnit = getTemperatureUnitPreference(); 
            const tempSymbolForLoading = getTemperatureSymbol(currentSelectedUnit); 
            if (!cityToFetch) { alert("Nama kota tidak valid atau tidak tersedia untuk memuat cuaca."); 
                if (cityInputElement) cityInputElement.value = ""; 
                if (descriptionElement) descriptionElement.textContent = "Masukkan nama kota"; 
                if (temperatureElement) temperatureElement.innerHTML = `-- <span>${tempSymbolForLoading}</span>`; 
                if (weatherIconElement) weatherIconElement.src = getLocalIconPath('unknown-default'); 
                if (displayedLocationNameSpan) displayedLocationNameSpan.textContent = "N/A"; 
                updateFavoriteIconState(null); if (sunTimeElement) { sunTimeElement.style.opacity = "0"; 
                    sunTimeElement.style.visibility = "hidden"; 
                } if (sunRealTimeUpdateInterval) clearInterval(sunRealTimeUpdateInterval); 
                return; 
            } 
                if (cityInputElement) cityInputElement.value = cityToFetch; 
                if (descriptionElement) descriptionElement.textContent = "Memuat data..."; 
                if (temperatureElement) temperatureElement.innerHTML = `-- <span>${tempSymbolForLoading}</span>`; 
                if (hourlySliderElement) hourlySliderElement.innerHTML = "<p style='text-align:center; width:100%;'>Memuat prakiraan per jam...</p>"; 
                if (dailyForecastElement) dailyForecastElement.innerHTML = "<p style='text-align:center; width:100%;'>Memuat prakiraan harian...</p>"; 
                if (displayedLocationNameSpan) displayedLocationNameSpan.textContent = "MEMUAT LOKASI..."; updateFavoriteIconState(null); 
                if (sunTimeElement) { sunTimeElement.style.opacity = "0"; sunTimeElement.style.visibility = "hidden"; 

                } 
                const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(cityToFetch)}/next7days?key=${VC_API_KEY}&contentType=json&unitGroup=${currentSelectedUnit}&lang=id&include=hours,current,days`; /*console.log(`[VC API] Fetching for unitGroup: ${currentSelectedUnit}`);*/ 
                try { const response = await fetch(apiUrl); 
                    if (!response.ok) { let errorMsg = response.statusText; 
                        try { const errorData = await response.json();
                             errorMsg = errorData.message || JSON.stringify(errorData) || response.statusText; 
                            } catch (e) {} throw new Error(`Gagal mengambil data dari Visual Crossing: ${response.status} - ${errorMsg}`); } const data = await response.json(); 
                            if (!data.currentConditions || !data.days || data.days.length === 0) { throw new Error("Format data dari Visual Crossing tidak sesuai atau kosong."); 

                            } const timezoneOffsetSeconds = data.tzoffset * 3600; 
                            const resolvedAddress = data.resolvedAddress || data.address || cityToFetch; 
                            displayCurrentWeather(data.currentConditions, resolvedAddress, timezoneOffsetSeconds); 
                            if (data.days[0] && data.days[0].hours && Array.isArray(data.days[0].hours)) { displayHourlyForecast(data.days[0].hours, timezoneOffsetSeconds); 

                            } else { if(hourlySliderElement) hourlySliderElement.innerHTML = "<p style='text-align:center; width:100%;'>Data per jam tidak tersedia untuk hari ini.</p>" } if (data.days && Array.isArray(data.days)) { displayDailyForecast(data.days, timezoneOffsetSeconds); 

                            } else { if(dailyForecastElement) dailyForecastElement.innerHTML = "<p style='text-align:center; width:100%;'>Data prakiraan harian tidak tersedia.</p>" } } catch (error) { console.error("[VC API] Error fetching weather data:", error); 
                                alert(`Gagal mendapatkan data cuaca untuk ${cityToFetch}: ${error.message}`); 
                                if (descriptionElement) descriptionElement.textContent = "Gagal memuat data"; 
                                if (temperatureElement) temperatureElement.innerHTML = `-- <span>${tempSymbolForLoading}</span>`; 
                                if (weatherIconElement) weatherIconElement.src = getLocalIconPath('unknown-default'); 
                                if (displayedLocationNameSpan) displayedLocationNameSpan.textContent = "N/A"; 
                                updateFavoriteIconState(null); globalSunriseEpoch = undefined; 
                                globalSunsetEpoch = undefined; globalTimezoneOffsetSeconds = undefined; 
                                if (sunRealTimeUpdateInterval) clearInterval(sunRealTimeUpdateInterval); 
                                if(sunTimeElement){sunTimeElement.style.opacity = "0"; sunTimeElement.style.visibility = "hidden";} 
                            }
        }
        async function getCityFromIP() { /* ... kode Anda ... */ try { const response = await fetch('https://ip-api.com/json/?fields=status,city,message'); 
            if (!response.ok) { throw new Error(`IP Geolocation request failed with status ${response.status}`); 
        } const data = await response.json(); 
            if (data.status === 'success' && data.city) { return data.city; } else { return null; } } catch (error) { return null; } }
        
        async function initializeWeather() {
            const lastSearchedCity = cityInputElement?.value?.trim() || await getCityFromIP() || "Malang";
            getWeatherData(lastSearchedCity);
        }

        // Event Listeners untuk search (homepage - dari kode Anda)
        searchButtonElement?.addEventListener("click", () => { const cityTyped = cityInputElement.value.trim(); if (cityTyped) { getWeatherData(cityTyped); } else { alert("Masukkan nama kota terlebih dahulu!"); } });
        cityInputElement?.addEventListener("keypress", (event) => { if (event.key === "Enter") { const cityTyped = cityInputElement.value.trim(); if (cityTyped) { getWeatherData(cityTyped); } else { alert("Masukkan nama kota terlebih dahulu!"); } } });
        
        initializeWeather(); // Panggil untuk memuat data cuaca saat homepage dibuka
    
    } // Akhir dari if (cityInputElement && ...) untuk logika homepage

    // --- AWAL PENAMBAHAN KODE SLIDER (DARI KODE YANG ANDA BERIKAN) ---
    // Variabel dan fungsi slider diletakkan di sini agar bisa diakses jika elemennya ada
    // Namun, event listenernya akan tetap di dalam blok kondisional homepage jika tombolnya spesifik homepage

    // Variabel ini perlu dideklarasikan di scope yang bisa diakses oleh event listener,
    // idealnya di dalam blok if (cityInputElement && ...) jika hanya untuk homepage.
    // Namun, karena Anda meminta "hanya menambahkan" pada file yang sudah ada,
    // dan selektor tombol slider sudah ada di luar blok if tersebut,
    // kita letakkan variabel posisi di sini.
    let currentPositionHourly = 0; 
    let currentPositionDaily = 0;

    // Selektor tombol slider dipindahkan ke sini karena kode slider akan menggunakan mereka,
    // dan Anda meminta kode slider ditambahkan.
    const btnLeftHourly = document.querySelector(".hourly-forecast .arrow-left");
    const btnRightHourly = document.querySelector(".hourly-forecast .arrow-right");
    const btnLeftDaily = document.querySelector(".daily-forecast .arrow-left-day");
    const btnRightDaily = document.querySelector(".daily-forecast .arrow-right-day");

    // Fungsi getCardWidth perlu didefinisikan di dalam blok if (cityInputElement && ...)
    // karena mereka bergantung pada hourlySliderElement dan dailyForecastElement.
    // Namun, event listenernya bisa ditambahkan di sini jika tombolnya selalu ada di DOM.
    // Agar lebih aman dan konsisten, kita akan memindahkan penambahan event listener
    // dan definisi getCardWidth ke dalam blok if (cityInputElement && ...)

    if (cityInputElement && temperatureElement && displayedLocationNameSpan) { // Cek lagi jika kita di homepage
        const getCardWidthHourly = () => ((hourlySliderElement?.querySelector('.hour-card')?.offsetWidth || 90) + 12);
        const getCardWidthDaily = () => ((dailyForecastElement?.querySelector('.daily-card')?.offsetWidth || 180) + 15);

        if (btnLeftHourly && hourlySliderElement) {
            btnLeftHourly.addEventListener("click", () => {
                if (!hourlySliderElement || hourlySliderElement.children.length === 0) return;
                const cardScrollWidth = getCardWidthHourly();
                currentPositionHourly += cardScrollWidth * 2;
                if (currentPositionHourly > 0) {
                    currentPositionHourly = 0;
                }
                hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
            });
        }

        if (btnRightHourly && hourlySliderElement) {
            btnRightHourly.addEventListener("click", () => {
                if (!hourlySliderElement || !hourlySliderElement.parentElement || hourlySliderElement.children.length === 0) return;
                const cardScrollWidth = getCardWidthHourly();
                const containerWidth = hourlySliderElement.parentElement.offsetWidth;
                const totalCardsScrollWidth = hourlySliderElement.scrollWidth;
                const maxScroll = -(totalCardsScrollWidth - containerWidth);
                if (totalCardsScrollWidth <= containerWidth) {
                    currentPositionHourly = 0;
                } else {
                    currentPositionHourly -= cardScrollWidth * 2;
                    if (currentPositionHourly < maxScroll) {
                        currentPositionHourly = maxScroll;
                    }
                }
                hourlySliderElement.style.transform = `translateX(${currentPositionHourly}px)`;
            });
        }

        if (btnLeftDaily && dailyForecastElement) {
            btnLeftDaily.addEventListener("click", () => {
                if (!dailyForecastElement || dailyForecastElement.children.length === 0) return;
                const cardScrollWidth = getCardWidthDaily();
                currentPositionDaily += cardScrollWidth * 2;
                if (currentPositionDaily > 0) {
                    currentPositionDaily = 0;
                }
                dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
            });
        }

        if (btnRightDaily && dailyForecastElement) {
            btnRightDaily.addEventListener("click", () => {
                if (!dailyForecastElement || !dailyForecastElement.parentElement || dailyForecastElement.children.length === 0) return;
                const cardScrollWidth = getCardWidthDaily();
                const containerWidth = dailyForecastElement.parentElement.offsetWidth;
                const totalCardsScrollWidth = dailyForecastElement.scrollWidth;
                const maxScroll = -(totalCardsScrollWidth - containerWidth);
                if (totalCardsScrollWidth <= containerWidth) {
                    currentPositionDaily = 0;
                } else {
                    currentPositionDaily -= cardScrollWidth * 2;
                    if (currentPositionDaily < maxScroll) {
                        currentPositionDaily = maxScroll;
                    }
                }
                dailyForecastElement.style.transform = `translateX(${currentPositionDaily}px)`;
            });
        }
    }
    // --- AKHIR PENAMBAHAN KODE SLIDER ---

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

    // DARK MODE

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

    // --- AWAL LOGIKA POP-UP LOGOUT (DIMODIFIKASI) ---
    // Tentukan pemicu logout berdasarkan halaman atau elemen yang ada
    let logoutTrigger = null;
    const logoutButtonHomepage = document.getElementById('logoutButton');  // Untuk homepage.html
    const logoutOptionSettings = document.getElementById('logoutOption'); // Untuk setting.html

    if (logoutButtonHomepage) {
        logoutTrigger = logoutButtonHomepage;
        console.log("INFO: Pemicu logout 'logoutButton' (homepage) ditemukan.");
    } else if (logoutOptionSettings) {
        logoutTrigger = logoutOptionSettings;
        console.log("INFO: Pemicu logout 'logoutOption' (settings) ditemukan.");
    } else {
        // Hanya tampilkan warning jika kita berada di halaman yang seharusnya ada tombol logout,
        // untuk menghindari console spam di halaman lain.
        if (window.location.pathname.includes('homepage.html') || window.location.pathname.includes('setting.html') || document.getElementById('userProfileDropdown')) {
             console.warn('PERINGATAN: Tidak ada elemen pemicu logout (logoutButton atau logoutOption) yang ditemukan.');
        }
    }

    const logoutPopup = document.getElementById('logoutPopup'); // Elemen pop-up (harus ada di HTML kedua halaman)

    if (logoutTrigger && logoutPopup) { // Hanya jalankan jika pemicu DAN pop-up ada
        const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
        const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

        if (!confirmLogoutBtn || !cancelLogoutBtn) {
            console.error('ERROR: Tombol konfirmasi atau batal di dalam pop-up logout tidak ditemukan!');
        } else {
            function showLogoutPopup() {
                logoutPopup.style.display = 'flex';
                setTimeout(() => {
                    logoutPopup.classList.add('show');
                }, 10);
            }

            function hideLogoutPopup() {
                logoutPopup.classList.remove('show');
                setTimeout(() => {
                    logoutPopup.style.display = 'none';
                }, 300); // Sesuaikan dengan durasi transisi CSS
            }

            logoutTrigger.addEventListener('click', function(event) {
                event.preventDefault(); // Mencegah perilaku default jika pemicu adalah link <a>
                showLogoutPopup();
            });

            cancelLogoutBtn.addEventListener('click', hideLogoutPopup);

            confirmLogoutBtn.addEventListener('click', function() {
                hideLogoutPopup();
                console.log('Proses Logout...');
                // --- LOGIKA KELUAR AKTUAL ---
                // Contoh: Hapus data dari localStorage, panggil API logout Firebase, dll.
                // localStorage.removeItem('userToken'); 
                // localStorage.removeItem('userData');
                
                // Arahkan ke halaman login
                window.location.href = 'login.html';
            });

            logoutPopup.addEventListener('click', function(event) {
                if (event.target === logoutPopup) { // Klik pada overlay
                    hideLogoutPopup();
                }
            });

            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape' && logoutPopup.style.display === 'flex' && logoutPopup.classList.contains('show')) {
                    hideLogoutPopup();
                }
            });
        }
    } else {
        if (window.location.pathname.includes('homepage.html') || window.location.pathname.includes('setting.html')) {
            if (!logoutTrigger) { /* Pesan sudah dicover di atas */ }
            if (!logoutPopup) {
                console.warn('PERINGATAN: Elemen pop-up logout (ID "logoutPopup") tidak ditemukan di HTML halaman ini.');
            }
        }
    }
    // --- AKHIR LOGIKA POP-UP LOGOUT ---
    // SELESAI DARKMODE

    
});