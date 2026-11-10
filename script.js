const API_KEY = "5e3cb83afcb65d108bfa39a77cfefdf6"; 
let currentCity = "Meerut";

const translations = {
  en: { langLabel: "Language:", searchBtn: "Search", placeholder: "Enter city name...", humidity: "Humidity", wind: "Wind Speed", feelsLike: "Feels Like", pressure: "Pressure", notFound: "City not found.", loading: "Fetching weather...", geoError: "Location denied or unavailable." },
  hi: { langLabel: "भाषा:", searchBtn: "खोजें", placeholder: "शहर दर्ज करें...", humidity: "नमी", wind: "हवा", feelsLike: "महसूस", pressure: "दबाव", notFound: "शहर नहीं मिला।", loading: "प्राप्त हो रहा है...", geoError: "स्थान अनुपलब्ध।" },
  es: { langLabel: "Idioma:", searchBtn: "Buscar", placeholder: "Ingrese ciudad...", humidity: "Humedad", wind: "Viento", feelsLike: "Sensación", pressure: "Presión", notFound: "Ciudad no encontrada.", loading: "Cargando clima...", geoError: "Acceso denegado." },
  fr: { langLabel: "Langue:", searchBtn: "Chercher", placeholder: "Entrez la ville...", humidity: "Humidité", wind: "Vitesse", feelsLike: "Ressenti", pressure: "Pression", notFound: "Ville non trouvée.", loading: "Chargement...", geoError: "Accès refusé." }
};

const langSelect = document.getElementById("langSelect");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const voiceBtn = document.getElementById("voiceBtn");
const geoBtn = document.getElementById("geoBtn");
const statusMessage = document.getElementById("statusMessage");
const weatherDisplay = document.getElementById("weatherDisplay");

// Dynamic Backgrounds based on weather
function updateBackground(weatherMain) {
  let bgUrl = "";
  const condition = weatherMain.toLowerCase();

  if (condition.includes("clear")) bgUrl = "https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=2574&auto=format&fit=crop";
  else if (condition.includes("cloud")) bgUrl = "https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=2574&auto=format&fit=crop";
  else if (condition.includes("rain") || condition.includes("drizzle")) bgUrl = "https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=80&w=2574&auto=format&fit=crop";
  else if (condition.includes("thunderstorm")) bgUrl = "https://images.unsplash.com/photo-1605727216801-e27ce1d0ce30?q=80&w=2574&auto=format&fit=crop";
  else if (condition.includes("snow")) bgUrl = "https://images.unsplash.com/photo-1478265409131-1f65c88f965c?q=80&w=2574&auto=format&fit=crop";
  else if (condition.includes("mist") || condition.includes("fog") || condition.includes("haze")) bgUrl = "https://images.unsplash.com/photo-1543968996-ee822b817625?q=80&w=2574&auto=format&fit=crop";
  else bgUrl = "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?q=80&w=2574&auto=format&fit=crop";

  document.body.style.backgroundImage = `url('${bgUrl}')`;
}

function updateUILanguage(lang) {
  const dict = translations[lang] || translations.en;
  searchBtn.textContent = dict.searchBtn;
  if(!voiceBtn.classList.contains("listening")) cityInput.placeholder = dict.placeholder;
  document.getElementById("labelHumidity").textContent = dict.humidity;
  document.getElementById("labelWind").textContent = dict.wind;
  document.getElementById("labelFeelsLike").textContent = dict.feelsLike;
  document.getElementById("labelPressure").textContent = dict.pressure;
}

// Fetch Logic
async function fetchWeatherByCity(city, lang) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=${lang}&appid=${API_KEY}`;
  await executeFetch(url, lang);
}

async function fetchWeatherByCoords(lat, lon, lang) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=${lang}&appid=${API_KEY}`;
  await executeFetch(url, lang);
}

