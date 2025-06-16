# 🧪 Tests Documentation - User Stories Driven Testing

Cette documentation explique comment utiliser la suite de tests orientée **User Stories** pour le template backend Node.js.

## 📋 Table des Matières

- [Structure des Tests](#structure-des-tests)
- [Types de Tests](#types-de-tests)
- [Installation et Configuration](#installation-et-configuration)
- [Lancement des Tests](#lancement-des-tests)
- [Écriture de Nouveaux Tests](#écriture-de-nouveaux-tests)
- [Bonnes Pratiques](#bonnes-pratiques)

---

## 🏗️ Structure des Tests

```
tests/
├── setup.ts                    # Configuration globale des tests
├── helpers/                    # Utilitaires de test
│   ├── api-client.ts          # Client API pour les tests E2E
│   └── test-helpers.ts        # Fonctions utilitaires communes
├── e2e/                       # Tests End-to-End (User Stories)
│   ├── auth.guest.test.ts     # Stories: Utilisateur invité
│   ├── auth.authenticated.test.ts # Stories: Utilisateur authentifié
│   └── user-management.test.ts # Stories: Gestion des utilisateurs
├── integration/               # Tests d'intégration
│   └── auth.service.test.ts   # Tests des services
└── unit/                      # Tests unitaires
    └── auth.handler.test.ts   # Tests des handlers
```

---

## 🎯 Types de Tests

### 1. Tests E2E (End-to-End) 🌐
**Objectif**: Tester les user stories complètes via les API endpoints

**Exemple d'user story testée**:
```
En tant qu'utilisateur invité,
Je veux créer un compte
Afin d'accéder à la plateforme
```

**Fichiers**:
- `auth.guest.test.ts` - Stories des utilisateurs non-authentifiés
- `auth.authenticated.test.ts` - Stories des utilisateurs authentifiés  
- `user-management.test.ts` - Stories de gestion des utilisateurs (admin/user)

### 2. Tests d'Intégration 🔗
**Objectif**: Tester l'interaction entre les services et la base de données

**Exemple**: Vérifier que `authService.register()` crée bien un utilisateur en base avec les bonnes données

### 3. Tests Unitaires ⚙️
**Objectif**: Tester les composants isolés (handlers, utilitaires)

**Exemple**: Vérifier qu'un handler retourne la bonne réponse HTTP

---

## ⚡ Installation et Configuration

### Prérequis
```bash
# Installer les dépendances de test
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

### Variables d'environnement pour les tests
Créer un fichier `.env.test`:
```env
NODE_ENV=test
DATABASE_URL="file:./test.db"
JWT_SECRET="test-secret-key"
```

---

## 🚀 Lancement des Tests

### Commandes Principales

```bash
# Tous les tests
npm test

# Tests par type
npm run test:unit           # Tests unitaires seulement
npm run test:integration    # Tests d'intégration seulement  
npm run test:e2e           # Tests E2E seulement

# Tests orientés User Stories (E2E + Integration)
npm run test:user-stories

# Mode développement
npm run test:watch         # Mode watch (re-lance automatiquement)
npm run test:coverage      # Avec rapport de couverture
```

### Commandes Avancées

```bash
# Test d'une user story spécifique
npm run test:e2e -- --testNamePattern="register"

# Tests avec couverture détaillée
npm run test:coverage -- --collectCoverageFrom="src/services/**"

# Tests en mode verbose
npm test -- --verbose

# Tests d'un seul fichier
npm test auth.guest.test.ts
```

---

## ✍️ Écriture de Nouveaux Tests

### 1. Ajouter une User Story E2E

```typescript
// tests/e2e/new-feature.test.ts
import { createApiClient, expectSuccessResponse } from '../helpers/test-helpers';

describe('User Story: Ma nouvelle fonctionnalité', () => {
  const apiClient = createApiClient();

  describe('En tant qu\'utilisateur, je veux faire X', () => {
    it('should successfully do X when conditions are met', async () => {
      // Given: Conditions initiales
      const testData = { /* ... */ };

      // When: Action de l'utilisateur
      const response = await apiClient.post('/api/endpoint', testData);

      // Then: Résultat attendu
      expectSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('expectedField');
    });
  });
});
```

### 2. Structure des Tests User Stories

Chaque test suit le pattern **Given-When-Then**:

```typescript
it('should achieve user goal when preconditions are met', async () => {
  // Given: État initial / Préconditions
  const user = await createTestUser();
  const validData = generateTestData();

  // When: Action que l'utilisateur effectue
  const response = await apiClient.post('/api/action', validData);

  // Then: Résultat attendu par l'utilisateur
  expectSuccessResponse(response);
  expect(response.body.data).toMatchUserExpectations();
});
```

### 3. Helpers Disponibles

```typescript
// Création d'utilisateurs de test
const regularUser = await createRegularUser();
const adminUser = await createAdminUser();

// Clients API
const apiClient = createApiClient(); // Non-authentifié
const authClient = createAuthenticatedApiClient(user.token);

// Assertions communes
expectSuccessResponse(response, 200);
expectErrorResponse(response, 400);
expectUserShape(user); // Vérifie la structure user
```

---

## 🎯 Bonnes Pratiques

### 1. Nommage des Tests
- **Descriptif**: Décrit ce que l'utilisateur veut accomplir
- **User Story Format**: "As a [role], I want to [action], so that [benefit]"

```javascript
// ✅ Bon
describe('As a guest user, I want to register an account', () => {
  it('should create account with valid email and password', async () => {

// ❌ Mauvais  
describe('Register tests', () => {
  it('should work', async () => {
```

### 2. Organisation des Tests
- **1 fichier = 1 rôle utilisateur** (guest, authenticated, admin)
- **1 describe = 1 user story**
- **1 it = 1 scénario de la story**

### 3. Données de Test
```typescript
// ✅ Utiliser les helpers
const credentials = generateTestCredentials();

// ❌ Éviter les données hardcodées
const credentials = { email: 'test@test.com', password: '123' };
```

### 4. Nettoyage
```typescript
afterEach(async () => {
  await cleanupTestUsers(); // Nettoie la DB après chaque test
});
```

### 5. Tests d'Erreur
Tester aussi les cas d'échec pour chaque user story:

```typescript
describe('As a guest, I want to register', () => {
  it('should succeed with valid data', async () => { /* ... */ });
  
  it('should fail with invalid email', async () => { /* ... */ });
  
  it('should fail with weak password', async () => { /* ... */ });
  
  it('should fail with duplicate email', async () => { /* ... */ });
});
```

---

## 📊 Rapports et Métriques

### Couverture de Code
```bash
npm run test:coverage
```

Génère un rapport dans `coverage/` avec:
- **Couverture par ligne**
- **Couverture par fonction** 
- **Couverture par branche**
- **Rapport HTML navigable**

### CI/CD Integration
Ajouter dans votre pipeline:

```yaml
# .github/workflows/test.yml
- name: Run User Story Tests
  run: npm run test:user-stories

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

---

## 🔍 Debugging des Tests

### Logs pendant les Tests
```typescript
// Activer les logs en mode test
console.log('Debug info:', response.body);
```

### Test Isolé
```bash
# Lancer un seul test
npm test -- --testNamePattern="register.*valid"

# Mode debug
npm test -- --detectOpenHandles --forceExit
```

### Variables d'Environnement Debug
```bash
DEBUG=test npm test  # Active les logs de debug
NODE_ENV=test npm test
```

---

## 📚 Ressources

- [Documentation Jest](https://jestjs.io/docs/getting-started)
- [Documentation Supertest](https://github.com/visionmedia/supertest)
- [User Stories Best Practices](https://www.atlassian.com/agile/project-management/user-stories)

---

**💡 Conseil**: Commencez toujours par écrire vos user stories avant vos tests. Cela garantit que vous testez vraiment ce que l'utilisateur veut accomplir, pas juste votre code technique.
