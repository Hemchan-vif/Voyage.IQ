"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
/**
 * GET /api/weather/geocode
 * Proxy for Open-Meteo Geocoding API to avoid CORS issues
 * Query params: name (city name)
 */
router.get('/geocode', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({
                error: 'Missing required parameter: name'
            });
        }
        console.log(`Geocoding request: "${name}"`);
        const response = await axios_1.default.get(GEOCODE_URL, {
            params: {
                name: name,
                count: 1,
                language: 'en',
                format: 'json'
            },
            timeout: 10000
        });
        console.log(`Geocoding result:`, response.data?.results?.[0]?.name || 'Not found');
        res.json(response.data);
    }
    catch (error) {
        console.error('Geocoding proxy error:', error.message);
        res.status(500).json({
            error: 'Geocoding failed',
            message: error.message
        });
    }
});
/**
 * GET /api/weather/forecast
 * Proxy for Open-Meteo Forecast API to avoid CORS issues
 * Query params: latitude, longitude, and other Open-Meteo params
 */
router.get('/forecast', async (req, res) => {
    try {
        const { latitude, longitude, ...otherParams } = req.query;
        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Missing required parameters: latitude and longitude'
            });
        }
        console.log(`Weather forecast request: lat=${latitude}, lon=${longitude}`);
        const response = await axios_1.default.get(WEATHER_URL, {
            params: {
                latitude,
                longitude,
                ...otherParams
            },
            timeout: 10000
        });
        res.json(response.data);
    }
    catch (error) {
        console.error('Weather proxy error:', error.message);
        res.status(500).json({
            error: 'Weather fetch failed',
            message: error.message
        });
    }
});
/**
 * GET /api/weather/current
 * Convenience endpoint for current weather
 * Query params: latitude, longitude
 */
router.get('/current', async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Missing required parameters: latitude and longitude'
            });
        }
        console.log(`Current weather request: lat=${latitude}, lon=${longitude}`);
        const response = await axios_1.default.get(WEATHER_URL, {
            params: {
                latitude,
                longitude,
                current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
                timezone: 'auto'
            },
            timeout: 10000
        });
        res.json(response.data);
    }
    catch (error) {
        console.error('Current weather proxy error:', error.message);
        res.status(500).json({
            error: 'Current weather fetch failed',
            message: error.message
        });
    }
});
exports.default = router;
