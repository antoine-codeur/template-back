import { Router } from 'express';
import {
  getUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  suspendUserController,
  activateUserController,
  getUserSuspensionDetailsController,
  getMeController,
  updateMeController,
  uploadProfileImageController,
  deleteProfileImageController,
} from '@/controllers/user.controller';
import { authenticate, requireAdmin } from '@/middlewares/auth.middleware';
import { uploadProfileImage, handleMulterError } from '@/middlewares/upload.middleware';
import { validateBody, validateQuery } from '@/middlewares/validation.middleware';
import { 
  UserQuerySchema, 
  UpdateUserSchema, 
  UpdateProfileSchema, 
  SuspendUserSchema, 
  ActivateUserSchema 
} from '@/models/user.model';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Regular user routes
router.get('/me', getMeController);
router.put('/me', validateBody(UpdateProfileSchema), updateMeController);

// Profile image routes
router.post('/me/profile-image', uploadProfileImage, uploadProfileImageController);
router.delete('/me/profile-image', deleteProfileImageController);

// Admin routes
router.get('/', requireAdmin, validateQuery(UserQuerySchema), getUsersController);
router.get('/:id', requireAdmin, getUserByIdController);
router.get('/:id/suspension', requireAdmin, getUserSuspensionDetailsController);
router.put('/:id', requireAdmin, validateBody(UpdateUserSchema), updateUserController);
router.delete('/:id', requireAdmin, deleteUserController);
router.post('/:id/suspend', requireAdmin, validateBody(SuspendUserSchema), suspendUserController);
router.post('/:id/activate', requireAdmin, validateBody(ActivateUserSchema), activateUserController);

export default router;
