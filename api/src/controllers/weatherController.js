const axios = require('axios').default;
const asyncHandler = require('express-async-handler');
const { weatherCacheTTL, WEATHER_CACHE_CLEANUP_MS } = require('../config');
const logger = require('../config/logger');

const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const MAX_CACHE_SIZE = 100;
const apiKey = process.env.OPEN_WEATHER_KEY;
const weatherCache = new Map();

// Clean expired cache entries periodically
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, value] of weatherCache) {
    if (value.expire < now) weatherCache.delete(key);
  }
  // Evict oldest entries if over capacity
  while (weatherCache.size > MAX_CACHE_SIZE) {
    const firstKey = weatherCache.keys().next().value;
    weatherCache.delete(firstKey);
  }
}, WEATHER_CACHE_CLEANUP_MS);

const getWeatherNow = asyncHandler(async (req, res) => {
  logger.debug('getWeatherNow called');
  const cityName = req.params.city;

  // Check cache and expiry
  const cached = weatherCache.get(cityName);
  const now = Math.floor(Date.now() / 1000);
  if (cached && now < cached.expire) {
    return res.json({ message: 'OK', data: cached, cached: true });
  }

  const apiUrl = `${WEATHER_API_URL}?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric&lang=th`;
  const response = await axios.get(apiUrl);
  const weatherData = response.data;
  weatherData.input_cityName = cityName;
  weatherData.expire = now + weatherCacheTTL;

  weatherCache.set(cityName, weatherData);
  res.json({ message: 'OK', data: weatherData, cached: false });
});

const getWeatherNowAll = asyncHandler(async (req, res) => {
  logger.debug('getWeatherNowAll called');
  res.json({ message: 'OK', data: Object.fromEntries(weatherCache) });
});

module.exports = { getWeatherNow, getWeatherNowAll };
