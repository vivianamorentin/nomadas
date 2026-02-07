# Package Updates Required for SPEC-MSG-001

## New Dependencies to Install

Run this command to install missing packages:

```bash
npm install dompurify jsdom @types/dompurify @types/jsdom
```

---

## Updated package.json Dependencies

### Current Dependencies (Already Installed)

✅ All core dependencies are already installed:
- `@nestjs/common` ^10.3.0
- `@nestjs/websockets` ^10.3.0
- `@nestjs/platform-socket.io` ^10.3.0
- `@nestjs/throttler` ^5.1.1
- `socket.io` ^4.6.1
- `@prisma/client` ^5.8.0
- `aws-sdk` ^2.1540.0
- `sharp` ^0.33.1
- `redis` ^4.6.12

### New Dependencies (Required)

Add these to `package.json`:

```json
{
  "dependencies": {
    "dompurify": "^3.0.6",
    "jsdom": "^23.0.1"
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.5",
    "@types/jsdom": "^21.1.6"
  }
}
```

---

## Dependency Details

### dompurify (^3.0.6)
- **Purpose:** XSS prevention for message content
- **Used in:** MessageService.sanitizeMessageContent()
- **NFR:** NFR-MSG-SEC-004 (XSS sanitization)

### jsdom (^23.0.1)
- **Purpose:** DOM implementation for server-side DOMPurify
- **Used in:** MessageService (DOMPurify initialization)
- **Required by:** DOMPurify for Node.js environment

### @types/dompurify (^3.0.5)
- **Purpose:** TypeScript definitions for DOMPurify
- **Dev dependency:** Only needed during development

### @types/jsdom (^21.1.6)
- **Purpose:** TypeScript definitions for jsdom
- **Dev dependency:** Only needed during development

---

## Installation Command

### Option 1: Install All Required Packages

```bash
npm install dompurify jsdom @types/dompurify @types/jsdom --save
```

### Option 2: Install Separately

```bash
# Production dependencies
npm install dompurify jsdom

# Dev dependencies
npm install --save-dev @types/dompurify @types/jsdom
```

---

## Verification

After installation, verify packages are installed:

```bash
npm list dompurify jsdom
```

Expected output:
```
nomadas@1.0.0
├── dompurify@3.0.6
└── jsdom@23.0.1
```

---

## Future Dependencies (For Later Phases)

### Phase 4: Advanced Features
- No additional dependencies needed (use existing Redis)

### Phase 5: Push Notifications
- No additional dependencies needed (use existing NotificationService)

### Phase 6: Automation
- **@nestjs/bull** or **@nestjs/bull@^10.0.0** - Bull queue integration
- **bull** ^4.11.0 - Job queue
- **@types/bull** - TypeScript definitions

### Phase 7: Testing
- **supertest** ^6.3.4 - Already installed
- **socket.io-client** - For WebSocket E2E tests

---

## Import Statements

### In MessageService

```typescript
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Use in sanitization
const sanitized = purify.sanitize(content, {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
});
```

---

## Security Notes

### DOMPurify Configuration

The implementation uses a strict security configuration:
- **ALLOWED_TAGS: []** - No HTML tags allowed
- **ALLOWED_ATTR: []** - No attributes allowed
- **KEEP_CONTENT: true** - Keep text content only

This prevents:
- Cross-site scripting (XSS)
- HTML injection
- Script injection
- Style injection

### GDPR Compliance

Message content is stored as plain text (no HTML), which ensures:
- Right to access (data export)
- Right to erasure (anonymization)
- Data portability
- Clear data retention (90 days for images)

---

## Version Compatibility

All packages are compatible with:
- **Node.js:** ^20.11.5
- **NestJS:** ^10.3.0
- **TypeScript:** ^5.3.3
- **Prisma:** ^5.8.0

---

## Troubleshooting

### Issue: "Cannot find module 'dompurify'"

**Solution:** Run installation command:
```bash
npm install dompurify jsdom @types/dompurify @types/jsdom
```

### Issue: TypeScript errors for DOMPurify

**Solution:** Ensure type definitions are installed:
```bash
npm install --save-dev @types/dompurify @types/jsdom
```

### Issue: JSDOM window errors

**Solution:** Use correct import:
```typescript
import { JSDOM } from 'jsdom';
const window = new JSDOM('').window;
```

---

## Summary

**New Packages Required:** 4
- dompurify (production)
- jsdom (production)
- @types/dompurify (dev)
- @types/jsdom (dev)

**Installation Time:** < 1 minute
**Disk Space:** ~15 MB
**Security Impact:** Positive (XSS prevention)

---

**Last Updated:** 2026-02-06
**Status:** Ready to Install
