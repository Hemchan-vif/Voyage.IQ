"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
            if (err) {
                res.status(403).json({ error: 'Invalid or expired token' });
                return;
            }
            req.user = decoded;
            next();
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Authentication error' });
    }
};
exports.authenticateToken = authenticateToken;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
