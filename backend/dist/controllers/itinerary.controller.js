"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItineraryController = void 0;
const express_validator_1 = require("express-validator");
const database_1 = __importDefault(require("../config/database"));
const axios_1 = __importDefault(require("axios"));
// Helper function to parse media_paths (can be JSON array or comma-separated string)
function parseMediaPaths(mediaPaths) {
    if (!mediaPaths)
        return [];
    if (Array.isArray(mediaPaths))
        return mediaPaths;
    if (typeof mediaPaths === 'string') {
        if (mediaPaths.startsWith('[')) {
            try {
                return JSON.parse(mediaPaths);
            }
            catch {
                return mediaPaths.split(',').map(p => p.trim()).filter(p => p);
            }
        }
        return mediaPaths.split(',').map(p => p.trim()).filter(p => p);
    }
    return [];
}
class ItineraryController {
    constructor() {
        // City coordinates database for reliable geocoding
        this.cityCoordinates = {
            // Europe
            'paris': { lat: 48.8566, lon: 2.3522 },
            'london': { lat: 51.5074, lon: -0.1278 },
            'rome': { lat: 41.9028, lon: 12.4964 },
            'barcelona': { lat: 41.3851, lon: 2.1734 },
            'amsterdam': { lat: 52.3676, lon: 4.9041 },
            'berlin': { lat: 52.52, lon: 13.405 },
            'vienna': { lat: 48.2082, lon: 16.3738 },
            'prague': { lat: 50.0755, lon: 14.4378 },
            'athens': { lat: 37.9838, lon: 23.7275 },
            'lisbon': { lat: 38.7223, lon: -9.1393 },
            'madrid': { lat: 40.4168, lon: -3.7038 },
            'venice': { lat: 45.4408, lon: 12.3155 },
            'florence': { lat: 43.7696, lon: 11.2558 },
            'munich': { lat: 48.1351, lon: 11.582 },
            'zurich': { lat: 47.3769, lon: 8.5417 },
            'brussels': { lat: 50.8503, lon: 4.3517 },
            'stockholm': { lat: 59.3293, lon: 18.0686 },
            'copenhagen': { lat: 55.6761, lon: 12.5683 },
            'oslo': { lat: 59.9139, lon: 10.7522 },
            'dublin': { lat: 53.3498, lon: -6.2603 },
            'edinburgh': { lat: 55.9533, lon: -3.1883 },
            // Asia
            'tokyo': { lat: 35.6762, lon: 139.6503 },
            'kyoto': { lat: 35.0116, lon: 135.7681 },
            'osaka': { lat: 34.6937, lon: 135.5023 },
            'singapore': { lat: 1.3521, lon: 103.8198 },
            'hong kong': { lat: 22.3193, lon: 114.1694 },
            'bangkok': { lat: 13.7563, lon: 100.5018 },
            'seoul': { lat: 37.5665, lon: 126.978 },
            'beijing': { lat: 39.9042, lon: 116.4074 },
            'shanghai': { lat: 31.2304, lon: 121.4737 },
            'dubai': { lat: 25.2048, lon: 55.2708 },
            'mumbai': { lat: 19.076, lon: 72.8777 },
            'delhi': { lat: 28.7041, lon: 77.1025 },
            'bali': { lat: -8.4095, lon: 115.1889 },
            'kuala lumpur': { lat: 3.139, lon: 101.6869 },
            'taipei': { lat: 25.033, lon: 121.5654 },
            'istanbul': { lat: 41.0082, lon: 28.9784 },
            // Americas
            'new york': { lat: 40.7128, lon: -74.006 },
            'los angeles': { lat: 34.0522, lon: -118.2437 },
            'san francisco': { lat: 37.7749, lon: -122.4194 },
            'las vegas': { lat: 36.1699, lon: -115.1398 },
            'miami': { lat: 25.7617, lon: -80.1918 },
            'chicago': { lat: 41.8781, lon: -87.6298 },
            'boston': { lat: 42.3601, lon: -71.0589 },
            'washington': { lat: 38.9072, lon: -77.0369 },
            'seattle': { lat: 47.6062, lon: -122.3321 },
            'toronto': { lat: 43.6532, lon: -79.3832 },
            'vancouver': { lat: 49.2827, lon: -123.1207 },
            'mexico city': { lat: 19.4326, lon: -99.1332 },
            'cancun': { lat: 21.1619, lon: -86.8515 },
            'rio de janeiro': { lat: -22.9068, lon: -43.1729 },
            'buenos aires': { lat: -34.6037, lon: -58.3816 },
            // Oceania
            'sydney': { lat: -33.8688, lon: 151.2093 },
            'melbourne': { lat: -37.8136, lon: 144.9631 },
            'auckland': { lat: -36.8485, lon: 174.7633 },
            // Africa
            'cairo': { lat: 30.0444, lon: 31.2357 },
            'cape town': { lat: -33.9249, lon: 18.4241 },
            'marrakech': { lat: 31.6295, lon: -7.9811 },
            // India
            'jaipur': { lat: 26.9124, lon: 75.7873 },
            'goa': { lat: 15.2993, lon: 74.124 },
            'agra': { lat: 27.1767, lon: 78.0081 },
            'bangalore': { lat: 12.9716, lon: 77.5946 },
            'chennai': { lat: 13.0827, lon: 80.2707 },
            'kolkata': { lat: 22.5726, lon: 88.3639 },
            'hyderabad': { lat: 17.385, lon: 78.4867 },
            'kerala': { lat: 10.8505, lon: 76.2711 },
            'varanasi': { lat: 25.3176, lon: 82.9739 },
            'udaipur': { lat: 24.5854, lon: 73.7125 },
            // France
            'france': { lat: 48.8566, lon: 2.3522 }, // Default to Paris
            'nice': { lat: 43.7102, lon: 7.262 },
            'lyon': { lat: 45.764, lon: 4.8357 },
            'marseille': { lat: 43.2965, lon: 5.3698 },
        };
    }
    // Fetch real attractions using Geoapify Places API
    async fetchRealPlaces(destination) {
        const cityName = destination.split(',')[0].trim().toLowerCase();
        console.log(`Fetching real places for: ${cityName}`);
        const apiKey = process.env.GEOAPIFY_API_KEY || '6a8acffbf63449619c9f4161cd8e13e2';
        // Get coordinates for the city
        let lat, lon;
        if (this.cityCoordinates[cityName]) {
            lat = this.cityCoordinates[cityName].lat;
            lon = this.cityCoordinates[cityName].lon;
        }
        else {
            // Try geocoding the city name
            try {
                const geocodeResponse = await axios_1.default.get(`https://api.geoapify.com/v1/geocode/search`, {
                    params: {
                        text: destination,
                        apiKey: apiKey,
                        limit: 1
                    }
                });
                if (geocodeResponse.data.features && geocodeResponse.data.features.length > 0) {
                    const coords = geocodeResponse.data.features[0].geometry.coordinates;
                    lon = coords[0];
                    lat = coords[1];
                    console.log(`Geocoded ${destination} to lat:${lat}, lon:${lon}`);
                }
                else {
                    console.log(`Could not geocode ${destination}, using city-specific activities`);
                    return this.getCitySpecificActivities(destination);
                }
            }
            catch (geoError) {
                console.log(`Geocoding failed for ${destination}, using city-specific activities`);
                return this.getCitySpecificActivities(destination);
            }
        }
        try {
            // Fetch tourist attractions using Geoapify Places API
            const placesResponse = await axios_1.default.get(`https://api.geoapify.com/v2/places`, {
                params: {
                    categories: 'tourism.sights,tourism.attraction,entertainment.museum,heritage',
                    filter: `circle:${lon},${lat},15000`,
                    limit: 20,
                    apiKey: apiKey
                }
            });
            if (!placesResponse.data.features || placesResponse.data.features.length === 0) {
                console.log('No places found from Geoapify, using city-specific activities');
                return this.getCitySpecificActivities(destination);
            }
            const places = placesResponse.data.features.map((feature) => {
                const props = feature.properties;
                const categories = props.categories || [];
                return {
                    name: props.name || props.address_line1 || 'Unknown Place',
                    kinds: categories.join(','),
                    duration: this.estimateDurationFromCategory(categories),
                    cost: this.estimateCostFromCategory(categories)
                };
            }).filter((place) => place.name && place.name !== 'Unknown Place');
            console.log(`Found ${places.length} real places from Geoapify for ${cityName}`);
            if (places.length < 5) {
                // Supplement with city-specific activities if not enough results
                const cityActivities = this.getCitySpecificActivities(destination);
                return [...places, ...cityActivities].slice(0, 20);
            }
            return places;
        }
        catch (error) {
            console.error('Geoapify API error:', error);
            return this.getCitySpecificActivities(destination);
        }
    }
    estimateDurationFromCategory(categories) {
        const catStr = categories.join(',').toLowerCase();
        if (catStr.includes('museum'))
            return 3;
        if (catStr.includes('castle') || catStr.includes('palace'))
            return 2.5;
        if (catStr.includes('park') || catStr.includes('garden'))
            return 2;
        if (catStr.includes('church') || catStr.includes('temple'))
            return 1.5;
        if (catStr.includes('monument') || catStr.includes('memorial'))
            return 1;
        if (catStr.includes('entertainment'))
            return 2.5;
        return 2;
    }
    estimateCostFromCategory(categories) {
        const catStr = categories.join(',').toLowerCase();
        if (catStr.includes('museum'))
            return 15;
        if (catStr.includes('castle') || catStr.includes('palace'))
            return 20;
        if (catStr.includes('entertainment'))
            return 25;
        if (catStr.includes('park') || catStr.includes('garden'))
            return 0;
        if (catStr.includes('church') || catStr.includes('memorial'))
            return 0;
        if (catStr.includes('heritage'))
            return 10;
        return 10;
    }
    estimateDuration(kinds) {
        if (kinds.includes('museums'))
            return 3;
        if (kinds.includes('theatres_and_entertainments'))
            return 2.5;
        if (kinds.includes('natural'))
            return 2;
        if (kinds.includes('cultural'))
            return 2;
        return 2;
    }
    estimateCost(kinds) {
        if (kinds.includes('museums'))
            return 25;
        if (kinds.includes('amusements'))
            return 50;
        if (kinds.includes('theatres'))
            return 40;
        if (kinds.includes('natural'))
            return 0;
        if (kinds.includes('cultural'))
            return 15;
        return 20;
    }
    getFallbackActivities() {
        return [
            { name: 'City Walking Tour', kinds: 'tour', duration: 3, cost: 25 },
            { name: 'Local Museum Visit', kinds: 'museum', duration: 2.5, cost: 20 },
            { name: 'Historic Landmark Tour', kinds: 'historic', duration: 2, cost: 15 },
            { name: 'Local Market Experience', kinds: 'shopping', duration: 2, cost: 20 },
            { name: 'Traditional Cuisine Tasting', kinds: 'food', duration: 2, cost: 40 },
            { name: 'Park & Gardens Visit', kinds: 'nature', duration: 2, cost: 0 },
            { name: 'Cultural Performance', kinds: 'cultural', duration: 2, cost: 35 }
        ];
    }
    // City-specific real attractions for popular destinations
    getCitySpecificActivities(destination) {
        const cityName = destination.split(',')[0].trim().toLowerCase();
        const cityActivities = {
            // France / Paris
            'paris': [
                { name: 'Eiffel Tower', kinds: 'architecture,monuments', duration: 3, cost: 28 },
                { name: 'Louvre Museum', kinds: 'museums,art', duration: 4, cost: 17 },
                { name: 'Notre-Dame Cathedral', kinds: 'churches,historic', duration: 1.5, cost: 0 },
                { name: 'Arc de Triomphe', kinds: 'monuments,architecture', duration: 1.5, cost: 13 },
                { name: 'Sacré-Cœur Basilica', kinds: 'churches,cultural', duration: 2, cost: 0 },
                { name: 'Musée d\'Orsay', kinds: 'museums,art', duration: 3, cost: 16 },
                { name: 'Palace of Versailles', kinds: 'historic,palaces', duration: 5, cost: 20 },
                { name: 'Champs-Élysées Walk', kinds: 'streets,shopping', duration: 2, cost: 0 },
                { name: 'Seine River Cruise', kinds: 'boat,sightseeing', duration: 1.5, cost: 15 },
                { name: 'Montmartre District', kinds: 'neighborhoods,cultural', duration: 3, cost: 0 },
                { name: 'Centre Pompidou', kinds: 'museums,modern_art', duration: 2.5, cost: 14 },
                { name: 'Luxembourg Gardens', kinds: 'parks,nature', duration: 2, cost: 0 },
                { name: 'Moulin Rouge Area', kinds: 'entertainment,cultural', duration: 2, cost: 0 },
                { name: 'Le Marais District', kinds: 'neighborhoods,historic', duration: 2.5, cost: 0 },
                { name: 'Tuileries Garden', kinds: 'parks,nature', duration: 1.5, cost: 0 }
            ],
            'france': [
                { name: 'Eiffel Tower', kinds: 'architecture,monuments', duration: 3, cost: 28 },
                { name: 'Louvre Museum', kinds: 'museums,art', duration: 4, cost: 17 },
                { name: 'Notre-Dame Cathedral', kinds: 'churches,historic', duration: 1.5, cost: 0 },
                { name: 'Arc de Triomphe', kinds: 'monuments,architecture', duration: 1.5, cost: 13 },
                { name: 'Sacré-Cœur Basilica', kinds: 'churches,cultural', duration: 2, cost: 0 },
                { name: 'Musée d\'Orsay', kinds: 'museums,art', duration: 3, cost: 16 },
                { name: 'Palace of Versailles', kinds: 'historic,palaces', duration: 5, cost: 20 },
                { name: 'Champs-Élysées Walk', kinds: 'streets,shopping', duration: 2, cost: 0 },
                { name: 'Seine River Cruise', kinds: 'boat,sightseeing', duration: 1.5, cost: 15 },
                { name: 'Montmartre District', kinds: 'neighborhoods,cultural', duration: 3, cost: 0 },
                { name: 'Centre Pompidou', kinds: 'museums,modern_art', duration: 2.5, cost: 14 },
                { name: 'Luxembourg Gardens', kinds: 'parks,nature', duration: 2, cost: 0 }
            ],
            // London
            'london': [
                { name: 'Tower of London', kinds: 'historic,castles', duration: 3, cost: 30 },
                { name: 'British Museum', kinds: 'museums,history', duration: 4, cost: 0 },
                { name: 'Buckingham Palace', kinds: 'palaces,royal', duration: 2, cost: 30 },
                { name: 'Westminster Abbey', kinds: 'churches,historic', duration: 2, cost: 25 },
                { name: 'Big Ben & Parliament', kinds: 'monuments,architecture', duration: 1, cost: 0 },
                { name: 'London Eye', kinds: 'amusements,views', duration: 1.5, cost: 32 },
                { name: 'Tower Bridge', kinds: 'bridges,architecture', duration: 1.5, cost: 12 },
                { name: 'Hyde Park', kinds: 'parks,nature', duration: 2, cost: 0 },
                { name: 'St. Paul\'s Cathedral', kinds: 'churches,architecture', duration: 2, cost: 21 },
                { name: 'Natural History Museum', kinds: 'museums,science', duration: 3, cost: 0 },
                { name: 'Camden Market', kinds: 'markets,shopping', duration: 2.5, cost: 0 },
                { name: 'Covent Garden', kinds: 'entertainment,shopping', duration: 2, cost: 0 }
            ],
            // New York
            'new york': [
                { name: 'Statue of Liberty', kinds: 'monuments,iconic', duration: 4, cost: 24 },
                { name: 'Empire State Building', kinds: 'architecture,views', duration: 2, cost: 44 },
                { name: 'Central Park', kinds: 'parks,nature', duration: 3, cost: 0 },
                { name: 'Times Square', kinds: 'squares,entertainment', duration: 1.5, cost: 0 },
                { name: 'Metropolitan Museum of Art', kinds: 'museums,art', duration: 4, cost: 30 },
                { name: 'Brooklyn Bridge Walk', kinds: 'bridges,walking', duration: 2, cost: 0 },
                { name: '9/11 Memorial', kinds: 'memorials,historic', duration: 2, cost: 26 },
                { name: 'Top of the Rock', kinds: 'views,architecture', duration: 1.5, cost: 40 },
                { name: 'High Line Park', kinds: 'parks,urban', duration: 2, cost: 0 },
                { name: 'Broadway Show', kinds: 'entertainment,cultural', duration: 3, cost: 150 },
                { name: 'Grand Central Terminal', kinds: 'architecture,historic', duration: 1, cost: 0 },
                { name: 'Fifth Avenue Shopping', kinds: 'shopping,streets', duration: 2.5, cost: 0 }
            ],
            // Tokyo
            'tokyo': [
                { name: 'Senso-ji Temple', kinds: 'temples,historic', duration: 2, cost: 0 },
                { name: 'Tokyo Skytree', kinds: 'architecture,views', duration: 2, cost: 21 },
                { name: 'Shibuya Crossing', kinds: 'squares,urban', duration: 1, cost: 0 },
                { name: 'Meiji Shrine', kinds: 'shrines,cultural', duration: 2, cost: 0 },
                { name: 'Tokyo Tower', kinds: 'monuments,views', duration: 1.5, cost: 12 },
                { name: 'Tsukiji Outer Market', kinds: 'markets,food', duration: 2.5, cost: 30 },
                { name: 'Akihabara Electric Town', kinds: 'shopping,technology', duration: 3, cost: 0 },
                { name: 'Imperial Palace Gardens', kinds: 'parks,historic', duration: 2, cost: 0 },
                { name: 'Harajuku District', kinds: 'neighborhoods,fashion', duration: 2, cost: 0 },
                { name: 'TeamLab Borderless', kinds: 'museums,digital_art', duration: 3, cost: 32 },
                { name: 'Ueno Park & Museums', kinds: 'parks,museums', duration: 3, cost: 10 },
                { name: 'Shinjuku Gyoen Garden', kinds: 'gardens,nature', duration: 2, cost: 5 }
            ],
            // Dubai
            'dubai': [
                { name: 'Burj Khalifa', kinds: 'architecture,views', duration: 2.5, cost: 50 },
                { name: 'Dubai Mall', kinds: 'shopping,entertainment', duration: 4, cost: 0 },
                { name: 'Palm Jumeirah', kinds: 'islands,beach', duration: 3, cost: 0 },
                { name: 'Dubai Marina Walk', kinds: 'waterfront,walking', duration: 2, cost: 0 },
                { name: 'Burj Al Arab View', kinds: 'architecture,iconic', duration: 1, cost: 0 },
                { name: 'Gold Souk', kinds: 'markets,shopping', duration: 2, cost: 0 },
                { name: 'Dubai Creek Dhow Cruise', kinds: 'boat,sightseeing', duration: 2, cost: 25 },
                { name: 'Dubai Frame', kinds: 'architecture,views', duration: 1.5, cost: 15 },
                { name: 'Desert Safari', kinds: 'adventure,desert', duration: 6, cost: 75 },
                { name: 'Atlantis Aquaventure', kinds: 'waterpark,amusements', duration: 5, cost: 90 },
                { name: 'Spice Souk', kinds: 'markets,cultural', duration: 1.5, cost: 0 },
                { name: 'Jumeirah Beach', kinds: 'beach,relaxation', duration: 3, cost: 0 }
            ],
            // Mumbai
            'mumbai': [
                { name: 'Gateway of India', kinds: 'monuments,historic', duration: 1.5, cost: 0 },
                { name: 'Elephanta Caves', kinds: 'caves,historic', duration: 4, cost: 10 },
                { name: 'Marine Drive', kinds: 'waterfront,walking', duration: 2, cost: 0 },
                { name: 'Chhatrapati Shivaji Terminus', kinds: 'architecture,historic', duration: 1, cost: 0 },
                { name: 'Dhobi Ghat', kinds: 'cultural,unique', duration: 1.5, cost: 0 },
                { name: 'Haji Ali Dargah', kinds: 'religious,architecture', duration: 1.5, cost: 0 },
                { name: 'Sanjay Gandhi National Park', kinds: 'parks,nature', duration: 4, cost: 5 },
                { name: 'Colaba Causeway Shopping', kinds: 'shopping,markets', duration: 2.5, cost: 0 },
                { name: 'Bollywood Studio Tour', kinds: 'entertainment,tours', duration: 3, cost: 35 },
                { name: 'Juhu Beach', kinds: 'beach,local', duration: 2, cost: 0 },
                { name: 'Chor Bazaar', kinds: 'markets,antiques', duration: 2, cost: 0 },
                { name: 'Siddhivinayak Temple', kinds: 'temples,religious', duration: 1.5, cost: 0 }
            ],
            // Singapore
            'singapore': [
                { name: 'Marina Bay Sands', kinds: 'architecture,iconic', duration: 2, cost: 23 },
                { name: 'Gardens by the Bay', kinds: 'gardens,nature', duration: 3, cost: 28 },
                { name: 'Sentosa Island', kinds: 'entertainment,beach', duration: 5, cost: 40 },
                { name: 'Singapore Zoo', kinds: 'zoo,nature', duration: 4, cost: 45 },
                { name: 'Orchard Road Shopping', kinds: 'shopping,streets', duration: 3, cost: 0 },
                { name: 'Clarke Quay', kinds: 'entertainment,nightlife', duration: 2.5, cost: 0 },
                { name: 'Chinatown Heritage', kinds: 'neighborhoods,cultural', duration: 2, cost: 0 },
                { name: 'Little India', kinds: 'neighborhoods,cultural', duration: 2, cost: 0 },
                { name: 'Merlion Park', kinds: 'monuments,iconic', duration: 1, cost: 0 },
                { name: 'ArtScience Museum', kinds: 'museums,modern', duration: 2.5, cost: 20 },
                { name: 'Hawker Centre Food Tour', kinds: 'food,cultural', duration: 2, cost: 15 },
                { name: 'Night Safari', kinds: 'zoo,night', duration: 3, cost: 55 }
            ],
            // Rome
            'rome': [
                { name: 'Colosseum', kinds: 'historic,monuments', duration: 3, cost: 18 },
                { name: 'Vatican Museums', kinds: 'museums,art', duration: 4, cost: 20 },
                { name: 'St. Peter\'s Basilica', kinds: 'churches,architecture', duration: 2, cost: 0 },
                { name: 'Sistine Chapel', kinds: 'art,churches', duration: 1.5, cost: 0 },
                { name: 'Trevi Fountain', kinds: 'fountains,monuments', duration: 1, cost: 0 },
                { name: 'Roman Forum', kinds: 'historic,ruins', duration: 2.5, cost: 16 },
                { name: 'Pantheon', kinds: 'temples,architecture', duration: 1.5, cost: 0 },
                { name: 'Spanish Steps', kinds: 'monuments,squares', duration: 1, cost: 0 },
                { name: 'Piazza Navona', kinds: 'squares,baroque', duration: 1, cost: 0 },
                { name: 'Borghese Gallery', kinds: 'museums,art', duration: 2.5, cost: 15 },
                { name: 'Trastevere District', kinds: 'neighborhoods,food', duration: 3, cost: 0 },
                { name: 'Castel Sant\'Angelo', kinds: 'castles,historic', duration: 2, cost: 15 }
            ],
            // Barcelona
            'barcelona': [
                { name: 'La Sagrada Familia', kinds: 'churches,architecture', duration: 2.5, cost: 26 },
                { name: 'Park Güell', kinds: 'parks,architecture', duration: 2, cost: 10 },
                { name: 'La Rambla', kinds: 'streets,walking', duration: 2, cost: 0 },
                { name: 'Gothic Quarter', kinds: 'neighborhoods,historic', duration: 2.5, cost: 0 },
                { name: 'Casa Batlló', kinds: 'architecture,modernist', duration: 1.5, cost: 35 },
                { name: 'Camp Nou Stadium', kinds: 'sports,tours', duration: 2.5, cost: 28 },
                { name: 'La Boqueria Market', kinds: 'markets,food', duration: 1.5, cost: 0 },
                { name: 'Barceloneta Beach', kinds: 'beach,relaxation', duration: 3, cost: 0 },
                { name: 'Picasso Museum', kinds: 'museums,art', duration: 2, cost: 12 },
                { name: 'Montjuïc Castle', kinds: 'castles,views', duration: 2.5, cost: 9 },
                { name: 'Casa Milà (La Pedrera)', kinds: 'architecture,modernist', duration: 1.5, cost: 25 },
                { name: 'Magic Fountain Show', kinds: 'entertainment,night', duration: 1, cost: 0 }
            ],
            // Bangkok
            'bangkok': [
                { name: 'Grand Palace', kinds: 'palaces,temples', duration: 3, cost: 15 },
                { name: 'Wat Pho', kinds: 'temples,cultural', duration: 2, cost: 5 },
                { name: 'Wat Arun', kinds: 'temples,architecture', duration: 1.5, cost: 3 },
                { name: 'Chatuchak Weekend Market', kinds: 'markets,shopping', duration: 4, cost: 0 },
                { name: 'Khao San Road', kinds: 'streets,nightlife', duration: 2, cost: 0 },
                { name: 'Chao Phraya River Cruise', kinds: 'boat,sightseeing', duration: 2, cost: 20 },
                { name: 'Jim Thompson House', kinds: 'museums,architecture', duration: 1.5, cost: 6 },
                { name: 'Floating Markets', kinds: 'markets,cultural', duration: 4, cost: 25 },
                { name: 'Chinatown (Yaowarat)', kinds: 'neighborhoods,food', duration: 2.5, cost: 0 },
                { name: 'MBK Shopping Center', kinds: 'shopping,malls', duration: 2, cost: 0 },
                { name: 'Lumphini Park', kinds: 'parks,nature', duration: 2, cost: 0 },
                { name: 'Thai Cooking Class', kinds: 'cultural,food', duration: 3, cost: 40 }
            ],
            // Sydney
            'sydney': [
                { name: 'Sydney Opera House', kinds: 'architecture,iconic', duration: 2, cost: 43 },
                { name: 'Sydney Harbour Bridge', kinds: 'bridges,views', duration: 2, cost: 0 },
                { name: 'Bondi Beach', kinds: 'beach,surfing', duration: 4, cost: 0 },
                { name: 'Taronga Zoo', kinds: 'zoo,nature', duration: 4, cost: 47 },
                { name: 'The Rocks Historic Area', kinds: 'historic,neighborhoods', duration: 2.5, cost: 0 },
                { name: 'Royal Botanic Garden', kinds: 'gardens,nature', duration: 2, cost: 0 },
                { name: 'Darling Harbour', kinds: 'waterfront,entertainment', duration: 3, cost: 0 },
                { name: 'Manly Beach & Ferry', kinds: 'beach,boat', duration: 4, cost: 15 },
                { name: 'Queen Victoria Building', kinds: 'architecture,shopping', duration: 1.5, cost: 0 },
                { name: 'Blue Mountains Day Trip', kinds: 'nature,hiking', duration: 8, cost: 100 },
                { name: 'Sydney Fish Market', kinds: 'markets,food', duration: 1.5, cost: 0 },
                { name: 'Circular Quay Walk', kinds: 'waterfront,walking', duration: 1, cost: 0 }
            ]
        };
        // Return city-specific activities if available
        if (cityActivities[cityName]) {
            console.log(`Using city-specific activities for ${cityName}`);
            return cityActivities[cityName];
        }
        // Return generic fallback for unknown cities
        console.log(`No city-specific activities for ${cityName}, using generic fallback`);
        return this.getFallbackActivities();
    }
    // Generate activities from real or fallback places
    async generateActivities(destination, startDate, endDate, preferences) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        // Fetch real places from Geoapify API
        const realPlaces = await this.fetchRealPlaces(destination);
        // Remove duplicates by name
        const uniquePlaces = realPlaces.filter((place, index, self) => index === self.findIndex(p => p.name === place.name));
        console.log(`Got ${realPlaces.length} places, ${uniquePlaces.length} unique for ${destination}`);
        const activities = [];
        const timeSlots = ['09:00', '12:00', '15:00']; // Morning, Afternoon, Evening
        const totalActivitiesNeeded = days * 3;
        // If we don't have enough unique places, adjust activities per day
        const activitiesPerDay = Math.min(3, Math.ceil(uniquePlaces.length / days));
        let placeIndex = 0;
        const usedPlaces = new Set(); // Track used places to avoid repeats
        for (let i = 0; i < days; i++) {
            for (let j = 0; j < activitiesPerDay; j++) {
                // Stop if we've used all unique places
                if (placeIndex >= uniquePlaces.length) {
                    break;
                }
                const place = uniquePlaces[placeIndex];
                // Skip if already used (shouldn't happen with unique filter, but extra safety)
                if (usedPlaces.has(place.name)) {
                    placeIndex++;
                    j--; // Retry this slot
                    continue;
                }
                usedPlaces.add(place.name);
                activities.push({
                    name: place.name,
                    time: timeSlots[j],
                    duration: `${place.duration} hours`,
                    estimatedCost: place.cost,
                    location: destination
                });
                placeIndex++;
            }
        }
        // If we have very few activities, add some generic ones
        if (activities.length < days) {
            const genericActivities = [
                { name: 'City Walking Tour', duration: '3 hours', cost: 0 },
                { name: 'Local Market Visit', duration: '2 hours', cost: 10 },
                { name: 'Traditional Restaurant', duration: '2 hours', cost: 25 },
                { name: 'Cultural Experience', duration: '2 hours', cost: 15 },
                { name: 'Scenic Viewpoint', duration: '1 hours', cost: 0 }
            ];
            let genericIndex = 0;
            while (activities.length < days * 2 && genericIndex < genericActivities.length) {
                const generic = genericActivities[genericIndex];
                if (!usedPlaces.has(generic.name)) {
                    usedPlaces.add(generic.name);
                    activities.push({
                        name: generic.name,
                        time: timeSlots[activities.length % 3],
                        duration: generic.duration,
                        estimatedCost: generic.cost,
                        location: destination
                    });
                }
                genericIndex++;
            }
        }
        return activities;
    }
    async createItinerary(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            if (!req.user) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { destination, start_date, end_date, budget, activities, notes, preferences } = req.body;
            // Generate activities if not provided (using real API)
            const finalActivities = activities && activities.length > 0
                ? activities
                : await this.generateActivities(destination, start_date, end_date, preferences);
            const [result] = await database_1.default.query('INSERT INTO itineraries (user_id, destination, start_date, end_date, budget, activities, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.user.id, destination, start_date, end_date, budget, JSON.stringify(finalActivities), notes || null]);
            const itineraryId = result.insertId;
            res.status(201).json({
                message: 'Itinerary created successfully',
                itinerary: {
                    id: itineraryId,
                    user_id: req.user.id,
                    destination,
                    start_date,
                    end_date,
                    budget,
                    activities: finalActivities,
                    notes
                }
            });
        }
        catch (error) {
            console.error('Create itinerary error:', error);
            res.status(500).json({ error: 'Failed to create itinerary' });
        }
    }
    async getAllItineraries(req, res) {
        try {
            console.log('GetAllItineraries - User:', req.user);
            if (!req.user || !req.user.id) {
                console.error('User not authenticated or missing ID');
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { destination, startDate, endDate, minBudget, maxBudget } = req.query;
            let query = 'SELECT * FROM itineraries WHERE user_id = ?';
            const params = [req.user.id];
            if (destination) {
                query += ' AND destination LIKE ?';
                params.push(`%${destination}%`);
            }
            if (startDate) {
                query += ' AND start_date >= ?';
                params.push(startDate);
            }
            if (endDate) {
                query += ' AND end_date <= ?';
                params.push(endDate);
            }
            if (minBudget) {
                query += ' AND budget >= ?';
                params.push(minBudget);
            }
            if (maxBudget) {
                query += ' AND budget <= ?';
                params.push(maxBudget);
            }
            query += ' ORDER BY created_at DESC';
            const [itineraries] = await database_1.default.query(query, params);
            // Parse JSON fields only if they are strings
            const parsedItineraries = itineraries.map(itin => ({ ...itin,
                activities: typeof itin.activities === 'string' ? JSON.parse(itin.activities) : (itin.activities || []),
                media_paths: parseMediaPaths(itin.media_paths)
            }));
            res.json({ itineraries: parsedItineraries });
        }
        catch (error) {
            console.error('Get itineraries error:', error);
            res.status(500).json({ error: 'Failed to fetch itineraries' });
        }
    }
    async getItineraryById(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            if (!req.user) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { id } = req.params;
            const [itineraries] = await database_1.default.query('SELECT * FROM itineraries WHERE id = ? AND user_id = ?', [id, req.user.id]);
            if (!Array.isArray(itineraries) || itineraries.length === 0) {
                res.status(404).json({ error: 'Itinerary not found' });
                return;
            }
            const itinerary = itineraries[0];
            // Parse JSON fields only if they are strings
            itinerary.activities = typeof itinerary.activities === 'string'
                ? JSON.parse(itinerary.activities)
                : (itinerary.activities || []);
            itinerary.media_paths = parseMediaPaths(itinerary.media_paths);
            res.json({ itinerary });
        }
        catch (error) {
            console.error('Get itinerary by ID error:', error);
            res.status(500).json({ error: 'Failed to fetch itinerary' });
        }
    }
    async updateItinerary(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            if (!req.user) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { id } = req.params;
            const { destination, start_date, end_date, budget, activities, notes, media_paths } = req.body;
            // Check if itinerary exists and belongs to user
            const [existing] = await database_1.default.query('SELECT id FROM itineraries WHERE id = ? AND user_id = ?', [id, req.user.id]);
            if (!Array.isArray(existing) || existing.length === 0) {
                res.status(404).json({ error: 'Itinerary not found' });
                return;
            }
            // Handle media_paths - must be valid JSON for the database column
            // Convert to JSON array string, or null if empty
            let mediaPathsJson = null;
            if (media_paths && typeof media_paths === 'string' && media_paths.trim()) {
                // If it's a comma-separated string, convert to JSON array
                const pathsArray = media_paths.split(',').map((p) => p.trim()).filter((p) => p);
                mediaPathsJson = pathsArray.length > 0 ? JSON.stringify(pathsArray) : null;
            }
            else if (Array.isArray(media_paths) && media_paths.length > 0) {
                mediaPathsJson = JSON.stringify(media_paths);
            }
            await database_1.default.query('UPDATE itineraries SET destination = ?, start_date = ?, end_date = ?, budget = ?, activities = ?, notes = ?, media_paths = ? WHERE id = ?', [destination, start_date, end_date, budget, JSON.stringify(activities), notes || '', mediaPathsJson, id]);
            res.json({ message: 'Itinerary updated successfully' });
        }
        catch (error) {
            console.error('Update itinerary error:', error);
            res.status(500).json({ error: 'Failed to update itinerary' });
        }
    }
    async deleteItinerary(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            if (!req.user) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { id } = req.params;
            const [result] = await database_1.default.query('DELETE FROM itineraries WHERE id = ? AND user_id = ?', [id, req.user.id]);
            if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Itinerary not found' });
                return;
            }
            res.json({ message: 'Itinerary deleted successfully' });
        }
        catch (error) {
            console.error('Delete itinerary error:', error);
            res.status(500).json({ error: 'Failed to delete itinerary' });
        }
    }
    // Admin endpoint to view all itineraries
    async getAllItinerariesAdmin(req, res) {
        try {
            const [itineraries] = await database_1.default.query(`
        SELECT i.*, u.name as user_name, u.email as user_email 
        FROM itineraries i 
        JOIN users u ON i.user_id = u.id 
        ORDER BY i.created_at DESC
      `);
            // Parse JSON fields only if they are strings
            const parsedItineraries = itineraries.map(itin => ({
                ...itin,
                activities: typeof itin.activities === 'string'
                    ? JSON.parse(itin.activities)
                    : (itin.activities || []),
                media_paths: parseMediaPaths(itin.media_paths)
            }));
            res.json({ itineraries: parsedItineraries });
        }
        catch (error) {
            console.error('Get all itineraries (admin) error:', error);
            res.status(500).json({ error: 'Failed to fetch itineraries' });
        }
    }
    // Regenerate activities for an itinerary using real API data
    async regenerateActivities(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { id } = req.params;
            // Get the itinerary
            const [itineraries] = await database_1.default.query('SELECT * FROM itineraries WHERE id = ? AND user_id = ?', [id, req.user.id]);
            if (!Array.isArray(itineraries) || itineraries.length === 0) {
                res.status(404).json({ error: 'Itinerary not found' });
                return;
            }
            const itinerary = itineraries[0];
            console.log(`Regenerating activities for itinerary ${id} - ${itinerary.destination}`);
            // Generate new activities from real API
            const newActivities = await this.generateActivities(itinerary.destination, itinerary.start_date, itinerary.end_date);
            // Update the itinerary with new activities
            await database_1.default.query('UPDATE itineraries SET activities = ? WHERE id = ?', [JSON.stringify(newActivities), id]);
            res.json({
                message: 'Activities regenerated successfully',
                activities: newActivities
            });
        }
        catch (error) {
            console.error('Regenerate activities error:', error);
            res.status(500).json({ error: 'Failed to regenerate activities' });
        }
    }
    // Get analytics data
    async getAnalytics(req, res) {
        try {
            // Total itineraries
            const [totalResult] = await database_1.default.query('SELECT COUNT(*) as total FROM itineraries');
            const total = totalResult[0].total;
            // Total travelers (exclude admins)
            const [usersResult] = await database_1.default.query("SELECT COUNT(*) as total FROM users WHERE role = 'Traveler'");
            const totalUsers = usersResult[0].total;
            // Popular destinations
            const [destinations] = await database_1.default.query(`
        SELECT destination, COUNT(*) as count 
        FROM itineraries 
        GROUP BY destination 
        ORDER BY count DESC 
        LIMIT 5
      `);
            // Average budget
            const [budgetResult] = await database_1.default.query('SELECT AVG(budget) as avgBudget FROM itineraries');
            const avgBudget = budgetResult[0].avgBudget;
            res.json({
                analytics: {
                    totalItineraries: total,
                    totalUsers,
                    popularDestinations: destinations,
                    averageBudget: avgBudget
                }
            });
        }
        catch (error) {
            console.error('Get analytics error:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
}
exports.ItineraryController = ItineraryController;
