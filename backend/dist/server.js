"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const itinerary_routes_1 = __importDefault(require("./routes/itinerary.routes"));
const translation_routes_1 = __importDefault(require("./routes/translation.routes"));
const weather_routes_1 = __importDefault(require("./routes/weather.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const collaborator_routes_1 = __importDefault(require("./routes/collaborator.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const database_1 = __importDefault(require("./config/database"));
const socket_service_1 = require("./services/socket.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 3000;
// Initialize Socket.io
socket_service_1.socketService.initialize(server);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Smart Travel Itinerary Planner API' });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/itineraries', itinerary_routes_1.default);
app.use('/api/translate', translation_routes_1.default);
app.use('/api/weather', weather_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/collaborators', collaborator_routes_1.default);
// Error handling
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
// Database connection test
const testDatabaseConnection = async () => {
    try {
        const connection = await database_1.default.getConnection();
        console.log('✓ Database connected successfully');
        connection.release();
    }
    catch (error) {
        console.error('✗ Database connection failed:', error);
        console.error('Please ensure MySQL is running and credentials are correct in .env file');
    }
};
// Start server
server.listen(PORT, () => {
    console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    testDatabaseConnection();
});
exports.default = app;
