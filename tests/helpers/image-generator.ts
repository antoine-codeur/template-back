import fs from 'fs';
import path from 'path';

/**
 * Utility functions for creating test images
 */
export class TestImageGenerator {
  /**
   * Creates a valid image buffer for testing using the real fixture
   */
  static createValidJpegBuffer(): Buffer {
    const imagePath = path.join(__dirname, '..', 'fixtures', 'test-image.webp');
    
    try {
      return fs.readFileSync(imagePath);
    } catch (error) {
      throw new Error(`Failed to read test image: ${error}`);
    }
  }

  /**
   * Creates a larger valid JPEG buffer for testing
   * This is a 10x10 pixel image
   */
  static createLargerJpegBuffer(): Buffer {
    // Base64 encoded 10x10 pixel image
    const base64Jpeg = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAKAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC/AB/9k=';
    
    return Buffer.from(base64Jpeg, 'base64');
  }

  /**
   * Creates an invalid image buffer for testing error cases
   */
  static createInvalidImageBuffer(): Buffer {
    return Buffer.from('This is not an image file content');
  }

  /**
   * Reads a test image from fixtures directory
   */
  static async getTestImageBuffer(filename: string = 'test-image.jpg'): Promise<Buffer> {
    const imagePath = path.join(__dirname, '..', 'fixtures', filename);
    
    try {
      return fs.readFileSync(imagePath);
    } catch (error) {
      // Fallback to creating a valid JPEG buffer if file doesn't exist
      return this.createValidJpegBuffer();
    }
  }

  /**
   * Creates a test image file in the fixtures directory
   */
  static createTestImageFile(filename: string = 'test-image.jpg'): string {
    const fixturesDir = path.join(__dirname, '..', 'fixtures');
    const imagePath = path.join(fixturesDir, filename);
    
    // Ensure fixtures directory exists
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    // Write the test image
    const jpegBuffer = this.createValidJpegBuffer();
    fs.writeFileSync(imagePath, jpegBuffer);
    
    return imagePath;
  }
}
