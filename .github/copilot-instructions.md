# Node.js Backend Project Guide

Here's a **micro documentation** to guide you in building a **Node.js backend project in Express with TypeScript**, using a clean, maintainable architecture including concepts like **handlers, services, repositories, middleware**, etc.

```
/src
├── config/             # DB config, environment, constants
├── routes/             # Route definitions (per resource)
├── controllers/        # Handle HTTP logic, input/output
├── handlers/           # Business logic per use case
├── services/           # Domain-level reusable logic
├── repositories/       # DB interaction abstraction
├── models/             # Data schemas (e.g., with TypeORM, Prisma)
├── middlewares/        # Pre-processing (auth, logging, error)
├── views/              # HTML/CSS templates if needed
├── utils/              # Reusable helpers (formatters, validators)
└── index.ts            # Entry point
```

---

## 🧱 Component Responsibilities

| Layer          | Description                                                             |
| -------------- | ----------------------------------------------------------------------- |
| **Route**      | Defines the endpoints and connects them to controllers.                 |
| **Middleware** | Intercepts request before reaching controller (auth, logging, etc).     |
| **Controller** | Orchestrates HTTP-level logic; extracts params and sends responses.     |
| **Handler**    | Encapsulates specific use cases (e.g. GetUserById), and calls services. |
| **Service**    | Contains core domain logic (calculations, checks, decisions).           |
| **Repository** | Deals with persistence (DB reads/writes, ORM queries).                  |
| **Model**      | Defines data schema/entities using ORM (e.g., Prisma, TypeORM).         |
| **View**       | Optional in API; if used, returns rendered HTML templates.              |
| **Utils**      | Helpers/utilities: email validators, date parsers, etc.                 |

---

## 🔗 Example Use Case: `GET /users/:id`

**Goal:** Return user information by UUID.

### 🧬 Flow Diagram:

```
Client
  ⬇
Router ➝ Middleware (auth?) ➝ Controller ➝ Handler ➝ Service ➝ Repository ➝ Model
                                                                      ⬇
                                                                Database
```

### 📄 1. Route Definition

```ts
// routes/user.routes.ts
import { Router } from 'express';
import { getUserController } from '../controllers/user.controller';

const router = Router();
router.get('/:id', getUserController);
export default router;
```

---

### 📄 2. Controller

```ts
// controllers/user.controller.ts
import { Request, Response } from 'express';
import { getUserHandler } from '../handlers/getUser.handler';

export const getUserController = async (req: Request, res: Response) => {
  const userId = req.params.id;
  await getUserHandler(userId, res);
};
```

---

### 📄 3. Handler

```ts
// handlers/getUser.handler.ts
import { getUserService } from '../services/user.service';
import { Response } from 'express';

export const getUserHandler = async (userId: string, res: Response) => {
  try {
    const user = await getUserService(userId);
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: 'User not found' });
  }
};
```

---

### 📄 4. Service

```ts
// services/user.service.ts
import { getUserById } from '../repositories/user.repository';

export const getUserService = async (id: string) => {
  return await getUserById(id);
};
```

---

### 📄 5. Repository

```ts
// repositories/user.repository.ts
import { prisma } from '../config/database';

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({ where: { id } });
};
```

---

### 📄 6. Model

```ts
// models/user.model.ts
// With Prisma, the model is in schema.prisma
model User {
  id    String @id @default(uuid())
  name  String
  email String @unique
}
```

> For TypeORM or Sequelize, models would be defined with decorators or classes.

---

### 🧩 Middleware Example

```ts
// middlewares/logger.ts
import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
};
```

---

### 💻 View (optional)

If you ever add frontend rendering (e.g., using EJS):

```ts
// In a controller
res.render('profile', { user });
```

HTML files would be in `/views`.

---

### 🛠 Utils Example

```ts
// utils/validateUUID.ts
export const isValidUUID = (uuid: string): boolean => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};
```

---

## 🌐 Database Connection (Prisma Example)

```ts
// config/database.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

Call `prisma.connect()` in your `index.ts` or inside a `bootstrap()` function.

---

## ⚙️ Entry Point

```ts
// index.ts
import express from 'express';
import userRoutes from './routes/user.routes';
import { logger } from './middlewares/logger';

const app = express();
app.use(express.json());
app.use(logger);
app.use('/users', userRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
```
