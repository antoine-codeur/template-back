import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HTTP_STATUS } from '@/config/constants';
import { ApiResponse, ValidationError } from '@/types';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validation = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!validation.success) {
        const errors: ValidationError[] = validation.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const response: ApiResponse = {
          success: false,
          message: 'Invalid input data',
          error: 'Invalid input data',
          data: errors,
        };

        res.status(HTTP_STATUS.BAD_REQUEST).json(response);
        return;
      }

      // Replace request data with validated data
      req.body = validation.data.body || req.body;
      req.query = validation.data.query || req.query;
      req.params = validation.data.params || req.params;

      next();
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: 'Validation error',
      };

      res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    }
  };
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validation = schema.safeParse(req.body);

      if (!validation.success) {
        const errors: ValidationError[] = validation.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const response: ApiResponse = {
          success: false,
          message: 'Invalid input data',
          error: 'Invalid input data',
          data: errors,
        };

        res.status(HTTP_STATUS.BAD_REQUEST).json(response);
        return;
      }

      req.body = validation.data;
      next();
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: 'Validation error',
      };

      res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validation = schema.safeParse(req.query);

      if (!validation.success) {
        const errors: ValidationError[] = validation.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const response: ApiResponse = {
          success: false,
          message: 'Invalid input data',
          error: 'Invalid input data',
          data: errors,
        };

        res.status(HTTP_STATUS.BAD_REQUEST).json(response);
        return;
      }

      req.query = validation.data;
      next();
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Validation error',
        error: 'Validation error',
      };

      res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    }
  };
};
