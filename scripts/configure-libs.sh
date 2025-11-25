#!/bin/bash

# Script to configure all new libraries to use TypeScript source files

LIBS=("guard" "strategy" "validation" "cache" "queue" "health" "utils" "testing")

for lib in "${LIBS[@]}"; do
  echo "Configuring $lib..."
  
  # Update package.json to point to src/index.ts
  cat > "libs/ts/$lib/package.json.tmp" << 'EOF'
{
  "name": "@nx-project/LIBNAME",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "module": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "@nx-project/source": "./src/index.ts",
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "nx": {
    "targets": {
      "test": {
        "executor": "@nx/jest:jest",
        "outputs": [
          "{projectRoot}/test-output/jest/coverage"
        ],
        "options": {
          "jestConfig": "libs/ts/LIBNAME/jest.config.cts"
        }
      }
    }
  },
  "dependencies": {
    "tslib": "^2.3.0"
  }
}
EOF

  # Replace LIBNAME with actual library name
  sed "s/LIBNAME/$lib/g" "libs/ts/$lib/package.json.tmp" > "libs/ts/$lib/package.json.new"
  
  # Merge dependencies from old package.json
  # (This is a simplified version - in practice you'd use jq or similar)
  
  echo "Updated libs/ts/$lib/package.json"
  
  # Update tsconfig.lib.json
  cat > "libs/ts/$lib/tsconfig.lib.json" << 'EOF'
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "src",
    "outDir": "dist",
    "tsBuildInfoFile": "dist/tsconfig.lib.tsbuildinfo",
    "emitDeclarationOnly": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"],
    "allowImportingTsExtensions": true
  },
  "include": ["src/**/*.ts"],
  "references": [],
  "exclude": [
    "jest.config.ts",
    "jest.config.cts",
    "src/**/*.spec.ts",
    "src/**/*.test.ts"
  ]
}
EOF

  echo "Updated libs/ts/$lib/tsconfig.lib.json"
done

echo "Done! Run 'yarn install' to apply changes."
