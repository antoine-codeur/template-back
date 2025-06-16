import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Memory storage for processing with Sharp
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed'));
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// Middleware for single profile image upload
export const uploadProfileImage = upload.single('profileImage');

// Error handling middleware for multer errors
export const handleMulterError = (error: any, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File size too large',
        error: 'Maximum file size is 5MB'
      });
      return;
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        message: 'Too many files',
        error: 'Only one file is allowed'
      });
      return;
    }
    
    res.status(400).json({
      success: false,
      message: 'File upload error',
      error: error.message
    });
    return;
  }
  
  // Other upload errors
  if (error && error.message.includes('Invalid file type')) {
    res.status(400).json({
      success: false,
      message: 'Invalid file type',
      error: 'Only JPEG, PNG, and WebP images are allowed'
    });
    return;
  }
  
  next(error);
};
