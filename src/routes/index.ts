import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import emailRoutes from './email.routes';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/email', emailRoutes);

// Admin routes (alias to user routes for admin endpoints)
router.use('/admin/users', userRoutes);

export default router;