async function executeFetch(url, lang) {
  const dict = translations[lang] || translations.en;
  searchBtn.disabled = true;
  statusMessage.textContent = dict.loading;

  // Session Storage Cache Check
  const cachedData = sessionStorage.getItem(url);
  if (cachedData) {
    const data = JSON.parse(cachedData);
    renderWeather(data);
    currentCity = data.name;
    statusMessage.textContent = "";
    searchBtn.disabled = false;
    return;
  }

  // Set timeout to prevent infinite hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error("Not Found");

    const data = await response.json();
    sessionStorage.setItem(url, JSON.stringify(data)); // Save to cache
    
    renderWeather(data);
    currentCity = data.name;
    statusMessage.textContent = "";
  } catch (error) {
    statusMessage.textContent = error.name === 'AbortError' ? "Request timed out." : dict.notFound;
    weatherDisplay.classList.add("hidden");
  } finally {
    searchBtn.disabled = false;
  }
}

function renderWeather(data) {
  updateBackground(data.weather[0].main);

  document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country || ""}`;
  document.getElementById("temperature").textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById("description").textContent = data.weather[0].description;
  document.getElementById("humidity").textContent = `${data.main.humidity}%`;
  document.getElementById("windSpeed").textContent = `${data.wind.speed} m/s`;
  document.getElementById("feelsLike").textContent = `${Math.round(data.main.feels_like)}°C`;
  document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;

  const iconCode = data.weather[0].icon;
  const iconImg = document.getElementById("weatherIcon");
  iconImg.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  iconImg.style.display = "block";

  weatherDisplay.classList.remove("hidden");
}

// --- VOICE SEARCH API ---
// --- VOICE SEARCH API (DIAGNOSTIC VERSION) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  voiceBtn.addEventListener("click", () => {
    const langMap = { en: 'en-US', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR' };
    recognition.lang = langMap[langSelect.value] || 'en-US';
    
    console.log(`Starting voice recognition for language: ${recognition.lang}`);
    try {
      recognition.start();
    } catch (e) {
      console.error("Recognition start error (usually means it's already running):", e);
    }
  });

  recognition.onaudiostart = () => console.log("Audio capturing started (Mic is hot)");
  recognition.onsoundstart = () => console.log("Sound detected (Noise is happening)");
  recognition.onspeechstart = () => console.log("Speech detected (Words recognized)");

  recognition.onstart = () => {
    console.log("Recognition service successfully started.");
    voiceBtn.classList.add("listening");
    cityInput.placeholder = langSelect.value === 'hi' ? "सुन रहा हूँ..." : "Listening...";
    statusMessage.textContent = ""; 
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("Transcript received:", transcript);
    cityInput.value = transcript.replace(/[.,]/g, ''); 
    searchBtn.click();
  };

  recognition.onend = () => {
    console.log("Recognition service ended.");
    voiceBtn.classList.remove("listening");
    updateUILanguage(langSelect.value);
  };

  recognition.onerror = (event) => {
    console.error("Speech Recognition Error Fired:", event.error);
    voiceBtn.classList.remove("listening");
    updateUILanguage(langSelect.value);
    
    // Display the exact error in the UI
    statusMessage.style.color = "#ff6b6b";
    switch(event.error) {
      case 'no-speech':
        statusMessage.textContent = "Mic is on, but no speech was detected. Check input volume.";
        break;
      case 'audio-capture':
        statusMessage.textContent = "No microphone found. OS might be blocking it.";
        break;
      case 'not-allowed':
        statusMessage.textContent = "Permission to use mic was denied.";
        break;
      case 'network':
        statusMessage.textContent = "Network error. Browser blocked the speech service connection.";
        break;
      default:
        statusMessage.textContent = `Voice error: ${event.error}`;
    }
  };
} else {
  console.warn("Speech Recognition API is not supported in this browser.");
  voiceBtn.style.display = "none";
}

// Init
updateUILanguage("en");
fetchWeatherByCity(currentCity, "en");