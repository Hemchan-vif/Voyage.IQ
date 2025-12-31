import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import pool from '../config/database';
import { User, UserResponse } from '../models/user.model';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, email, password, role, contact_info } = req.body;

      // Check if user already exists
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password, role, contact_info) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, role || 'Traveler', contact_info]
      );

      const userId = (result as any).insertId;

      // Generate token
      const token = jwt.sign(
        { id: userId, name, email, role: role || 'Traveler' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

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
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Find user
      const [users] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (!Array.isArray(users) || users.length === 0) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const user = users[0] as User;

      // Check if user is suspended
      if ((user as any).status === 'suspended') {
        res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate token with consistent user.id field
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret'
      );

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
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const [users] = await pool.query(
        'SELECT id, name, email, role, contact_info, created_at FROM users WHERE id = ?',
        [req.user.id]
      );

      if (!Array.isArray(users) || users.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: users[0] });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [users] = await pool.query(
        'SELECT id, name, email, role, status, contact_info, created_at FROM users ORDER BY created_at DESC'
      );

      res.json({ users });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // Admin: Update user role
  async updateUserRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['Traveler', 'Admin'].includes(role)) {
        res.status(400).json({ error: 'Invalid role. Must be Traveler or Admin' });
        return;
      }

      // Prevent admin from changing their own role
      if (req.user && req.user.id === parseInt(userId)) {
        res.status(400).json({ error: 'Cannot change your own role' });
        return;
      }

      const [result] = await pool.query(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, userId]
      );

      if ((result as any).affectedRows === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ message: `User role updated to ${role}` });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }

  // Admin: Update user status (suspend/activate)
  async updateUserStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!['active', 'suspended'].includes(status)) {
        res.status(400).json({ error: 'Invalid status. Must be active or suspended' });
        return;
      }

      // Prevent admin from suspending themselves
      if (req.user && req.user.id === parseInt(userId)) {
        res.status(400).json({ error: 'Cannot change your own status' });
        return;
      }

      const [result] = await pool.query(
        'UPDATE users SET status = ? WHERE id = ?',
        [status, userId]
      );

      if ((result as any).affectedRows === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ message: `User ${status === 'suspended' ? 'suspended' : 'activated'} successfully` });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  }

  // Admin: Delete user
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // Prevent admin from deleting themselves
      if (req.user && req.user.id === parseInt(userId)) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      // Check if user exists
      const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [userId]);
      if (!Array.isArray(users) || users.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Delete user's collaborations first
      await pool.query('DELETE FROM itinerary_collaborators WHERE user_id = ? OR invited_by = ?', [userId, userId]);

      // Delete user's itineraries
      await pool.query('DELETE FROM itineraries WHERE user_id = ?', [userId]);

      // Delete user
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);

      res.json({ message: 'User and all associated data deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  // Admin: Get user statistics
  async getUserStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
      const [activeUsers] = await pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
      const [suspendedUsers] = await pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'suspended'");
      const [adminCount] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'Admin'");
      const [travelerCount] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'Traveler'");
      
      // Recent registrations (last 7 days)
      const [recentUsers] = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
      );

      res.json({
        stats: {
          total: (totalUsers as any)[0].count,
          active: (activeUsers as any)[0].count,
          suspended: (suspendedUsers as any)[0].count,
          admins: (adminCount as any)[0].count,
          travelers: (travelerCount as any)[0].count,
          recentRegistrations: (recentUsers as any)[0].count
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
  }
}
