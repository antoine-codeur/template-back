import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { PROFILE_IMAGE_CONFIG, IMAGE_FORMATS } from '@/config/constants';

export interface ProcessedImage {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

export class FileService {
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads');
  private static readonly PROFILE_IMAGES_DIR = path.join(FileService.UPLOAD_DIR, 'profile-images');

  /**
   * Initialize upload directories
   */
  static async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(FileService.UPLOAD_DIR, { recursive: true });
      await fs.mkdir(FileService.PROFILE_IMAGES_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
      throw error;
    }
  }

  /**
   * Validate uploaded file
   */
  private static validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!PROFILE_IMAGE_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed');
    }

    if (file.size > PROFILE_IMAGE_CONFIG.MAX_FILE_SIZE) {
      throw new Error(`File size too large. Maximum allowed size is ${PROFILE_IMAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
  }

  /**
   * Process and save profile image
   */
  static async processProfileImage(file: Express.Multer.File): Promise<ProcessedImage> {
    FileService.validateFile(file);

    const fileExtension = `.${PROFILE_IMAGE_CONFIG.OUTPUT_FORMAT}`;
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(FileService.PROFILE_IMAGES_DIR, fileName);

    try {
      // Process image with Sharp
      await sharp(file.buffer)
        .resize(PROFILE_IMAGE_CONFIG.OUTPUT_WIDTH, PROFILE_IMAGE_CONFIG.OUTPUT_HEIGHT, {
          fit: 'cover',
          position: 'center'
        })
        .toFormat(PROFILE_IMAGE_CONFIG.OUTPUT_FORMAT as keyof sharp.FormatEnum, { 
          quality: PROFILE_IMAGE_CONFIG.OUTPUT_QUALITY 
        })
        .toFile(filePath);

      // Get file stats
      const stats = await fs.stat(filePath);

      return {
        filename: fileName,
        originalName: file.originalname,
        path: filePath,
        url: `/uploads/profile-images/${fileName}`,
        size: stats.size,
        mimeType: `image/${PROFILE_IMAGE_CONFIG.OUTPUT_FORMAT}`,
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Delete profile image file
   */
  static async deleteProfileImage(filename: string): Promise<void> {
    if (!filename) {
      return;
    }

    try {
      const filePath = path.join(FileService.PROFILE_IMAGES_DIR, filename);
      await fs.unlink(filePath);
    } catch (error: any) {
      // Only warn if it's not a "file not found" error
      if (error.code !== 'ENOENT') {
        console.warn('Could not delete file:', filename, error);
      }
      // For ENOENT errors, file doesn't exist which is fine - silently continue
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(FileService.PROFILE_IMAGES_DIR, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract filename from URL
   */
  static extractFilenameFromUrl(url: string): string | null {
    if (!url) return null;
    
    const match = url.match(/\/uploads\/profile-images\/([^\/]+)$/);
    return match?.[1] || null;
  }

  /**
   * Get supported image formats for validation
   */
  static getSupportedFormats(): string[] {
    return Object.values(IMAGE_FORMATS);
  }

  /**
   * Get allowed MIME types for validation
   */
  static getAllowedMimeTypes(): string[] {
    return [...PROFILE_IMAGE_CONFIG.ALLOWED_MIME_TYPES];
  }

  /**
   * Get max file size for validation
   */
  static getMaxFileSize(): number {
    return PROFILE_IMAGE_CONFIG.MAX_FILE_SIZE;
  }
}
