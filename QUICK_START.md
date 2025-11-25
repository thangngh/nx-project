# NX Monorepo - Quick Start Guide

## 🚀 Generator Scripts

### Generate New Library

```bash
# Generate a NestJS library in libs/ts/
yarn gen:lib <library-name>
# Example: yarn gen:lib auth

# Generate a shared library in libs/shared/ts/
yarn gen:shared-lib <library-name>
# Example: yarn gen:shared-lib types
```

### Generate New Application

```bash
# Generate a NestJS application
yarn gen:nest-app <app-name>
# Example: yarn gen:nest-app user-service

# Generate a Node.js application
yarn gen:node-app <app-name>
# Example: yarn gen:node-app worker
```

## 🏗️ Build Scripts

```bash
# Build all projects
yarn build:all

# Build only libraries
yarn build:libs

# Build only applications
yarn build:apps

# Build only affected projects (based on git changes)
yarn affected:build
```

## 🧪 Testing Scripts

```bash
# Run all tests
yarn test:all

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:cov

# Run E2E tests
yarn e2e

# Test only affected projects
yarn affected:test
```

## 💻 Development Scripts

```bash
# Start gateway application in development mode
yarn dev:gateway

# Start default application
yarn dev
```

## 🔍 Code Quality Scripts

```bash
# Run linting on all projects
yarn lint:all

# Format all code
yarn format

# Check formatting
yarn format:check
```

## 📊 Analysis Scripts

```bash
# View project dependency graph
yarn graph

# View detailed dependency graph
yarn dep-graph
```

## 🧹 Cleanup Scripts

```bash
# Clear NX cache
yarn clean

# Clear NX cache, node_modules, and dist
yarn clean:all
```

## 📚 Library Structure After Generation

When you generate a library with `yarn gen:lib my-lib`, you'll get:

```
libs/ts/my-lib/
├── src/
│   ├── index.ts
│   └── lib/
├── package.json
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── jest.config.cts
├── eslint.config.mjs
└── README.md
```

### Post-Generation Steps

1. **Update `package.json`**:
   - Change `main`, `module`, `types` to `./src/index.ts`
   - Update `exports` to point to source files
   - Add required dependencies

2. **Update `tsconfig.lib.json`**:
   - Set `emitDeclarationOnly: true`
   - Add `allowImportingTsExtensions: true`

3. **Update imports**:
   - Use `.ts` extensions in all imports
   - Example: `import { Foo } from './lib/foo.ts';`

## 🎯 Common Workflows

### Creating a New Feature Library

```bash
# 1. Generate the library
yarn gen:lib feature-users

# 2. Navigate to the library
cd libs/ts/feature-users

# 3. Update package.json and tsconfig as mentioned above

# 4. Add your code in src/lib/

# 5. Export from src/index.ts
```

### Creating a New Microservice

```bash
# 1. Generate the NestJS app
yarn gen:nest-app user-service

# 2. The app will be created in apps/user-service/

# 3. Import your libraries
# In apps/user-service/src/app/app.module.ts:
import { ConfigModule } from '@nx-project/config';
import { LoggerModule } from '@nx-project/shared-logger';
```

### Running Tests for Changed Code

```bash
# Run tests only for affected projects
yarn affected:test

# Build only affected projects
yarn affected:build
```

## 💡 Tips

1. **Use NX Console**: Install the NX Console extension in VS Code for a GUI to run these commands

2. **Parallel Execution**: NX automatically parallelizes tasks for better performance

3. **Caching**: NX caches build and test results. Use `yarn clean` if you need to clear the cache

4. **Affected Commands**: Use `affected:*` commands in CI/CD to only test/build what changed

5. **Custom Scripts**: Add project-specific scripts in individual `package.json` files

## 🔗 Useful NX Commands

```bash
# Show project information
nx show project <project-name>

# List all projects
nx show projects

# Run a specific target for a project
nx run <project>:<target>

# Example: nx run gateway:serve
```

## 📖 Documentation

- [NX Documentation](https://nx.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- Project-specific docs in `libs/ts/README.md`
