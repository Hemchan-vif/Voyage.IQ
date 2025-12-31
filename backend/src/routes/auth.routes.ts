import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { registerValidation, loginValidation } from '../middleware/validation.middleware';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', registerValidation, (req: Request, res: Response) => authController.register(req, res));
router.post('/login', loginValidation, (req: Request, res: Response) => authController.login(req, res));
router.get('/profile', authenticateToken, (req: Request, res: Response) => authController.getProfile(req as AuthRequest, res));
router.get('/users', authenticateToken, authorizeRoles('Admin'), (req: Request, res: Response) => authController.getAllUsers(req as AuthRequest, res));

// Admin user management routes
router.get('/users/stats', authenticateToken, authorizeRoles('Admin'), (req: Request, res: Response) => authController.getUserStats(req as AuthRequest, res));
router.put('/users/:userId/role', authenticateToken, authorizeRoles('Admin'), (req: Request, res: Response) => authController.updateUserRole(req as AuthRequest, res));
router.put('/users/:userId/status', authenticateToken, authorizeRoles('Admin'), (req: Request, res: Response) => authController.updateUserStatus(req as AuthRequest, res));
router.delete('/users/:userId', authenticateToken, authorizeRoles('Admin'), (req: Request, res: Response) => authController.deleteUser(req as AuthRequest, res));

export default router;
