# 🚫 No Enums Policy - Why & How

## ❌ Problem with TypeScript Enums

### Runtime Overhead

**TypeScript Enum:**
```typescript
export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}
```

**Compiled JavaScript:**
```javascript
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "PENDING";
    JobStatus["PROCESSING"] = "PROCESSING";
    JobStatus["COMPLETED"] = "COMPLETED";
})(JobStatus || (JobStatus = {}));
```

**Issues:**
1. ❌ **Runtime code** - Adds ~50 bytes per enum
2. ❌ **IIFE overhead** - Function execution cost
3. ❌ **Bundle size** - Larger JavaScript bundles
4. ❌ **Tree-shaking** - Harder to eliminate unused values
5. ❌ **Not truly const** - Can be mutated at runtime

---

## ✅ Solution: Const Objects

### Pattern: `as const` Object

**Replace with:**
```typescript
export const JobStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];
```

**Compiled JavaScript:**
```javascript
export const JobStatus = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
};
```

**Benefits:**
1. ✅ **Zero runtime overhead** - Just an object literal
2. ✅ **Smaller bundle** - No IIFE wrapper
3. ✅ **Tree-shakeable** - Unused values can be removed
4. ✅ **Truly const** - Frozen at compile time with `as const`
5. ✅ **100% compatible** - Same usage pattern

---

## 📊 Performance Comparison

| Aspect | Enum | Const Object | Winner |
|--------|------|--------------|--------|
| **Compiled Size** | ~50 bytes | ~20 bytes | ✅ Const |
| **Runtime Cost** | IIFE execution | None | ✅ Const |
| **Tree-shaking** | Difficult | Easy | ✅ Const |
| **Type Safety** | Good | Good | 🤝 Same |
| **Autocomplete** | Good | Good | 🤝 Same |
| **Mutability** | Can mutate | Frozen | ✅ Const |

---

## 🔄 Migration Guide

### Step 1: Replace Enum

**Before:**
```typescript
export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
```

**After:**
```typescript
export const JobStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];
```

### Step 2: No Code Changes Needed!

**Usage remains identical:**
```typescript
// ✅ Value access - Works exactly the same
const status = JobStatus.PENDING;

// ✅ Type annotation - Works exactly the same
function processJob(status: JobStatus) {
  if (status === JobStatus.COMPLETED) {
    // ...
  }
}

// ✅ Switch statements - Works exactly the same
switch (status) {
  case JobStatus.PENDING:
    break;
  case JobStatus.PROCESSING:
    break;
}
```

### Step 3: Verify Compilation

```bash
# No TypeScript errors
npm run build

# Check bundle size (should be smaller)
npm run analyze
```

---

## 📝 Code Examples

### Example 1: String Enum Replacement

**Before (Enum):**
```typescript
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Usage
logger.log(LogLevel.INFO, 'Message');
```

**After (Const Object):**
```typescript
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

// Usage - IDENTICAL
logger.log(LogLevel.INFO, 'Message');
```

---

### Example 2: Numeric Enum Replacement

**Before (Enum):**
```typescript
export enum Priority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}
```

**After (Const Object):**
```typescript
export const Priority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
} as const;

export type Priority = typeof Priority[keyof typeof Priority];
```

---

### Example 3: Union Type Alternative

**For simple cases, use union types:**

```typescript
// Instead of enum
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// With constants for reuse
export const JOB_STATUS_PENDING = 'PENDING';
export const JOB_STATUS_PROCESSING = 'PROCESSING';
export const JOB_STATUS_COMPLETED = 'COMPLETED';
export const JOB_STATUS_FAILED = 'FAILED';
```

**When to use union vs const object:**
- **Union**: Simple, few values, no object needed
- **Const Object**: Many values, need object for iteration, better DX

---

## ✅ Current Project Status

### ✅ All Enums Replaced

**Found:**
- ❌ `JobStatus` enum (RabbitMQ) - **FIXED** ✅

**Already Const Objects:**
- ✅ `AppEnvironment` (shared/enums) - Already correct
- ✅ No other enums found

**Search Results:**
```bash
# No enums found in project
grep -r "export enum" libs/ apps/
# → 0 results ✅
```

---

## 🎯 Best Practices

### ✅ DO:

```typescript
// ✅ Use const object with as const
export const Status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type Status = typeof Status[keyof typeof Status];
```

### ❌ DON'T:

```typescript
// ❌ Don't use enum
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ❌ Don't forget 'as const'
export const Status = {
  ACTIVE: 'active',  // ← Will be type 'string', not literal
  INACTIVE: 'inactive',
};

// ❌ Don't forget type export
export const Status = {
  ACTIVE: 'active',
} as const;
// Missing: export type Status = ...
```

---

## 📊 Benefits Summary

**Performance:**
- ✅ Smaller bundle size
- ✅ No runtime overhead
- ✅ Better tree-shaking

**Developer Experience:**
- ✅ Same usage pattern
- ✅ Same type safety
- ✅ Better autocomplete
- ✅ No migration pain

**Code Quality:**
- ✅ More predictable
- ✅ Truly immutable
- ✅ Cleaner compiled code

---

## 🔍 Detection & Prevention

### ESLint Rule (Recommended)

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "TSEnumDeclaration",
        "message": "Don't use enums. Use const objects with 'as const' instead."
      }
    ]
  }
}
```

### Pre-commit Hook

```bash
# .husky/pre-commit
if grep -r "export enum" libs/ apps/; then
  echo "❌ Enums detected! Use const objects with 'as const' instead."
  exit 1
fi
```

---

## 📚 References

- [TypeScript Handbook - Const Assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [Why I don't use enums in TypeScript](https://www.youtube.com/watch?v=jjMbPt_H3RQ)
- [TypeScript Deep Dive - Enums](https://basarat.gitbook.io/typescript/type-system/enums)

---

**Project is now 100% enum-free! 🎉**

**Rules:**
1. ❌ No `enum` keyword
2. ✅ Use `const object` with `as const`
3. ✅ Export derived type: `export type X = typeof X[keyof typeof X]`
