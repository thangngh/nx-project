# Winston Logger Dependencies

## Required Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^5.0.0"
  },
  "devDependencies": {
    "@types/winston": "^2.4.4"
  }
}
```

## Installation

```bash
# Using npm
npm install winston winston-daily-rotate-file
npm install -D @types/winston

# Using yarn
yarn add winston winston-daily-rotate-file
yarn add -D @types/winston

# Using pnpm
pnpm add winston winston-daily-rotate-file
pnpm add -D @types/winston
```

## Optional Transports

### Elasticsearch
```bash
npm install winston-elasticsearch
```

### Syslog
```bash
npm install winston-syslog
```

### Loggly
```bash
npm install winston-loggly-bulk
```

### Slack
```bash
npm install winston-slack-webhook-transport
```

## Peer Dependencies

Ensure you have these installed (usually already in NestJS/NextJS projects):

```json
{
  "peerDependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

## Configuration Check

After installation, verify:

```bash
# Check winston version
npm list winston

# Check if types are installed
npm list @types/winston
```

## Troubleshooting

### Module not found
If you see "Cannot find module 'winston'":
1. Ensure dependencies are installed
2. Run `npm install` in the root
3. Check `node_modules/winston` exists

### Type errors
If you see TypeScript errors:
1. Install `@types/winston`
2. Restart your TypeScript server
3. Check `tsconfig.json` includes node_modules

### File permission errors (logs/)
If you see EACCES or ENOENT:
```bash
# Create logs directory
mkdir -p logs

# Set permissions (Linux/Mac)
chmod 755 logs

# Windows: Ensure write permissions in folder properties
```

## Project Structure

After setup, your structure should look like:

```
your-project/
├── libs/
│   └── ts/
│       └── logger/
│           ├── src/
│           │   ├── lib/
│           │   │   ├── winston-logger.config.ts      ✅
│           │   │   ├── winston-logger.service.ts     ✅
│           │   │   ├── winston-logger.module.ts      ✅
│           │   │   └── nextjs-logger.ts              ✅
│           │   └── index.ts
│           ├── WINSTON_EXAMPLES.md
│           └── README.md
├── logs/                                             ✅ Auto-created
│   ├── combined-2025-12-05.log
│   ├── error-2025-12-05.log
│   └── http-2025-12-05.log
├── package.json
└── node_modules/
    ├── winston/                                      ✅
    └── winston-daily-rotate-file/                    ✅
```

## Verify Installation

Create a test file:

```typescript
// test-winston.ts
import { winstonLogger } from '@nx-project/logger';

winstonLogger.info('Winston is working!');
winstonLogger.error('Test error');
winstonLogger.debug('Debug info', { test: true });

console.log('Check logs/ directory for output files');
```

Run:
```bash
npx ts-node test-winston.ts
```

You should see console output and files created in `logs/` directory.

---

**Installation complete! 🎉**
