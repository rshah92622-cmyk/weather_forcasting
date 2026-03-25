/* ═══════════════════════════════════════════════════════════════
   KisanMitra - Farmer Weather Dashboard
   Main Application JavaScript (Pure Frontend)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── API Keys ───────────────────────────────────────────────────
  const OPENWEATHER_API_KEY = '6a78ebd832d2907870c99de24ac7ccbe';
  const GROQ_API_KEY = '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';

  // ─── State ──────────────────────────────────────────────────────
  const state = {
    currentCity: '',
    lat: null,
    lon: null,
    currentWeather: null,
    forecastData: null,
  };

  // ─── Weather Icon Map ────────────────────────────────────────────
  const weatherIcons = {
    '01d': 'fas fa-sun', '01n': 'fas fa-moon',
    '02d': 'fas fa-cloud-sun', '02n': 'fas fa-cloud-moon',
    '03d': 'fas fa-cloud', '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud', '04n': 'fas fa-cloud',
    '09d': 'fas fa-cloud-showers-heavy', '09n': 'fas fa-cloud-showers-heavy',
    '10d': 'fas fa-cloud-sun-rain', '10n': 'fas fa-cloud-moon-rain',
    '11d': 'fas fa-bolt', '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake', '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog', '50n': 'fas fa-smog',
  };

  const weatherColors = {
    '01d': '#ff9800', '01n': '#5c6bc0',
    '02d': '#ffa726', '02n': '#7986cb',
    '03d': '#78909c', '03n': '#78909c',
    '04d': '#607d8b', '04n': '#607d8b',
    '09d': '#42a5f5', '09n': '#42a5f5',
    '10d': '#29b6f6', '10n': '#5c6bc0',
    '11d': '#ffd600', '11n': '#ffd600',
    '13d': '#e0e0e0', '13n': '#bdbdbd',
    '50d': '#90a4ae', '50n': '#78909c',
  };

  function getWeatherIcon(iconCode) {
    return weatherIcons[iconCode] || 'fas fa-cloud';
  }

  function getWeatherColor(iconCode) {
    return weatherColors[iconCode] || '#78909c';
  }

  // ─── Crop Calendar Data ──────────────────────────────────────────
  const cropCalendarData = [
    { name: '🌾 Rice', months: { sowing: [5,6], growing: [7,8,9], harvest: [10,11] } },
    { name: '🌿 Wheat', months: { sowing: [10,11], growing: [12,1,2], harvest: [3,4] } },
    { name: '🥬 Cotton', months: { sowing: [4,5], growing: [6,7,8,9], harvest: [10,11,12] } },
    { name: '🎋 Sugarcane', months: { sowing: [1,2,10], growing: [3,4,5,6,7,8], harvest: [11,12,1] } },
    { name: '🌽 Maize', months: { sowing: [6,7], growing: [8,9], harvest: [10,11] } },
    { name: '🫘 Soybean', months: { sowing: [6,7], growing: [8,9], harvest: [10,11] } },
    { name: '🥔 Potato', months: { sowing: [10,11], growing: [12,1,2], harvest: [2,3] } },
    { name: '🍅 Tomato', months: { sowing: [6,7,11,12], growing: [8,9,1,2], harvest: [10,11,3,4] } },
    { name: '🧅 Onion', months: { sowing: [10,11,12], growing: [1,2,3], harvest: [4,5] } },
  ];

  // ─── Cost Estimates (per acre in INR) ────────────────────────────
  const costData = {
    rice:       { seeds: 1500, fertilizer: 3500, pesticide: 2000, labor: 8000, irrigation: 3000, misc: 2000 },
    wheat:      { seeds: 1200, fertilizer: 3000, pesticide: 1500, labor: 6000, irrigation: 2500, misc: 1500 },
    cotton:     { seeds: 2500, fertilizer: 4000, pesticide: 4000, labor: 10000, irrigation: 3500, misc: 2500 },
    sugarcane:  { seeds: 5000, fertilizer: 5000, pesticide: 3000, labor: 15000, irrigation: 5000, misc: 3000 },
    maize:      { seeds: 1000, fertilizer: 2500, pesticide: 1500, labor: 5000, irrigation: 2000, misc: 1500 },
    soybean:    { seeds: 1800, fertilizer: 2000, pesticide: 1800, labor: 5500, irrigation: 2000, misc: 1500 },
    vegetables: { seeds: 3000, fertilizer: 4000, pesticide: 3000, labor: 12000, irrigation: 4000, misc: 2500 },
  };

  // ─── API Helper Functions ───────────────────────────────────────

  async function fetchCurrentWeather(params) {
    const url = params.city
      ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(params.city)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?lat=${params.lat}&lon=${params.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const res = await fetch(url);
    return res.json();
  }

  async function fetchForecast(params) {
    const url = params.city
      ? `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(params.city)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      : `https://api.openweathermap.org/data/2.5/forecast?lat=${params.lat}&lon=${params.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const res = await fetch(url);
    return res.json();
  }

  async function fetchAirQuality(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
    const res = await fetch(url);
    return res.json();
  }

  async function fetchAIRecommendation(messages) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });
    return res.json();
  }

  // ─── Init ────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupNavigation();
    setupSearch();
    setupMobileMenu();
    setupCropCalendar();
    setupCostCalculator();
    setupAIAdvisor();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    detectSeason();

    // Try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          state.lat = pos.coords.latitude;
          state.lon = pos.coords.longitude;
          loadAllWeatherData();
        },
        () => {
          state.lat = 28.6139;
          state.lon = 77.209;
          state.currentCity = 'New Delhi';
          loadAllWeatherData();
        }
      );
    } else {
      state.lat = 28.6139;
      state.lon = 77.209;
      loadAllWeatherData();
    }
  }

  // ─── Navigation ──────────────────────────────────────────────────
  function setupNavigation() {
    document.querySelectorAll('.nav-item, .see-all').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) switchPage(page);
      });
    });
  }

  function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const page = document.getElementById('page-' + pageId);
    const nav = document.getElementById('nav-' + pageId);
    if (page) page.classList.add('active');
    if (nav) nav.classList.add('active');

    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');

    if (pageId === 'forecast' && state.forecastData) renderForecastPage();
    if (pageId === 'history' && state.forecastData) renderHistoryPage();
    if (pageId === 'plantation') renderPlantationPage();
  }

  // ─── Mobile Menu ─────────────────────────────────────────────────
  function setupMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const close = document.getElementById('sidebarClose');

    toggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });

    [overlay, close].forEach(el => {
      el.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    });
  }

  // ─── Search ──────────────────────────────────────────────────────
  function setupSearch() {
    const input = document.getElementById('citySearch');
    const btn = document.getElementById('searchBtn');
    const locBtn = document.getElementById('locationBtn');

    const doSearch = () => {
      const city = input.value.trim();
      if (city) {
        state.currentCity = city;
        loadAllWeatherData(city);
        input.blur();
      }
    };

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

    locBtn.addEventListener('click', () => {
      if (navigator.geolocation) {
        showToast('Detecting your location...', 'info');
        navigator.geolocation.getCurrentPosition(
          pos => {
            state.lat = pos.coords.latitude;
            state.lon = pos.coords.longitude;
            state.currentCity = '';
            loadAllWeatherData();
            showToast('Location detected!', 'success');
          },
          () => showToast('Location access denied', 'error')
        );
      }
    });
  }

  // ─── Date/Time ───────────────────────────────────────────────────
  function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-IN', options);
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const el = document.getElementById('currentDate');
    if (el) el.textContent = dateStr + ' • ' + timeStr;
  }

  // ─── Season Detection ───────────────────────────────────────────
  function detectSeason() {
    const month = new Date().getMonth() + 1;
    const badge = document.getElementById('seasonBadge');
    let season, icon, colors;

    if (month >= 3 && month <= 5) {
      season = 'Zaid (Summer)'; icon = 'fa-sun'; colors = 'linear-gradient(135deg, #fff3e0, #fff8e1)';
    } else if (month >= 6 && month <= 9) {
      season = 'Kharif (Monsoon)'; icon = 'fa-cloud-rain'; colors = 'linear-gradient(135deg, #e3f2fd, #e8f5e9)';
    } else {
      season = 'Rabi (Winter)'; icon = 'fa-snowflake'; colors = 'linear-gradient(135deg, #e8eaf6, #e3f2fd)';
    }

    badge.innerHTML = `<i class="fas ${icon}"></i><span>${season}</span>`;
    badge.style.background = colors;
  }

  // ─── Load All Weather Data ───────────────────────────────────────
  async function loadAllWeatherData(city) {
    try {
      const params = city ? { city } : { lat: state.lat, lon: state.lon };

      const [currentData, forecastData] = await Promise.all([
        fetchCurrentWeather(params),
        fetchForecast(params),
      ]);

      if (currentData.cod !== 200) {
        showToast('City not found. Try another name.', 'error');
        return;
      }

      state.currentWeather = currentData;
      state.forecastData = forecastData;
      state.currentCity = currentData.name;
      state.lat = currentData.coord.lat;
      state.lon = currentData.coord.lon;

      saveToHistory(currentData);

      renderCurrentWeather(currentData);
      renderHourlyForecast(forecastData);
      renderMiniForecast(forecastData);
      renderSunTimes(currentData);
      renderCropSuitability(currentData);
      renderIrrigation(currentData);
      checkWeatherAlerts(currentData, forecastData);

      loadAIQuickRecommendation(currentData);
      loadAirQuality();

    } catch (err) {
      console.error('Error loading weather:', err);
      showToast('Failed to load weather data', 'error');
    }
  }

  // ─── Render Current Weather ──────────────────────────────────────
  function renderCurrentWeather(data) {
    document.getElementById('currentCity').innerHTML =
      `<i class="fas fa-map-marker-alt"></i> ${data.name}, ${data.sys.country}`;

    const iconCode = data.weather[0].icon;
    document.getElementById('heroTemp').textContent = Math.round(data.main.temp);
    document.getElementById('heroIcon').innerHTML =
      `<i class="${getWeatherIcon(iconCode)}" style="color:${getWeatherColor(iconCode)}"></i>`;
    document.getElementById('heroCondition').textContent = data.weather[0].description;
    document.getElementById('heroFeelsLike').textContent =
      `Feels like ${Math.round(data.main.feels_like)}°C`;

    setDetail('detailHumidity', `${data.main.humidity}%`, 'Humidity');
    setDetail('detailWind', `${data.wind.speed} m/s`, 'Wind Speed');
    setDetail('detailRain', `${data.rain ? data.rain['1h'] || data.rain['3h'] || 0 : 0} mm`, 'Rainfall');
    setDetail('detailPressure', `${data.main.pressure} hPa`, 'Pressure');
    setDetail('detailVisibility', `${(data.visibility / 1000).toFixed(1)} km`, 'Visibility');
    setDetail('detailClouds', `${data.clouds.all}%`, 'Cloud Cover');
  }

  function setDetail(id, value, label) {
    const el = document.getElementById(id);
    if (el) {
      el.querySelector('.detail-value').textContent = value;
      el.querySelector('.detail-label').textContent = label;
    }
  }

  // ─── Hourly Forecast ────────────────────────────────────────────
  function renderHourlyForecast(data) {
    const container = document.getElementById('hourlyForecast');
    const items = data.list.slice(0, 8);

    container.innerHTML = items.map((item, i) => {
      const date = new Date(item.dt * 1000);
      const hour = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const iconCode = item.weather[0].icon;
      const isNow = i === 0;
      const rain = item.pop ? Math.round(item.pop * 100) : 0;

      return `
        <div class="hourly-item ${isNow ? 'now' : ''}">
          <span class="hourly-time">${isNow ? 'Now' : hour}</span>
          <span class="hourly-icon"><i class="${getWeatherIcon(iconCode)}" style="${isNow ? '' : 'color:' + getWeatherColor(iconCode)}"></i></span>
          <span class="hourly-temp">${Math.round(item.main.temp)}°</span>
          <span class="hourly-rain"><i class="fas fa-droplet"></i> ${rain}%</span>
        </div>
      `;
    }).join('');
  }

  // ─── Mini Forecast (5-Day) ──────────────────────────────────────
  function renderMiniForecast(data) {
    const container = document.getElementById('miniForecast');
    const dailyMap = {};

    data.list.forEach(item => {
      const dateStr = new Date(item.dt * 1000).toLocaleDateString('en-IN');
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { temps: [], icons: [], descs: [], rains: [], item };
      }
      dailyMap[dateStr].temps.push(item.main.temp);
      dailyMap[dateStr].icons.push(item.weather[0].icon);
      dailyMap[dateStr].descs.push(item.weather[0].description);
      dailyMap[dateStr].rains.push(item.pop || 0);
    });

    const days = Object.entries(dailyMap).slice(0, 5);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    container.innerHTML = days.map(([dateStr, d]) => {
      const date = new Date(d.item.dt * 1000);
      const dayName = dayNames[date.getDay()];
      const dateFormatted = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const high = Math.round(Math.max(...d.temps));
      const low = Math.round(Math.min(...d.temps));
      const mainIcon = d.icons[Math.floor(d.icons.length / 2)];
      const maxRain = Math.round(Math.max(...d.rains) * 100);

      return `
        <div class="mini-day">
          <span class="mini-day-name">${dayName}</span>
          <span class="mini-date">${dateFormatted}</span>
          <span class="mini-icon"><i class="${getWeatherIcon(mainIcon)}" style="color:${getWeatherColor(mainIcon)}"></i></span>
          <span class="mini-desc">${d.descs[Math.floor(d.descs.length / 2)]}</span>
          <span class="mini-temps">
            <span class="mini-high">${high}°</span>
            <span class="mini-low">${low}°</span>
          </span>
          <span class="mini-rain"><i class="fas fa-droplet"></i> ${maxRain}%</span>
        </div>
      `;
    }).join('');
  }

  // ─── Sun Times ──────────────────────────────────────────────────
  function renderSunTimes(data) {
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);

    document.getElementById('sunriseTime').textContent =
      sunrise.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    document.getElementById('sunsetTime').textContent =
      sunset.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const dayHours = ((sunset - sunrise) / 3600000).toFixed(1);
    document.getElementById('dayLength').textContent = dayHours + ' hrs daylight';

    const now = Date.now();
    const progress = Math.max(0, Math.min(1, (now - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime())));
    const dot = document.getElementById('sunDot');
    const angle = Math.PI * progress;
    const x = 50 + 53 * Math.cos(Math.PI - angle);
    const y = 53 - 53 * Math.sin(angle);
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
  }

  // ─── Crop Suitability ───────────────────────────────────────────
  function renderCropSuitability(data) {
    const container = document.getElementById('cropList');
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const month = new Date().getMonth() + 1;

    const crops = [
      { name: 'Rice', emoji: '🌾', minTemp: 20, maxTemp: 35, minHum: 60, months: [5,6,7,8,9,10] },
      { name: 'Wheat', emoji: '🌿', minTemp: 10, maxTemp: 25, minHum: 40, months: [10,11,12,1,2,3] },
      { name: 'Cotton', emoji: '🥬', minTemp: 25, maxTemp: 40, minHum: 50, months: [4,5,6,7,8,9] },
      { name: 'Maize', emoji: '🌽', minTemp: 20, maxTemp: 35, minHum: 55, months: [6,7,8,9,10] },
      { name: 'Tomato', emoji: '🍅', minTemp: 15, maxTemp: 30, minHum: 50, months: [6,7,8,11,12,1] },
      { name: 'Potato', emoji: '🥔', minTemp: 10, maxTemp: 25, minHum: 60, months: [10,11,12,1,2] },
    ];

    const scored = crops.map(crop => {
      let score = 0;
      if (temp >= crop.minTemp && temp <= crop.maxTemp) score += 40;
      else if (temp >= crop.minTemp - 5 && temp <= crop.maxTemp + 5) score += 20;
      if (humidity >= crop.minHum) score += 30;
      else if (humidity >= crop.minHum - 15) score += 15;
      if (crop.months.includes(month)) score += 30;
      return { ...crop, score };
    }).sort((a, b) => b.score - a.score);

    container.innerHTML = scored.slice(0, 5).map(crop => {
      const level = crop.score >= 70 ? 'high' : crop.score >= 40 ? 'medium' : 'low';
      const label = crop.score >= 70 ? 'Excellent' : crop.score >= 40 ? 'Good' : 'Low';
      return `
        <div class="crop-item">
          <span class="crop-emoji">${crop.emoji}</span>
          <div class="crop-info">
            <strong>${crop.name}</strong>
            <span>${crop.minTemp}°-${crop.maxTemp}°C, ${crop.minHum}%+ humidity</span>
          </div>
          <span class="crop-score ${level}">${label}</span>
        </div>
      `;
    }).join('');
  }

  // ─── Irrigation ─────────────────────────────────────────────────
  function renderIrrigation(data) {
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const rain = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0;
    const wind = data.wind.speed;

    let need = 50;
    if (temp > 35) need += 25;
    else if (temp > 30) need += 15;
    else if (temp < 15) need -= 15;
    if (humidity < 40) need += 15;
    else if (humidity > 70) need -= 20;
    if (rain > 5) need -= 30;
    else if (rain > 0) need -= 15;
    if (wind > 5) need += 10;
    need = Math.max(0, Math.min(100, need));

    const label = need > 70 ? 'High' : need > 40 ? 'Medium' : 'Low';
    document.getElementById('irrigationValue').textContent = label;

    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (need / 100) * circumference;
    const ring = document.getElementById('irrigationRing');
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = offset;
    const color = need > 70 ? '#f44336' : need > 40 ? '#ff9800' : '#4caf50';
    ring.style.stroke = color;

    const tips = [];
    if (rain > 5) tips.push({ icon: 'check-circle', text: 'Recent rain detected — skip irrigation today' });
    else if (rain > 0) tips.push({ icon: 'info-circle', text: 'Light rain — reduce irrigation by 50%' });
    if (temp > 35) tips.push({ icon: 'exclamation-triangle', text: 'High temperature — irrigate in early morning or evening' });
    if (humidity < 40) tips.push({ icon: 'droplet', text: 'Low humidity — increase irrigation frequency' });
    if (wind > 5) tips.push({ icon: 'wind', text: 'Windy conditions — use drip irrigation to reduce evaporation' });
    if (tips.length === 0) tips.push({ icon: 'thumbs-up', text: 'Normal conditions — follow regular irrigation schedule' });

    document.getElementById('irrigationTips').innerHTML = tips.map(t =>
      `<div class="tip-item"><i class="fas fa-${t.icon}"></i><span>${t.text}</span></div>`
    ).join('');
  }

  // ─── Weather Alerts ─────────────────────────────────────────────
  function checkWeatherAlerts(current, forecast) {
    const alertEl = document.getElementById('farmAlert');
    const alerts = [];

    if (current.main.temp > 40) {
      alerts.push({ title: '🔥 Extreme Heat Warning', msg: 'Temperature exceeds 40°C. Protect crops with mulching and increase irrigation.' });
    } else if (current.main.temp > 35) {
      alerts.push({ title: '☀️ Heat Advisory', msg: 'High temperatures expected. Consider shade nets for sensitive crops.' });
    }
    if (current.main.temp < 5) {
      alerts.push({ title: '❄️ Frost Warning', msg: 'Near-freezing temperatures! Cover young plants and avoid irrigation at night.' });
    }
    const upcomingRain = forecast.list.slice(0, 8).some(i => (i.pop || 0) > 0.7);
    if (upcomingRain) {
      alerts.push({ title: '🌧️ Heavy Rain Expected', msg: 'Postpone pesticide spraying and ensure drainage channels are clear.' });
    }
    if (current.wind.speed > 10) {
      alerts.push({ title: '💨 Strong Wind Alert', msg: 'Secure greenhouse covers and avoid spraying operations.' });
    }

    if (alerts.length > 0) {
      alertEl.style.display = 'flex';
      document.getElementById('alertTitle').textContent = alerts[0].title;
      document.getElementById('alertMessage').textContent = alerts[0].msg;
    } else {
      alertEl.style.display = 'none';
    }
  }

  // ─── Air Quality ────────────────────────────────────────────────
  async function loadAirQuality() {
    try {
      const data = await fetchAirQuality(state.lat, state.lon);
      if (data.list && data.list[0]) {
        const aqi = data.list[0].main.aqi;
        const labels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
        document.getElementById('aqiPill').querySelector('span').textContent = `AQI: ${labels[aqi] || aqi}`;
      }
    } catch (err) {
      console.error('AQI error:', err);
    }
  }

  // ─── AI Quick Recommendation ────────────────────────────────────
  async function loadAIQuickRecommendation(weatherData) {
    const container = document.getElementById('aiQuickContent');
    container.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p>🌾 AI is analyzing weather for farming advice...</p></div>';

    try {
      const systemPrompt = `You are an expert agricultural advisor AI for Indian farmers. 
You provide practical, actionable farming recommendations based on weather conditions.
Always respond in a structured format with clear sections using markdown.
Focus on: planting advice, irrigation, pest warnings, and cost-saving tips.
Keep response concise (under 300 words).`;

      const userPrompt = `Current weather in ${weatherData.name}:
- Temperature: ${weatherData.main.temp}°C (Feels like ${weatherData.main.feels_like}°C)
- Humidity: ${weatherData.main.humidity}%
- Wind: ${weatherData.wind.speed} m/s
- Condition: ${weatherData.weather[0].description}
- Season: ${getCurrentSeason()}

Give a quick, actionable farming advisory for today.`;

      const data = await fetchAIRecommendation([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      if (data.error) {
        container.innerHTML = `<p style="color: var(--red-500);">⚠️ ${data.error.message || JSON.stringify(data.error)}</p>`;
        return;
      }
      container.innerHTML = formatMarkdown(data.choices?.[0]?.message?.content || 'No recommendation available.');
    } catch (err) {
      container.innerHTML = '<p style="color: var(--red-500);">Failed to load AI recommendation. Please try again.</p>';
    }
  }

  // Refresh AI button
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('refreshAI')?.addEventListener('click', function() {
      this.classList.add('spinning');
      if (state.currentWeather) {
        loadAIQuickRecommendation(state.currentWeather).then(() => {
          this.classList.remove('spinning');
        });
      }
    });
  });

  // ─── AI Advisor Page ────────────────────────────────────────────
  function setupAIAdvisor() {
    document.getElementById('getRecommendation')?.addEventListener('click', async () => {
      const btn = document.getElementById('getRecommendation');
      const responseEl = document.getElementById('aiResponse');
      const crop = document.getElementById('cropSelect').value;
      const soil = document.getElementById('soilSelect').value;
      const season = document.getElementById('seasonSelect').value;

      if (!state.currentWeather) {
        showToast('Please wait for weather data to load', 'warning');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Analyzing...';
      responseEl.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p>🤖 AI is generating personalized recommendations...</p></div>';

      try {
        const w = state.currentWeather;
        const systemPrompt = `You are an expert agricultural advisor AI for Indian farmers. 
You provide practical, actionable farming recommendations based on weather conditions, soil types, and crop requirements.
Always respond in a structured format with clear sections.
Consider local farming practices, seasonal patterns, and sustainable agriculture methods.
Focus on: planting schedules, irrigation advice, pest/disease warnings, harvest timing, and cost-saving tips.`;

        const userPrompt = `Based on the following conditions, provide detailed farming recommendations:

**Location:** ${w.name}
**Current Weather:** 
- Temperature: ${w.main.temp}°C
- Humidity: ${w.main.humidity}%
- Wind Speed: ${w.wind.speed} m/s
- Condition: ${w.weather[0].description}
- Rainfall: ${w.rain ? (w.rain['1h'] || 0) : 0} mm

**Crop Type:** ${crop}
**Soil Type:** ${soil}
**Season:** ${season}

${getHistorySummary() ? '**Historical Weather Pattern:** ' + getHistorySummary() : ''}

Please provide:
1. 🌱 **Planting Recommendation** - Is this a good time to plant? What crops to consider?
2. 💧 **Irrigation Advisory** - How much water is needed given the current conditions?
3. 🐛 **Pest & Disease Alert** - Any risks based on current weather?
4. 📅 **Weekly Action Plan** - What should the farmer do this week?
5. 💰 **Cost-Saving Tips** - How to save money based on weather predictions
6. ⚠️ **Weather Warnings** - Any extreme weather alerts?`;

        const data = await fetchAIRecommendation([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]);

        if (data.error) {
          responseEl.innerHTML = `<p style="color:var(--red-500);">⚠️ ${data.error.message || JSON.stringify(data.error)}</p>`;
        } else {
          responseEl.innerHTML = formatMarkdown(data.choices?.[0]?.message?.content || 'No recommendation available.');
        }
      } catch (err) {
        responseEl.innerHTML = '<p style="color:var(--red-500);">Failed to get recommendation. Try again.</p>';
      }

      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-magic"></i> Get AI Recommendation';
    });

    // Quick question
    document.getElementById('askAI')?.addEventListener('click', async () => {
      const question = document.getElementById('aiQuestion').value.trim();
      if (!question) return showToast('Please enter a question', 'warning');
      
      const responseEl = document.getElementById('aiResponse');
      const btn = document.getElementById('askAI');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Thinking...';
      responseEl.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p>🤖 Processing your question...</p></div>';

      try {
        const context = state.currentWeather
          ? `Current location: ${state.currentWeather.name}. Temperature: ${state.currentWeather.main.temp}°C, Humidity: ${state.currentWeather.main.humidity}%, Weather: ${state.currentWeather.weather[0].description}`
          : '';

        const data = await fetchAIRecommendation([
          { role: 'system', content: 'You are a helpful farming assistant. Give concise, practical answers to farming questions. Focus on Indian agriculture context.' },
          { role: 'user', content: `${context ? 'Context: ' + context + '\n\n' : ''}Question: ${question}` }
        ]);

        if (data.error) {
          responseEl.innerHTML = `<p style="color:var(--red-500);">⚠️ ${data.error.message || JSON.stringify(data.error)}</p>`;
        } else {
          responseEl.innerHTML = formatMarkdown(data.choices?.[0]?.message?.content || 'Unable to process your question.');
        }
      } catch (err) {
        responseEl.innerHTML = '<p style="color:var(--red-500);">Failed to process question.</p>';
      }

      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Ask';
    });
  }

  // ─── Forecast Page ──────────────────────────────────────────────
  function renderForecastPage() {
    if (!state.forecastData) return;
    const container = document.getElementById('forecastGrid');
    const dailyMap = {};

    state.forecastData.list.forEach(item => {
      const dateStr = new Date(item.dt * 1000).toLocaleDateString('en-IN');
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { temps: [], humidity: [], wind: [], rain: [], icons: [], descs: [], dt: item.dt };
      }
      dailyMap[dateStr].temps.push(item.main.temp);
      dailyMap[dateStr].humidity.push(item.main.humidity);
      dailyMap[dateStr].wind.push(item.wind.speed);
      dailyMap[dateStr].rain.push(item.pop || 0);
      dailyMap[dateStr].icons.push(item.weather[0].icon);
      dailyMap[dateStr].descs.push(item.weather[0].description);
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    container.innerHTML = Object.entries(dailyMap).map(([dateStr, d]) => {
      const date = new Date(d.dt * 1000);
      const high = Math.round(Math.max(...d.temps));
      const low = Math.round(Math.min(...d.temps));
      const avgHum = Math.round(d.humidity.reduce((s, v) => s + v, 0) / d.humidity.length);
      const avgWind = (d.wind.reduce((s, v) => s + v, 0) / d.wind.length).toFixed(1);
      const maxRain = Math.round(Math.max(...d.rain) * 100);
      const mainIcon = d.icons[Math.floor(d.icons.length / 2)];
      const mainDesc = d.descs[Math.floor(d.descs.length / 2)];

      return `
        <div class="forecast-day-card">
          <div class="forecast-day-header">
            <span class="forecast-day-name">${dayNames[date.getDay()]}</span>
            <span class="forecast-day-date">${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          </div>
          <div class="forecast-day-main">
            <span class="forecast-day-icon"><i class="${getWeatherIcon(mainIcon)}" style="color:${getWeatherColor(mainIcon)}"></i></span>
            <div class="forecast-day-temps">
              <div class="forecast-day-high">${high}°C</div>
              <div class="forecast-day-low">${low}°C</div>
            </div>
          </div>
          <p class="forecast-day-desc">${mainDesc}</p>
          <div class="forecast-day-details">
            <div class="forecast-detail"><i class="fas fa-droplet"></i> ${avgHum}%</div>
            <div class="forecast-detail"><i class="fas fa-wind"></i> ${avgWind} m/s</div>
            <div class="forecast-detail"><i class="fas fa-cloud-rain"></i> ${maxRain}% rain</div>
            <div class="forecast-detail"><i class="fas fa-temperature-half"></i> Range: ${low}°-${high}°</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ─── Plantation Page ────────────────────────────────────────────
  function renderPlantationPage() {
    renderCropCalendarRows();
    renderSuitabilityGrid();
  }

  function renderCropCalendarRows() {
    const cal = document.getElementById('cropCalendar');
    const currentMonth = new Date().getMonth() + 1;

    cal.querySelectorAll('.calendar-row:not(.header-row)').forEach(r => r.remove());

    cropCalendarData.forEach(crop => {
      const row = document.createElement('div');
      row.className = 'calendar-row';

      let html = `<div class="cal-crop">${crop.name}</div>`;
      for (let m = 1; m <= 12; m++) {
        let cls = 'cal-month';
        let text = '';
        if (crop.months.sowing.includes(m)) { cls += ' sowing'; text = 'Sow'; }
        else if (crop.months.growing.includes(m)) { cls += ' growing'; text = 'Grow'; }
        else if (crop.months.harvest.includes(m)) { cls += ' harvest'; text = 'Harvest'; }
        if (m === currentMonth) cls += ' current-month';
        html += `<div class="${cls}">${text}</div>`;
      }

      row.innerHTML = html;
      cal.appendChild(row);
    });
  }

  function renderSuitabilityGrid() {
    if (!state.currentWeather) return;
    const grid = document.getElementById('suitabilityGrid');
    const w = state.currentWeather;
    const temp = w.main.temp;
    const humidity = w.main.humidity;

    const crops = [
      { name: 'Rice', emoji: '🌾', idealTemp: [20, 35], idealHum: 60 },
      { name: 'Wheat', emoji: '🌿', idealTemp: [10, 25], idealHum: 40 },
      { name: 'Cotton', emoji: '🥬', idealTemp: [25, 40], idealHum: 50 },
      { name: 'Maize', emoji: '🌽', idealTemp: [20, 35], idealHum: 55 },
      { name: 'Sugarcane', emoji: '🎋', idealTemp: [20, 38], idealHum: 60 },
      { name: 'Tomato', emoji: '🍅', idealTemp: [15, 30], idealHum: 50 },
      { name: 'Potato', emoji: '🥔', idealTemp: [10, 25], idealHum: 60 },
      { name: 'Onion', emoji: '🧅', idealTemp: [13, 28], idealHum: 50 },
      { name: 'Soybean', emoji: '🫘', idealTemp: [20, 32], idealHum: 55 },
      { name: 'Chilli', emoji: '🌶️', idealTemp: [20, 35], idealHum: 60 },
    ];

    grid.innerHTML = crops.map(crop => {
      const tempOk = temp >= crop.idealTemp[0] && temp <= crop.idealTemp[1];
      const humOk = humidity >= crop.idealHum;
      const level = tempOk && humOk ? 'excellent' : tempOk || humOk ? 'good' : 'moderate';
      
      return `
        <div class="suitability-item">
          <span class="suitability-emoji">${crop.emoji}</span>
          <div class="suitability-info">
            <strong>${crop.name}</strong>
            <span>${crop.idealTemp[0]}°-${crop.idealTemp[1]}°C</span>
          </div>
          <span class="suitability-badge ${level}">${level}</span>
        </div>
      `;
    }).join('');
  }

  function setupCropCalendar() {
    renderCropCalendarRows();
  }

  // ─── Cost Calculator ────────────────────────────────────────────
  function setupCostCalculator() {
    document.getElementById('calcCost')?.addEventListener('click', () => {
      const area = parseFloat(document.getElementById('landArea').value) || 1;
      const crop = document.getElementById('costCrop').value;
      const costs = costData[crop];
      if (!costs) return;

      const resultEl = document.getElementById('costResult');
      const total = Object.values(costs).reduce((s, v) => s + v, 0) * area;

      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <h4>💰 Estimated Cost for ${area} acre(s) of ${crop.charAt(0).toUpperCase() + crop.slice(1)}</h4>
        <div class="cost-line"><span>🌱 Seeds</span><span>₹${(costs.seeds * area).toLocaleString('en-IN')}</span></div>
        <div class="cost-line"><span>🧪 Fertilizer</span><span>₹${(costs.fertilizer * area).toLocaleString('en-IN')}</span></div>
        <div class="cost-line"><span>🐛 Pesticide</span><span>₹${(costs.pesticide * area).toLocaleString('en-IN')}</span></div>
        <div class="cost-line"><span>👷 Labor</span><span>₹${(costs.labor * area).toLocaleString('en-IN')}</span></div>
        <div class="cost-line"><span>💧 Irrigation</span><span>₹${(costs.irrigation * area).toLocaleString('en-IN')}</span></div>
        <div class="cost-line"><span>📦 Miscellaneous</span><span>₹${(costs.misc * area).toLocaleString('en-IN')}</span></div>
        <div class="cost-line total"><span>Total Estimated Cost</span><span>₹${total.toLocaleString('en-IN')}</span></div>
      `;
    });
  }

  // ─── History Page ───────────────────────────────────────────────
  function renderHistoryPage() {
    if (!state.forecastData) return;
    renderHistoryCharts();
    renderHistoryTable();
  }

  function renderHistoryCharts() {
    const data = state.forecastData;
    const labels = [];
    const temps = [];
    const humidity = [];
    const rain = [];

    data.list.slice(0, 16).forEach(item => {
      const date = new Date(item.dt * 1000);
      labels.push(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
        date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      temps.push(item.main.temp);
      humidity.push(item.main.humidity);
      rain.push(item.rain ? (item.rain['3h'] || 0) : 0);
    });

    const tempCtx = document.getElementById('tempChart')?.getContext('2d');
    if (tempCtx) {
      if (window._tempChart) window._tempChart.destroy();
      window._tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Temperature (°C)',
            data: temps,
            borderColor: '#f44336',
            backgroundColor: 'rgba(244,67,54,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#f44336',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'top' } },
          scales: {
            x: { ticks: { maxRotation: 45, font: { size: 10 } } },
            y: { title: { display: true, text: '°C' } }
          }
        }
      });
    }

    const humCtx = document.getElementById('humidityChart')?.getContext('2d');
    if (humCtx) {
      if (window._humChart) window._humChart.destroy();
      window._humChart = new Chart(humCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Humidity (%)',
              data: humidity,
              backgroundColor: 'rgba(33,150,243,0.5)',
              borderColor: '#2196f3',
              borderWidth: 1,
              yAxisID: 'y',
            },
            {
              label: 'Rain (mm)',
              data: rain,
              type: 'line',
              borderColor: '#4caf50',
              backgroundColor: 'rgba(76,175,80,0.15)',
              fill: true,
              tension: 0.4,
              yAxisID: 'y1',
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'top' } },
          scales: {
            x: { ticks: { maxRotation: 45, font: { size: 10 } } },
            y: { title: { display: true, text: 'Humidity %' }, position: 'left' },
            y1: { title: { display: true, text: 'Rain (mm)' }, position: 'right', grid: { drawOnChartArea: false } },
          }
        }
      });
    }
  }

  function renderHistoryTable() {
    const tbody = document.getElementById('weatherTableBody');
    if (!state.forecastData) return;

    const dailyMap = {};
    state.forecastData.list.forEach(item => {
      const dateStr = new Date(item.dt * 1000).toLocaleDateString('en-IN');
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { temps: [], humidity: [], rain: [], wind: [], desc: [], dt: item.dt };
      }
      dailyMap[dateStr].temps.push(item.main.temp);
      dailyMap[dateStr].humidity.push(item.main.humidity);
      dailyMap[dateStr].rain.push(item.rain ? (item.rain['3h'] || 0) : 0);
      dailyMap[dateStr].wind.push(item.wind.speed);
      dailyMap[dateStr].desc.push(item.weather[0].description);
    });

    let html = Object.entries(dailyMap).map(([dateStr, d]) => {
      const avgTemp = (d.temps.reduce((s, v) => s + v, 0) / d.temps.length).toFixed(1);
      const avgHum = Math.round(d.humidity.reduce((s, v) => s + v, 0) / d.humidity.length);
      const totalRain = d.rain.reduce((s, v) => s + v, 0).toFixed(1);
      const avgWind = (d.wind.reduce((s, v) => s + v, 0) / d.wind.length).toFixed(1);
      const mainDesc = d.desc[Math.floor(d.desc.length / 2)];

      return `
        <tr>
          <td>${dateStr}</td>
          <td>${avgTemp}</td>
          <td>${avgHum}</td>
          <td>${totalRain}</td>
          <td>${avgWind}</td>
          <td style="text-transform:capitalize">${mainDesc}</td>
        </tr>
      `;
    }).join('');

    // Add saved history
    const savedHistory = loadHistory();
    savedHistory.forEach(item => {
      if (!dailyMap[item.date]) {
        html += `
          <tr>
            <td>${item.date}</td>
            <td>${item.temp}</td>
            <td>${item.humidity}</td>
            <td>${item.rain}</td>
            <td>${item.wind}</td>
            <td style="text-transform:capitalize">${item.condition}</td>
          </tr>
        `;
      }
    });

    tbody.innerHTML = html;
  }

  // ─── Local Storage History ──────────────────────────────────────
  function saveToHistory(data) {
    const history = loadHistory();
    const today = new Date().toLocaleDateString('en-IN');
    if (history.some(h => h.date === today && h.city === data.name)) return;

    history.unshift({
      date: today,
      temp: Math.round(data.main.temp),
      humidity: data.main.humidity,
      rain: data.rain ? (data.rain['1h'] || 0) : 0,
      wind: data.wind.speed,
      condition: data.weather[0].description,
      city: data.name,
    });

    localStorage.setItem('weatherHistory', JSON.stringify(history.slice(0, 30)));
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem('weatherHistory')) || [];
    } catch { return []; }
  }

  function getHistorySummary() {
    const history = loadHistory();
    if (history.length === 0) return '';
    return history.slice(0, 5).map(h =>
      `${h.date}: ${h.temp}°C, ${h.humidity}% humidity, ${h.condition}`
    ).join('; ');
  }

  // ─── Utility Functions ──────────────────────────────────────────
  function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'Zaid (Summer)';
    if (month >= 6 && month <= 9) return 'Kharif (Monsoon)';
    return 'Rabi (Winter)';
  }

  function formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/### (.*)/g, '<h4>$1</h4>')
      .replace(/## (.*)/g, '<h3>$1</h3>')
      .replace(/# (.*)/g, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\- (.*)/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideInToast 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ─── TRANSLATION MODULE ───────────────────────────────────────
  const translationState = {
    currentLang: 'en',
    cache: {},          // cache[lang][text] = translated
    isTranslating: false,
    originalTexts: new Map(), // element -> original English text
  };

  // ─── Translation API ───────────────────────────────────────────
  async function translateText(text, targetLang) {
    if (!text || !text.trim() || targetLang === 'en') return text;

    // Check cache
    const cacheKey = targetLang + '::' + text;
    if (translationState.cache[cacheKey]) {
      return translationState.cache[cacheKey];
    }

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      
      let translated = '';
      if (data && data[0]) {
        translated = data[0].map(item => item[0]).join('');
      } else {
        translated = text;
      }
      
      translationState.cache[cacheKey] = translated;
      return translated;
    } catch (err) {
      console.error('Translation error:', err);
      return text;
    }
  }

  // Batch translate multiple texts
  async function translateBatch(texts, targetLang) {
    if (targetLang === 'en') return texts;
    const results = [];
    // Process in chunks of 5 to avoid rate limiting
    for (let i = 0; i < texts.length; i += 5) {
      const batch = texts.slice(i, i + 5);
      const translated = await Promise.all(
        batch.map(t => translateText(t, targetLang))
      );
      results.push(...translated);
      // Small delay between batches
      if (i + 5 < texts.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }
    return results;
  }

  // ─── Collect Translatable Elements ─────────────────────────────
  function getTranslatableElements() {
    const elements = [];
    const selectors = [
      // Navigation & Headers
      '.nav-item span',
      '.logo-text span',
      '.card-title h3',
      '.page-header h2',
      '.page-header p',
      // Dashboard labels
      '.detail-label',
      '.sun-label',
      '.day-length',
      '.hero-desc h3',
      '.hero-desc p',
      // Buttons & labels
      '.location-btn .btn-text',
      '.primary-btn',
      '.see-all',
      // Cards content
      '.crop-info strong',
      '.crop-info span',
      '.crop-score',
      '.suitability-info strong',
      '.suitability-badge',
      // Form labels
      '.form-group label',
      // AI content
      '.ai-content',
      '.ai-response',
      // Alerts
      '.alert-content h4',
      '.alert-content p',
      // Season badge
      '.season-badge span',
      // Irrigation
      '.tip-item span',
      '.meter-label',
      // Mini forecast
      '.mini-desc',
      // Forecast
      '.forecast-day-desc',
      '.forecast-day-name',
      // Table headers
      '.weather-table th',
      // Cost
      '.cost-result h4',
      '.cost-line span:first-child',
      // Calendar header
      '.cal-crop',
      '.cal-month',
      // Placeholders
      '.ai-placeholder h4',
      '.ai-placeholder p',
    ];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        // Skip elements with only numbers/symbols or empty
        const text = el.textContent.trim();
        if (text && text.length > 1 && /[a-zA-Z]/.test(text)) {
          elements.push(el);
        }
      });
    });

    return elements;
  }

  // ─── Translate Page ────────────────────────────────────────────
  async function translatePage(targetLang) {
    if (translationState.isTranslating) return;
    if (targetLang === translationState.currentLang) return;

    translationState.isTranslating = true;
    showTranslatingIndicator(true);

    try {
      // If switching back to English, restore originals
      if (targetLang === 'en') {
        translationState.originalTexts.forEach((original, el) => {
          if (el && el.parentNode) {
            el.textContent = original;
          }
        });
        translationState.currentLang = 'en';
        showTranslatingIndicator(false);
        translationState.isTranslating = false;
        showToast('Switched to English', 'success');
        return;
      }

      const elements = getTranslatableElements();
      
      // Save originals (only if not saved already)
      elements.forEach(el => {
        if (!translationState.originalTexts.has(el)) {
          translationState.originalTexts.set(el, el.textContent.trim());
        }
      });

      // Get original texts to translate
      const textsToTranslate = elements.map(el => 
        translationState.originalTexts.get(el) || el.textContent.trim()
      );

      // Translate in batches
      const translated = await translateBatch(textsToTranslate, targetLang);

      // Apply translations
      elements.forEach((el, i) => {
        if (translated[i] && el.parentNode) {
          el.textContent = translated[i];
        }
      });

      translationState.currentLang = targetLang;
      showToast('✓ Page translated!', 'success');

    } catch (err) {
      console.error('Page translation failed:', err);
      showToast('Translation partially failed', 'warning');
    }

    showTranslatingIndicator(false);
    translationState.isTranslating = false;
  }

  // ─── Loading Indicator ─────────────────────────────────────────
  function showTranslatingIndicator(show) {
    let bar = document.getElementById('translateBar');
    if (show) {
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'translateBar';
        bar.className = 'translating-indicator';
        document.querySelector('.main-content').prepend(bar);
      }
      bar.style.opacity = '1';
    } else {
      if (bar) {
        bar.style.opacity = '0';
        setTimeout(() => bar?.remove(), 300);
      }
    }
  }

  // ─── Language Selector Setup ───────────────────────────────────
  function setupLanguageSelector() {
    const selector = document.getElementById('langSelector');
    const toggle = document.getElementById('langToggle');
    const dropdown = document.getElementById('langDropdown');
    const searchInput = document.getElementById('langSearchInput');
    const langList = document.getElementById('langList');
    const label = document.getElementById('currentLangLabel');

    if (!toggle) return;

    // Toggle dropdown
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      selector.classList.toggle('open');
      if (selector.classList.contains('open')) {
        searchInput.value = '';
        searchInput.focus();
        filterLanguages('');
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!selector.contains(e.target)) {
        selector.classList.remove('open');
      }
    });

    // Search filter
    searchInput.addEventListener('input', () => {
      filterLanguages(searchInput.value.toLowerCase());
    });

    // Language selection
    langList.addEventListener('click', (e) => {
      const option = e.target.closest('.lang-option');
      if (!option) return;

      const lang = option.dataset.lang;
      const langLabel = option.dataset.label;

      // Update active state
      langList.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');

      // Update toggle label
      label.textContent = langLabel;

      // Close dropdown
      selector.classList.remove('open');

      // Save preference
      localStorage.setItem('preferredLang', lang);

      // Translate page
      translatePage(lang);
    });

    // Load saved preference
    const savedLang = localStorage.getItem('preferredLang');
    if (savedLang && savedLang !== 'en') {
      const savedOption = langList.querySelector(`[data-lang="${savedLang}"]`);
      if (savedOption) {
        langList.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
        savedOption.classList.add('active');
        label.textContent = savedOption.dataset.label;
        // Translate after data loads (wait for weather data to render first)
        setTimeout(() => translatePage(savedLang), 5000);
      }
    }
  }

  function filterLanguages(query) {
    document.querySelectorAll('.lang-option').forEach(option => {
      const text = option.textContent.toLowerCase();
      option.classList.toggle('hidden', query && !text.includes(query));
    });
  }

  // Initialize language selector on DOM ready
  document.addEventListener('DOMContentLoaded', setupLanguageSelector);

})();
