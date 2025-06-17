import fs from 'fs/promises';
import path from 'path';
import { FileService } from '@/services/file.service';

export class TestCleanup {
  private static uploadedFiles: Set<string> = new Set();
  private static uploadedImageUrls: Set<string> = new Set();

  /**
   * Track uploaded file for cleanup
   */
  static trackFile(filename: string): void {
    this.uploadedFiles.add(filename);
  }

  /**
   * Track uploaded image URL for cleanup
   */
  static trackImageUrl(imageUrl: string): void {
    if (imageUrl) {
      this.uploadedImageUrls.add(imageUrl);
      
      // Extract filename from URL and track it too
      const filename = FileService.extractFilenameFromUrl(imageUrl);
      if (filename) {
        this.trackFile(filename);
      }
    }
  }

  /**
   * Clean up all tracked files
   */
  static async cleanupFiles(): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];
    const processedFiles = new Set<string>(); // Avoid duplicates

    // Extract filenames from URLs and add to files set
    for (const imageUrl of this.uploadedImageUrls) {
      const filename = FileService.extractFilenameFromUrl(imageUrl);
      if (filename) {
        this.uploadedFiles.add(filename);
      }
    }

    // Clean up all unique files
    for (const filename of this.uploadedFiles) {
      if (!processedFiles.has(filename)) {
        processedFiles.add(filename);
        
        cleanupPromises.push(
          // First check if file exists before trying to delete
          FileService.fileExists(filename).then(exists => {
            if (exists) {
              return FileService.deleteProfileImage(filename);
            }
            // File doesn't exist, no need to delete
            return Promise.resolve();
          }).catch((error: any) => {
            // Only log unexpected errors
            console.warn(`Failed to delete file ${filename}:`, error.message);
          })
        );
      }
    }

    await Promise.all(cleanupPromises);

    // Clear tracking sets
    this.uploadedFiles.clear();
    this.uploadedImageUrls.clear();
  }

  /**
   * Clean up all profile images in the uploads directory
   * Use with caution - this will delete ALL profile images
   */
  static async cleanupAllProfileImages(): Promise<void> {
    try {
      const profileImagesDir = path.join(process.cwd(), 'uploads', 'profile-images');
      const files = await fs.readdir(profileImagesDir);
      
      const deletePromises = files.map(async (file) => {
        try {
          const filePath = path.join(profileImagesDir, file);
          await fs.unlink(filePath);
          console.log(`Deleted test file: ${file}`);
        } catch (error) {
          console.warn(`Failed to delete ${file}:`, error);
        }
      });

      await Promise.all(deletePromises);
    } catch (error) {
      console.warn('Failed to cleanup profile images directory:', error);
    }
  }

  /**
   * Get count of tracked files for debugging
   */
  static getTrackedCount(): { files: number; imageUrls: number } {
    return {
      files: this.uploadedFiles.size,
      imageUrls: this.uploadedImageUrls.size
    };
  }
}
