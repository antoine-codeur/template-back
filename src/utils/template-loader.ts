import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/config/logger';

export interface TemplateData {
  [key: string]: string | number | boolean;
}

export class TemplateLoader {
  private static templateCache = new Map<string, string>();
  private static readonly templatesDir = path.join(__dirname, '../templates/email');

  /**
   * Load and process template file
   */
  static async loadTemplate(templateName: string, format: 'html' | 'txt', data: TemplateData): Promise<string> {
    const cacheKey = `${templateName}.${format}`;
    
    try {
      // Check cache first
      let template = this.templateCache.get(cacheKey);
      
      if (!template) {
        // Load template from file
        const templatePath = path.join(this.templatesDir, `${templateName}.${format}`);
        template = await fs.readFile(templatePath, 'utf-8');
        
        // Cache the template
        this.templateCache.set(cacheKey, template);
      }

      // Process template with provided data
      return this.processTemplate(template, data);
    } catch (error) {
      logger.error(`Failed to load template: ${templateName}.${format}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Template not found: ${templateName}.${format}`);
    }
  }

  /**
   * Process template by replacing placeholders with data
   */
  private static processTemplate(template: string, data: TemplateData): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key];
      if (value === undefined || value === null) {
        logger.warn(`Template variable not found: ${key}`);
        return match; // Return original placeholder if data not found
      }
      return String(value);
    });
  }

  /**
   * Clear template cache (useful for development)
   */
  static clearCache(): void {
    this.templateCache.clear();
    logger.info('Template cache cleared');
  }

  /**
   * Preload all templates into cache
   */
  static async preloadTemplates(): Promise<void> {
    const templates = [
      'verification.html',
      'verification.txt',
      'password-reset.html',
      'password-reset.txt',
      'password-changed.html',
      'password-changed.txt',
    ];

    const loadPromises = templates.map(async (templateFile) => {
      try {
        const templatePath = path.join(this.templatesDir, templateFile);
        const content = await fs.readFile(templatePath, 'utf-8');
        this.templateCache.set(templateFile.replace('.', '.'), content);
      } catch (error) {
        logger.warn(`Failed to preload template: ${templateFile}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    await Promise.allSettled(loadPromises);
    logger.info(`Preloaded ${this.templateCache.size} email templates`);
  }
}
