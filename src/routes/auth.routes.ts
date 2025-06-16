import { Router } from 'express';
import {
  registerController,
  loginController,
  getMeController,
  updateProfileController,
  changePasswordController,
} from '@/controllers/auth.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Higher limit for tests
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authLimiter, registerController);
router.post('/login', authLimiter, loginController);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/me', getMeController);
router.put('/profile', updateProfileController);
router.put('/change-password', changePasswordController);
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
    data: {},
  });
});

export default router;
