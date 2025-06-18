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

// Create rate limiter with test-friendly settings
const createRateLimit = (options: any, testIdentifier?: string) => {
  if (process.env.NODE_ENV === 'test') {
    return rateLimit({
      ...options,
      skip: (req) => {
        // Only apply rate limiting for tests that specifically request it
        // via the X-Test-Rate-Limit header
        if (testIdentifier === 'rate-limited') {
          return !req.headers['x-test-rate-limit'];
        }
        // For all other endpoints in test mode, skip rate limiting
        return true;
      },
      windowMs: 1500, // 1.5 second window for rate limited tests
      max: options.max <= 3 ? 2 : 8, // Low limits for rate limiting tests
    });
  }
  return rateLimit(options);
};

// Email verification routes
router.post(
  '/send-verification',
  authenticate,
  createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 requests per window
    message: 'Too many verification emails sent, please try again later.',
  }, 'rate-limited'), // Mark for rate limiting test
  sendEmailVerificationController
);

router.post(
  '/verify',
  createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: 'Too many verification attempts, please try again later.',
  }, 'rate-limited'), // Mark for rate limiting test
  verifyEmailController
);

// Password reset routes
router.post(
  '/password-reset/send',
  createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 requests per window per IP
    message: 'Too many password reset requests, please try again later.',
  }, 'rate-limited'), // Mark for rate limiting test
  sendPasswordResetController
);

router.post(
  '/password-reset/validate',
  createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 validation attempts per window
    message: 'Too many token validation attempts, please try again later.',
  }), // No rate limiting test for this endpoint
  validateResetTokenController
);

router.post(
  '/password-reset/confirm',
  createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 reset attempts per window
    message: 'Too many password reset attempts, please try again later.',
  }), // No rate limiting test for this endpoint
  resetPasswordController
);

export default router;