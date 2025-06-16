export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
} as const;

export const JWT_CONFIG = {
  ALGORITHM: 'HS256',
  ISSUER: 'template-backend',
  AUDIENCE: 'template-frontend',
} as const;

export const RATE_LIMIT_CONFIG = {
  AUTH_ATTEMPTS: 5,
  AUTH_WINDOW_MINUTES: 15,
  API_REQUESTS: 100,
  API_WINDOW_MINUTES: 15,
} as const;

export const IMAGE_FORMATS = {
  JPEG: 'jpeg',
  WEBP: 'webp',
  PNG: 'png',
  SVG: 'svg',
} as const;

export const SUPPORTED_IMAGE_FORMATS = [
  IMAGE_FORMATS.JPEG,
  IMAGE_FORMATS.WEBP,
  IMAGE_FORMATS.PNG,
] as const;

export const PROFILE_IMAGE_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  OUTPUT_FORMAT: IMAGE_FORMATS.WEBP, // Default output format
  OUTPUT_QUALITY: 85,
  OUTPUT_WIDTH: 400,
  OUTPUT_HEIGHT: 400,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
} as const;
