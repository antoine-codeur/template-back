# 🚀 Node.js Backend Template

A production-ready Node.js backend template built with **Express** and **TypeScript**, following clean architecture principles with proper separation of concerns.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

- **TypeScript** - Full type safety and modern JavaScript features
- **Express.js** - Fast, unopinionated web framework
- **Clean Architecture** - Layered architecture with clear separation of concerns
- **Prisma ORM** - Type-safe database client with migrations
- **Authentication** - JWT-based authentication with middleware
- **Validation** - Request validation with Zod
- **Error Handling** - Centralized error handling middleware
- **Logging** - Structured logging with Winston
- **Testing** - Unit and integration tests with Jest
- **API Documentation** - Auto-generated docs with Swagger
- **Docker** - Containerization ready
- **ESLint & Prettier** - Code formatting and linting
- **Husky** - Pre-commit hooks for code quality

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (or your preferred database)

### Installation

1. **Clone the template**
   ```bash
   git clone <your-repo-url>
   cd template-back
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database (optional)
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── config/             # Configuration files
│   ├── database.ts     # Database connection
│   ├── environment.ts  # Environment variables
│   └── constants.ts    # Application constants
├── routes/             # Route definitions
│   ├── auth.routes.ts  # Authentication routes
│   ├── user.routes.ts  # User routes
│   └── index.ts        # Route aggregation
├── controllers/        # HTTP request/response handling
│   ├── auth.controller.ts
│   └── user.controller.ts
├── handlers/           # Business logic orchestration
│   ├── auth/
│   └── user/
├── services/           # Core business logic
│   ├── auth.service.ts
│   └── user.service.ts
├── repositories/       # Data access layer
│   ├── auth.repository.ts
│   └── user.repository.ts
├── models/             # Data models and types
│   ├── user.model.ts
│   └── auth.model.ts
├── middlewares/        # Request interceptors
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── logger.middleware.ts
│   └── validation.middleware.ts
├── utils/              # Utility functions
│   ├── validators.ts
│   ├── formatters.ts
│   └── helpers.ts
├── types/              # TypeScript type definitions
└── index.ts            # Application entry point
```

## 🏗 Architecture

This template follows a **layered architecture** pattern:

```
Client Request
      ↓
   Routes (routing)
      ↓
 Middleware (auth, validation, logging)
      ↓
 Controllers (HTTP logic)
      ↓
  Handlers (use case orchestration)
      ↓
  Services (business logic)
      ↓
Repositories (data access)
      ↓
   Database
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| **Routes** | Define API endpoints and connect to controllers |
| **Middleware** | Handle cross-cutting concerns (auth, logging, validation) |
| **Controllers** | Process HTTP requests/responses, parameter extraction |
| **Handlers** | Orchestrate specific use cases and coordinate services |
| **Services** | Implement core business logic and domain rules |
| **Repositories** | Abstract data access and database operations |
| **Models** | Define data structures and validation schemas |

## 🛠 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking

# Testing
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run end-to-end tests
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## 📚 API Documentation

API documentation is automatically generated using Swagger and available at:
- Development: `http://localhost:3000/api-docs`
- Production: `https://your-domain.com/api-docs`

### Example Endpoints

```
GET    /api/health           # Health check
POST   /api/auth/register    # User registration
POST   /api/auth/login       # User login
GET    /api/auth/me          # Get current user
GET    /api/users            # Get all users (protected)
GET    /api/users/:id        # Get user by ID (protected)
PUT    /api/users/:id        # Update user (protected)
DELETE /api/users/:id        # Delete user (protected)
```

## 🗄 Database

This template uses **Prisma** as the ORM with PostgreSQL by default.

### Schema Management

```bash
# Create a new migration
npx prisma migrate dev --name migration-name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Prisma Studio

Access your database with a visual editor:
```bash
npx prisma studio
```

## 🧪 Testing

The template includes a comprehensive testing setup:

### Test Structure
```
tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
├── e2e/               # End-to-end tests
└── helpers/           # Test utilities
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- user.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🐳 Docker

Build and run with Docker:

```bash
# Build image
docker build -t template-backend .

# Run container
docker run -p 3000:3000 template-backend

# Using docker-compose
docker-compose up
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secrets
4. Configure CORS for production domains

### Deployment Platforms

This template is ready for deployment on:
- **Heroku** - Include Procfile
- **Railway** - Zero-config deployment
- **Vercel** - Serverless functions
- **DigitalOcean App Platform**
- **AWS ECS/Lambda**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [Prisma](https://prisma.io/) - Database toolkit
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Jest](https://jestjs.io/) - Testing framework

---

**Happy coding! 🎉**

For questions or support, please open an issue or contact the maintainers.
