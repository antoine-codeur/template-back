#!/usr/bin/env node

/**
 * Test Runner Script
 * Run different types of tests with various options
 */

const { spawn } = require('child_process');
const path = require('path');

const testTypes = {
  unit: 'tests/unit/**/*.test.ts',
  integration: 'tests/integration/**/*.test.ts',
  e2e: 'tests/e2e/**/*.test.ts',
  all: 'tests/**/*.test.ts',
};

const commands = {
  help: () => {
    console.log(`
🧪 Test Runner Commands:

npm run test              # Run all tests
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:e2e          # Run end-to-end tests only
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:user-stories # Run user story based tests (e2e + integration)

Examples:
npm run test:e2e -- --testNamePattern="login"
npm run test:coverage -- --collectCoverageFrom="src/services/**"
    `);
  },

  runTests: (type = 'all', options = []) => {
    const testPattern = testTypes[type] || testTypes.all;
    const jestCommand = 'jest';
    const args = [testPattern, ...options];

    console.log(`🧪 Running ${type} tests...`);
    console.log(`Command: ${jestCommand} ${args.join(' ')}\n`);

    const child = spawn('npx', [jestCommand, ...args], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${type} tests completed successfully!`);
      } else {
        console.log(`\n❌ ${type} tests failed with exit code ${code}`);
        process.exit(code);
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error running tests: ${error.message}`);
      process.exit(1);
    });
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const testType = args[1] || 'all';
const jestOptions = args.slice(2);

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    commands.help();
    break;
  
  case 'user-stories':
    // Run user story related tests (e2e + integration)
    console.log('🧪 Running User Story Tests (E2E + Integration)...\n');
    commands.runTests('e2e', jestOptions);
    break;
  
  default:
    commands.runTests(command || 'all', jestOptions);
    break;
}
