"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
class SocketService {
    constructor() {
        this.io = null;
        this.editingUsers = new Map(); // roomId -> userId -> user
    }
    initialize(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
                methods: ['GET', 'POST'],
                credentials: true
            }
        });
        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.query.token;
                if (!token) {
                    return next(new Error('Authentication required'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                socket.userId = decoded.id;
                socket.userEmail = decoded.email;
                // Get user name from database
                const [users] = await database_1.default.query('SELECT first_name, last_name FROM users WHERE id = ?', [decoded.id]);
                const user = users[0];
                socket.userName = user ? `${user.first_name} ${user.last_name}` : decoded.email;
                next();
            }
            catch (error) {
                next(new Error('Invalid token'));
            }
        });
        this.io.on('connection', (socket) => {
            console.log(`🔌 User connected: ${socket.userName} (${socket.userId})`);
            // Join itinerary editing room
            socket.on('join-room', async (data) => {
                const roomId = `itinerary:${data.itineraryId}`;
                // Verify user has access to this itinerary
                const hasAccess = await this.checkAccess(socket.userId, data.itineraryId);
                if (!hasAccess) {
                    socket.emit('error', { message: 'Access denied to this itinerary' });
                    return;
                }
                socket.join(roomId);
                // Track editing users
                if (!this.editingUsers.has(roomId)) {
                    this.editingUsers.set(roomId, new Map());
                }
                const roomUsers = this.editingUsers.get(roomId);
                roomUsers.set(socket.userId.toString(), {
                    oduserId: socket.userId,
                    email: socket.userEmail,
                    name: socket.userName,
                    socketId: socket.id
                });
                // Notify others that user joined
                socket.to(roomId).emit('user-joined', {
                    userId: socket.userId,
                    name: socket.userName,
                    email: socket.userEmail
                });
                // Send current editors to the joining user
                const currentEditors = Array.from(roomUsers.values()).filter(u => u.oduserId !== socket.userId);
                socket.emit('current-editors', currentEditors);
                console.log(`👤 ${socket.userName} joined room ${roomId}`);
            });
            // Leave room
            socket.on('leave-room', (data) => {
                const roomId = `itinerary:${data.itineraryId}`;
                this.handleLeaveRoom(socket, roomId);
            });
            // Field change - when user edits a field
            socket.on('field-change', (data) => {
                const roomId = `itinerary:${data.itineraryId}`;
                const change = {
                    field: data.field,
                    value: data.value,
                    userId: socket.userId,
                    userName: socket.userName,
                    timestamp: Date.now()
                };
                // Broadcast to others in the room
                socket.to(roomId).emit('field-update', change);
            });
            // Field focus - show who's editing what
            socket.on('field-focus', (data) => {
                const roomId = `itinerary:${data.itineraryId}`;
                // Update user's active field
                const roomUsers = this.editingUsers.get(roomId);
                if (roomUsers) {
                    const user = roomUsers.get(socket.userId.toString());
                    if (user) {
                        user.activeField = data.field;
                    }
                }
                socket.to(roomId).emit('field-locked', {
                    field: data.field,
                    userId: socket.userId,
                    userName: socket.userName
                });
            });
            // Field blur - release lock
            socket.on('field-blur', (data) => {
                const roomId = `itinerary:${data.itineraryId}`;
                // Clear user's active field
                const roomUsers = this.editingUsers.get(roomId);
                if (roomUsers) {
                    const user = roomUsers.get(socket.userId.toString());
                    if (user) {
                        user.activeField = undefined;
                    }
                }
                socket.to(roomId).emit('field-unlocked', {
                    field: data.field,
                    userId: socket.userId
                });
            });
            // Activity changes
            socket.on('activity-change', (data) => {
                const roomId = `itinerary:${data.itineraryId}`;
                const change = {
                    action: data.action,
                    index: data.index,
                    activity: data.activity,
                    userId: socket.userId,
                    userName: socket.userName,
                    timestamp: Date.now()
                };
                socket.to(roomId).emit('activity-update', change);
            });
            // Cursor position (optional - for showing cursor indicators)
            socket.on('cursor-move', (data) => {
                const roomId = `itinerary:${data.itineraryId}`;
                socket.to(roomId).emit('cursor-update', {
                    userId: socket.userId,
                    userName: socket.userName,
                    field: data.field,
                    position: data.position
                });
            });
            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`🔌 User disconnected: ${socket.userName} (${socket.userId})`);
                // Remove from all rooms
                this.editingUsers.forEach((roomUsers, roomId) => {
                    if (roomUsers.has(socket.userId.toString())) {
                        this.handleLeaveRoom(socket, roomId);
                    }
                });
            });
        });
        console.log('🔌 Socket.io initialized');
    }
    handleLeaveRoom(socket, roomId) {
        socket.leave(roomId);
        const roomUsers = this.editingUsers.get(roomId);
        if (roomUsers) {
            roomUsers.delete(socket.userId.toString());
            // Clean up empty rooms
            if (roomUsers.size === 0) {
                this.editingUsers.delete(roomId);
            }
        }
        // Notify others
        socket.to(roomId).emit('user-left', {
            userId: socket.userId,
            name: socket.userName
        });
        console.log(`👤 ${socket.userName} left room ${roomId}`);
    }
    async checkAccess(userId, itineraryId) {
        try {
            // Check if user is owner
            const [ownerResult] = await database_1.default.query('SELECT id FROM itineraries WHERE id = ? AND user_id = ?', [itineraryId, userId]);
            if (ownerResult.length > 0)
                return true;
            // Check if user is collaborator
            const [collabResult] = await database_1.default.query('SELECT id FROM itinerary_collaborators WHERE itinerary_id = ? AND user_id = ?', [itineraryId, userId]);
            if (collabResult.length > 0)
                return true;
            return false;
        }
        catch (error) {
            console.error('Error checking access:', error);
            return false;
        }
    }
    // Get active editors for an itinerary
    getActiveEditors(itineraryId) {
        const roomId = `itinerary:${itineraryId}`;
        const roomUsers = this.editingUsers.get(roomId);
        return roomUsers ? Array.from(roomUsers.values()) : [];
    }
    // Broadcast to all users in a room
    broadcastToRoom(itineraryId, event, data) {
        if (this.io) {
            this.io.to(`itinerary:${itineraryId}`).emit(event, data);
        }
    }
}
exports.socketService = new SocketService();
exports.default = exports.socketService;
