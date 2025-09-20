# Quickstart Guide: Client-Side Encryption for Steganographic Art Platform

**Feature**: Authenticated Proxy Art Generation with Client-Side Encryption
**Target Audience**: Developers implementing the encryption enhancement
**Prerequisites**: Vue 3, TypeScript, understanding of existing codebase

## Overview

This guide walks through implementing client-side encryption to secure the transmission of art generation parameters while maintaining the steganographic artistic facade. The enhancement adds a security layer without compromising the constitutional requirement for complete concealment.

## Quick Start (5 minutes)

### 1. Verify Current State
```bash
# Confirm you're on the correct branch
git status
# Should show: On branch 002-json-arguments-argument

# Check existing implementation
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"style":"geometric","colorScheme":"vibrant"}'
```

### 2. Install Additional Dependencies (if needed)
```bash
# Check if already installed
npm list @hpcc-js/wasm @noble/hashes

# Install if missing
npm install @hpcc-js/wasm @noble/hashes
```

### 3. Test Encryption Compatibility
```bash
# Test existing crypto.ts functionality
node -e "
  const { encrypt, decrypt } = require('./api/utils/crypto.js');
  encrypt({test: 'data'}).then(encrypted =>
    decrypt(encrypted).then(decrypted =>
      console.log('Crypto test:', decrypted)
    )
  );
"
```

## Implementation Steps

### Step 1: Create Client-Side Crypto Module

Create `src/utils/clientCrypto.ts`:

```typescript
import { Zstd } from '@hpcc-js/wasm';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';

// Constants matching crypto.ts
const textEncoder = new TextEncoder();
const SALT = textEncoder.encode("my-blog-easter-egg");
const HKDF_INFO = textEncoder.encode('blog-encryption');
const NONCE_SIZE = 12;
const AUTH_TAG_SIZE = 16;
const ZSTD_LEVEL = 19;

export class ClientCrypto {
  // Implementation here - see data-model.md for full details
  async encrypt(params: any, password: string): Promise<string> {
    // Match crypto.ts implementation exactly
  }

  async decrypt(encryptedString: string, password: string): Promise<any> {
    // Match crypto.ts implementation exactly
  }
}
```

### Step 2: Enhance ParamParseTest.vue

Add artistic key input and encryption workflow:

```vue
<template>
  <div class="art-generator">
    <!-- Add artistic key input -->
    <div class="form-group">
      <label for="artisticKey">Artistic Enhancement Key (Optional)</label>
      <input
        id="artisticKey"
        type="password"
        v-model="artisticKey"
        placeholder="Enter key for enhanced generation features"
        class="input-field artistic-key"
      />
      <small class="help-text">
        Provides access to advanced artistic features and texture sources
      </small>
    </div>

    <!-- Existing art parameters -->
    <div class="form-group">
      <label for="params">Art Generation Parameters</label>
      <textarea
        id="params"
        v-model="artParams"
        class="input-textarea"
      ></textarea>
    </div>

    <!-- Enhanced generation button -->
    <button
      @click="generateArt"
      :disabled="isGenerating || !artParams.trim()"
      class="action-button generate-button"
    >
      {{ generateButtonText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ClientCrypto } from '../utils/clientCrypto'

const artisticKey = ref('')
const artParams = ref('{"style": "geometric", "colorScheme": "vibrant"}')
const isGenerating = ref(false)

const generateButtonText = computed(() => {
  if (isGenerating.value) return 'Generating Art...'
  return artisticKey.value ? '🎨 Generate Enhanced Art' : '🎨 Generate Art'
})

async function generateArt() {
  // Implementation with encryption logic
}
</script>
```

### Step 3: Update Art Generator Service

Modify `src/services/artGenerator.ts`:

```typescript
import { ClientCrypto } from '../utils/clientCrypto'

export class ArtGeneratorService {
  private crypto = new ClientCrypto()

  async generateArt(params: ArtParameters, artisticKey?: string): Promise<ArtGenerationResult> {
    try {
      let payload: any

      if (artisticKey && artisticKey.trim()) {
        // Encrypt payload for secure transmission
        payload = await this.crypto.encrypt(params, artisticKey)
      } else {
        // Use plaintext for standard art generation
        payload = params
      }

      const response = await fetch(`${this.apiBase}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      return await response.json()
    } catch (error) {
      // Handle errors with artistic facade maintained
      return this.generateFallbackArt(params)
    }
  }
}
```

### Step 4: Enhance Backend Endpoint

Update `api/generate.ts` POST handler:

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json()

    let normalizedParams: ArtParameters
    let encryptionUsed = false

    if (typeof body === 'string') {
      // Encrypted payload detected
      const decryptedParams = await decrypt(body)
      normalizedParams = normalizeArtParams(decryptedParams)
      encryptionUsed = true
    } else {
      // Plaintext payload (existing functionality)
      normalizedParams = normalizeArtParams(body)
    }

    // Continue with existing processing logic...
    const result = await processArtGeneration(normalizedParams)

    return new Response(JSON.stringify({
      ...result,
      encryptionUsed
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    // Maintain artistic facade even on errors
    return generateFallbackArtResponse(error)
  }
}
```

