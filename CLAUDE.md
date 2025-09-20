# proxy_art Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-20

## Active Technologies
- TypeScript 5.8.3, Vue 3.x, Node.js (Vercel runtime) (002-json-arguments-argument)
- @hpcc-js/wasm (Zstd), @noble/hashes (HKDF), Web Crypto API (002-json-arguments-argument)

## Project Structure
```
src/
├── components/    # Vue components (ParamParseTest.vue)
├── services/      # Service layer (artGenerator.ts)
├── types/         # TypeScript definitions
└── utils/         # Utilities (clientCrypto.ts)
api/
├── generate.ts    # Main generation endpoint
└── utils/         # Server utilities (crypto.ts)
tests/
├── unit/          # Unit tests
└── integration/   # Integration tests
```

## Commands
# Development
npm run dev
npm run build
npm test

# Feature-specific
npm run dev:vercel    # Vercel development server
npm run test:ui       # Vitest UI

## Code Style
- Follow Vue 3 Composition API patterns
- Use TypeScript strict mode
- Maintain steganographic artistic facade in all interfaces
- Match crypto.ts encryption implementation exactly

## Recent Changes
- 002-json-arguments-argument: Added client-side encryption with artistic key disguise

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->