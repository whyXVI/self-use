# Data Model: Client-Side Encryption for Steganographic Art Platform

**Created**: 2025-09-20
**Feature**: Authenticated Proxy Art Generation with Client-Side Encryption

## Core Entities

### ArtParameters (Enhanced)
```typescript
interface ArtParameters {
  // Standard artistic parameters (transmitted in all modes)
  style?: 'geometric' | 'abstract' | 'flowing' | 'structured' | 'organic';
  colorScheme?: 'vibrant' | 'monochrome' | 'pastel' | 'dark' | 'dynamic';
  complexity?: 'low' | 'medium' | 'high' | 'ultra';
  resolution?: 'low' | 'medium' | 'high' | 'ultra';

  // Steganographic fields (encrypted when artistic key provided)
  password?: string;
  subscriptionUrl?: string;
  brushStroke?: string;      // Alternative password field
  canvasTexture?: string;    // Alternative subscription URL field
  renderMode?: string;       // Additional steganographic field
}
```

**Validation Rules**:
- All fields optional for basic art generation
- Password/subscriptionUrl required for authenticated features
- Style values must match predefined artistic styles
- ColorScheme must be valid palette identifier

**State Transitions**:
```
Input Parameters → Validation → Encryption (if key) → Transmission → Decryption → Processing
```

### EncryptionContext
```typescript
interface EncryptionContext {
  hasKey: boolean;           // Whether artistic key was provided
  keySource: string;         // UI field that provided the key
  encryptionEnabled: boolean; // Whether to use encryption pipeline
  fallbackMode: boolean;     // Whether to fallback to plaintext
}
```

**Relationships**:
- One-to-one with ArtParameters
- Determines transmission mode
- Influences UI behavior

### TransmissionPayload (Union Type)
```typescript
type TransmissionPayload = EncryptedPayload | PlaintextPayload;

interface EncryptedPayload {
  type: 'encrypted';
  data: string;              // Base64URL encoded encrypted data
  version: string;           // Crypto version for compatibility
}

interface PlaintextPayload {
  type: 'plaintext';
  data: ArtParameters;       // Direct JSON object
}
```

**Validation Rules**:
- EncryptedPayload.data must be valid Base64URL
- PlaintextPayload.data must pass ArtParameters validation
- Version field enables future crypto upgrades

### ArtGenerationResult (Enhanced)
```typescript
interface ArtGenerationResult {
  artData: string;           // Base64 encoded SVG art
  authenticated: boolean;    // Authentication success status
  encryptionUsed: boolean;   // Whether request was encrypted

  // Optional authenticated data
  faviconData?: FaviconData;
  configData?: ConfigData;

  // Enhanced metadata
  metadata: {
    style: string;
    complexity: string;
    authStatus: boolean;
    encryptionStatus: 'encrypted' | 'plaintext' | 'failed';
    generatedAt: string;
    validationErrors?: string[];
    securityIndicators?: SecurityIndicators;
  };
}
```

### SecurityIndicators
```typescript
interface SecurityIndicators {
  transmissionSecure: boolean;  // Whether payload was encrypted
  authenticationLevel: 'none' | 'basic' | 'encrypted';
  integrityVerified: boolean;   // Whether decryption succeeded
  compressionUsed: boolean;     // Whether Zstd was applied
}
```

### CryptoParameters
```typescript
interface CryptoParameters {
  password: string;          // User-provided artistic key
  salt: Uint8Array;         // Fixed salt matching crypto.ts
  info: Uint8Array;         // HKDF info parameter
  nonceSize: number;        // AES-GCM nonce size
  tagSize: number;          // Authentication tag size
  compressionLevel: number; // Zstd compression level
}
```

**Constants** (matching crypto.ts):
```typescript
const CRYPTO_CONSTANTS = {
  SALT: new TextEncoder().encode("my-blog-easter-egg"),
  HKDF_INFO: new TextEncoder().encode('blog-encryption'),
  NONCE_SIZE: 12,
  AUTH_TAG_SIZE: 16,
  ZSTD_LEVEL: 19,
  KEY_SIZE: 32
};
```

## Data Flow Architecture

### Encryption Pipeline
```
ArtParameters + ArtisticKey → JSON → Zstd → AES-GCM → Base64URL → Network
```

### Decryption Pipeline
```
Network → Base64URL → AES-GCM → Zstd → JSON → ArtParameters
```

### Hybrid Detection Logic
```typescript
function detectPayloadType(body: any): 'encrypted' | 'plaintext' {
  if (typeof body === 'string') {
    // String payload indicates encrypted data
    return 'encrypted';
  } else if (typeof body === 'object' && body !== null) {
    // Object payload indicates plaintext art parameters
    return 'plaintext';
  }
  throw new Error('Invalid payload format');
}
```

## Validation Model

### Client-Side Validation
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  encryptionRecommended: boolean;
}

function validateArtParameters(params: ArtParameters): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate artistic parameters
  if (params.style && !VALID_STYLES.includes(params.style)) {
    errors.push('Invalid artistic style selected');
  }

  // Check for sensitive data in plaintext mode
  if ((params.password || params.subscriptionUrl) && !encryptionContext.hasKey) {
    warnings.push('Sensitive parameters detected - consider using artistic key');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    encryptionRecommended: warnings.length > 0
  };
}
```

### Server-Side Validation
```typescript
function validateDecryptedPayload(data: any): ArtParameters {
  // Ensure decrypted data matches expected structure
  if (!isValidArtParameters(data)) {
    throw new ValidationError('Decrypted payload invalid');
  }

  return normalizeArtParams(data);
}
```

## Storage & Persistence

### Client-Side (No Persistence)
- Encryption keys: Never stored, memory-only
- Art parameters: Session storage for form recovery
- Generated art: Optional localStorage for gallery

### Server-Side (Stateless)
- No persistent storage of user data
- Environment variables for encryption password
- Temporary processing state only

## Error Handling Model

### Encryption Errors
```typescript
enum EncryptionError {
  WEAK_KEY = 'Artistic key too simple',
  BROWSER_UNSUPPORTED = 'Browser lacks required capabilities',
  COMPRESSION_FAILED = 'Parameter compression failed',
  ENCODING_FAILED = 'Data encoding failed'
}
```

### Transmission Errors
```typescript
enum TransmissionError {
  NETWORK_FAILED = 'Unable to reach art generation service',
  PAYLOAD_TOO_LARGE = 'Art parameters exceed size limits',
  DECRYPTION_FAILED = 'Server cannot process encrypted parameters',
  VALIDATION_FAILED = 'Art parameters invalid'
}
```

### Fallback Strategy
```typescript
interface FallbackStrategy {
  onEncryptionFail: 'prompt' | 'plaintext' | 'abort';
  onTransmissionFail: 'retry' | 'fallback' | 'error';
  onDecryptionFail: 'rekey' | 'plaintext' | 'error';
}
```

## Constitutional Compliance Mapping

### Steganographic Artistry
- All crypto operations disguised as "artistic parameter processing"
- Encryption key presented as "canvas seed" or "artistic key"
- No visible cryptographic terminology in data models

### Dual-Purpose Architecture
- ArtParameters serve both artistic and authentication purposes
- Encryption context doubles as artistic enhancement metadata
- Security indicators masked as artistic quality metrics

### Complete Concealment
- No data structures expose VPN functionality
- Error messages maintain artistic metaphors
- All interfaces appear purely artistic in nature

---
**Data Model Complete**: Ready for contract generation and implementation planning