import { Router } from 'express';
import {
  getUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  suspendUserController,
  activateUserController,
  getMeController,
  updateMeController,
} from '@/controllers/user.controller';
import { authenticate, requireAdmin } from '@/middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Regular user routes
router.get('/me', getMeController);
router.put('/me', updateMeController);

// Admin routes
router.get('/', requireAdmin, getUsersController);
router.get('/:id', requireAdmin, getUserByIdController);
router.put('/:id', requireAdmin, updateUserController);
router.delete('/:id', requireAdmin, deleteUserController);
router.post('/:id/suspend', requireAdmin, suspendUserController);
router.post('/:id/activate', requireAdmin, activateUserController);

export default router;
