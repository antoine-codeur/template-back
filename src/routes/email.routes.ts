import { Router } from 'express';
import { 
  sendEmailVerificationController,
  verifyEmailController,
  sendPasswordResetController,
  resetPasswordController,
  validateResetTokenController
} from '@/controllers/email.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Email verification routes
router.post(
  '/send-verification',
  authenticate,
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 requests per window
    message: 'Too many verification emails sent, please try again later.',
  }),
  sendEmailVerificationController
);

router.post(
  '/verify',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: 'Too many verification attempts, please try again later.',
  }),
  verifyEmailController
);

// Password reset routes
router.post(
  '/password-reset/send',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 requests per window per IP
    message: 'Too many password reset requests, please try again later.',
  }),
  sendPasswordResetController
);

router.post(
  '/password-reset/validate',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 validation attempts per window
    message: 'Too many token validation attempts, please try again later.',
  }),
  validateResetTokenController
);

router.post(
  '/password-reset/confirm',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 reset attempts per window
    message: 'Too many password reset attempts, please try again later.',
  }),
  resetPasswordController
);

export default router;