## Testing Strategy

### Unit Tests

Create `tests/unit/clientCrypto.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ClientCrypto } from '../../src/utils/clientCrypto'

describe('ClientCrypto', () => {
  const crypto = new ClientCrypto()

  it('encrypts and decrypts art parameters correctly', async () => {
    const params = { style: 'geometric', password: 'test' }
    const password = 'artistic_key_123'

    const encrypted = await crypto.encrypt(params, password)
    const decrypted = await crypto.decrypt(encrypted, password)

    expect(decrypted).toEqual(params)
  })

  it('matches server-side crypto.ts implementation', async () => {
    // Cross-compatibility test
  })
})
```

### Integration Tests

Create `tests/integration/encryptedArtGeneration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('Encrypted Art Generation', () => {
  it('generates art with encrypted parameters', async () => {
    // Test full encryption workflow
  })

  it('maintains backward compatibility with plaintext', async () => {
    // Test hybrid payload handling
  })

  it('handles encryption errors gracefully', async () => {
    // Test fallback scenarios
  })
})
```

### Manual Testing

```bash
# Test encrypted transmission
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '"eyJzdHlsZSI6Imdlb21ldHJpYyJ9..."'  # Encrypted payload

# Test plaintext transmission (backward compatibility)
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"style":"geometric","colorScheme":"vibrant"}'

# Test UI workflow
npm run dev
# Navigate to localhost:5173
# Test with and without artistic key
```

## Verification Checklist

### Functional Requirements
- [ ] Client-side encryption matches crypto.ts implementation
- [ ] Artistic key input maintains steganographic disguise
- [ ] Hybrid payload detection works correctly
- [ ] Backward compatibility preserved
- [ ] Error handling maintains artistic facade
- [ ] Performance targets met (<200ms encryption)

### Security Requirements
- [ ] No plaintext sensitive data in network logs
- [ ] Encryption keys never persisted
- [ ] Man-in-the-middle attack prevented
- [ ] Integrity verification working
- [ ] Compression reduces information leakage

### Constitutional Compliance
- [ ] No visible cryptographic terminology
- [ ] Artistic facade maintained throughout
- [ ] No discoverable hints of hidden functionality
- [ ] Enhanced features disguised as artistic tools
- [ ] Error messages use artistic metaphors

### User Experience
- [ ] Progressive enhancement working
- [ ] Optional encryption doesn't disrupt basic usage
- [ ] Visual feedback appropriate
- [ ] Performance acceptable for artistic workflow

## Troubleshooting

### Common Issues

**Encryption fails in browser**:
```bash
# Check Web Crypto API support
node -e "console.log(typeof crypto.subtle)"
# Check Zstd wasm loading
npm run dev -- --debug
```

**Backend can't decrypt payload**:
```bash
# Verify crypto.ts compatibility
# Check environment variables
echo $ENCRYPTION_PASSWORD
```

**Performance issues**:
```bash
# Profile encryption performance
# Check payload size limits
# Verify compression working
```

### Debug Commands

```bash
# Check network transmission
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '"encrypted_payload_here"' \
  --verbose

# Test crypto compatibility
node -e "
  const crypto = require('./api/utils/crypto.js');
  // Test encryption/decryption pipeline
"
```

## Next Steps

1. **Run the test suite**: `npm test`
2. **Test UI workflow**: `npm run dev`
3. **Verify network security**: Use browser dev tools to confirm encrypted payloads
4. **Performance validation**: Test with various payload sizes
5. **Constitutional compliance check**: Verify artistic facade maintained

## Success Criteria

- ✅ All unit tests passing
- ✅ Integration tests validate hybrid functionality
- ✅ Manual testing confirms encrypted transmission
- ✅ Backward compatibility preserved
- ✅ Performance targets met
- ✅ Constitutional principles maintained
- ✅ No security regressions introduced

---
**Implementation Time**: ~3-4 hours for core functionality
**Testing Time**: ~1-2 hours for comprehensive validation
**Total Effort**: ~5-6 hours including documentation updates