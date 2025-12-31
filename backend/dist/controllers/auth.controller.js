"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const database_1 = __importDefault(require("../config/database"));
class AuthController {
    async register(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const { name, email, password, role, contact_info } = req.body;
            // Check if user already exists
            const [existingUsers] = await database_1.default.query('SELECT id FROM users WHERE email = ?', [email]);
            if (Array.isArray(existingUsers) && existingUsers.length > 0) {
                res.status(400).json({ error: 'Email already registered' });
                return;
            }
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            // Insert user
            const [result] = await database_1.default.query('INSERT INTO users (name, email, password, role, contact_info) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, role || 'Traveler', contact_info]);
            const userId = result.insertId;
            // Generate token
            const token = jsonwebtoken_1.default.sign({ id: userId, email, role: role || 'Traveler' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: userId,
                    name,
                    email,
                    role: role || 'Traveler',
                    contact_info
                }
            });
        }
        catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
    async login(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const { email, password } = req.body;
            // Find user
            const [users] = await database_1.default.query('SELECT * FROM users WHERE email = ?', [email]);
            if (!Array.isArray(users) || users.length === 0) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            const user = users[0];
            // Verify password
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
            if (!isValidPassword) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            // Generate token with consistent user.id field
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret');
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    contact_info: user.contact_info
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
    async getProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const [users] = await database_1.default.query('SELECT id, name, email, role, contact_info, created_at FROM users WHERE id = ?', [req.user.id]);
            if (!Array.isArray(users) || users.length === 0) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.json({ user: users[0] });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }
    async getAllUsers(req, res) {
        try {
            const [users] = await database_1.default.query('SELECT id, name, email, role, contact_info, created_at FROM users ORDER BY created_at DESC');
            res.json({ users });
        }
        catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }
}
exports.AuthController = AuthController;
