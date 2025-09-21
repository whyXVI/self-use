<template>
  <div class="art-generator">
    <div class="container">
      <div class="input-panel">
        <div class="form-group">
          <label for="artisticKey">Enhanced access key</label>
          <input
            id="artisticKey"
            type="password"
            v-model="artisticKey"
            placeholder="Optional passphrase for extended output"
            class="input-field artistic-key"
          />
          <small class="help-text">
            Leave blank for standard rendering. Provide a key to enable secured delivery.
          </small>
        </div>

        <div class="form-group form-group--stretch">
          <label for="params">Art generation parameters</label>
          <textarea 
            id="params"
            v-model="artParams" 
            placeholder="{&#10;  &quot;style&quot;: &quot;geometric&quot;,&#10;  &quot;colorScheme&quot;: &quot;vibrant&quot;,&#10;  &quot;complexity&quot;: &quot;medium&quot;&#10;}"
            class="input-textarea"
          ></textarea>
        </div>
        
        <div class="generation-controls">
          <button 
            @click="generateArt" 
            :disabled="isGenerating || !artParams.trim()" 
            class="action-button generate-button"
          >
            {{ isGenerating ? 'Rendering...' : 'Generate rendering' }}
          </button>
          
          <section class="parameter-hints">
            <header>Parameter guide</header>
            <ul>
              <li>Core: style, colorScheme, complexity, resolution</li>
              <li>Secure fields: password, subscriptionUrl</li>
              <li>Aliases: brushStroke -> password, canvasTexture -> subscriptionUrl</li>
            </ul>
          </section>
        </div>

        <div v-if="errorMessage" class="error-display">
          <p class="error-message">{{ errorMessage }}</p>
        </div>
      </div>
      
      <!-- Single Canvas Result -->
      <div class="canvas-panel">
        <ArtCanvas 
          v-if="artResult"
          :artData="artResult"
          :canvasWidth="800"
          :canvasHeight="600"
          @configCopied="onConfigCopied"
          @canvasClick="onCanvasClick"
        />
        
        <!-- Placeholder when no art -->
        <div v-else class="canvas-placeholder">
          <div class="placeholder-content">
            <h3>Canvas ready</h3>
            <p>Provide parameters to render a composition.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="copySuccess" class="copy-notification">
      {{ copySuccess }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { artGenerator } from '../services/artGenerator'
import type { ArtGenerationResult } from '../types/art'
import ArtCanvas from './ArtCanvas.vue'

// Component state
const artisticKey = ref('')
const artParams = ref('{\n  "style": "geometric",\n  "colorScheme": "vibrant",\n  "complexity": "medium",\n  "brushStroke": "",\n  "canvasTexture": ""\n}')
const artResult = ref<ArtGenerationResult | null>(null)
const isGenerating = ref(false)
const errorMessage = ref('')
const copySuccess = ref('')

// Methods
async function generateArt() {
  if (!artParams.value.trim()) {
    errorMessage.value = 'Please provide art generation parameters'
    return
  }

  isGenerating.value = true
  errorMessage.value = ''
  artResult.value = null
  let paramsObject: any = {}

  try {
    // Parse and validate parameters
    try {
      paramsObject = JSON.parse(artParams.value)
    } catch (e) {
      // Maintain artistic facade even on JSON errors
      errorMessage.value = 'Check the parameter JSON structure'
      return
    }

    // Validate parameters with artistic error messages
    const processedParams = artGenerator.processArtGeneration(paramsObject)
    const validation = artGenerator.validateParameters(processedParams)
    
    if (!validation.isValid) {
      // Transform technical errors to artistic language
      errorMessage.value = validation.errors.join('. ').replace(/parameter/gi, 'setting').replace(/auth/gi, 'enhancement')
      return
    }

    // Generate art using the service with encryption if artistic key provided
    let transmissionData: any

    if (artisticKey.value && artisticKey.value.trim()) {
      // Use encrypted transmission for enhanced artistic features
      try {
        transmissionData = await encrypt(processedParams, artisticKey.value)
        console.log('Using encrypted artistic parameter transmission')
      } catch (encryptError) {
        console.warn('Encryption failed, falling back to standard transmission:', encryptError)
        transmissionData = processedParams
      }
    } else {
      // Use standard transmission (existing logic)
      transmissionData = processedParams
    }

    const result = await artGenerator.generateArt(transmissionData)
    artResult.value = result

    // Show generation success message (disguise authentication status)
    if (result.authenticated) {
      showCopySuccess('Enhanced rendering complete')
    } else {
      showCopySuccess('Rendering complete')
    }

    // Silent degradation - no error messages for failed authentication
    // The system continues to generate art regardless of auth status

  } catch (error: any) {
    // Maintain artistic facade even on errors
    errorMessage.value = 'Unable to complete artistic composition. Please adjust parameters.'
    console.error('Art generation error:', error)
    
    // Even on error, try to show fallback art to maintain disguise
    try {
      const fallbackParams = paramsObject || {}
      const fallbackResult = (artGenerator as any).generateFallbackArt(fallbackParams)
      artResult.value = fallbackResult
      showCopySuccess('Fallback rendering available')
    } catch (fallbackError) {
      console.error('Fallback art generation failed:', fallbackError)
    }
  } finally {
    isGenerating.value = false
  }
}

function onConfigCopied(type: string, _content: string) {
  showCopySuccess(`${type} configuration copied`)
}

function onCanvasClick(event: MouseEvent) {
  // Handle canvas interactions - could be extended for interactive features
  console.log('Canvas clicked at:', event.offsetX, event.offsetY)
}

function showCopySuccess(message: string) {
  copySuccess.value = message
  setTimeout(() => {
    copySuccess.value = ''
  }, 3000)
}

// =============================================================================
// Client-side Encryption Functions (restored from git history 536713d)
// =============================================================================

import { Zstd } from '@hpcc-js/wasm'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha2'

const textEncoder = new TextEncoder()
const SALT = textEncoder.encode("my-blog-easter-egg")
const HKDF_INFO = textEncoder.encode('blog-encryption')
const NONCE_SIZE = 12
const AUTH_TAG_SIZE = 16
const ZSTD_LEVEL = 19

async function deriveKey(passwordStr: string): Promise<CryptoKey> {
    const passwordBytes = textEncoder.encode(passwordStr)

    const derivedKey = hkdf(
        sha256,
        passwordBytes,
        SALT,
        HKDF_INFO,
        32
    )

    return crypto.subtle.importKey(
        "raw",
        derivedKey,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    )
}

async function compress(data: Uint8Array): Promise<Uint8Array> {
  const zstd = await Zstd.load()
  return zstd.compress(data, ZSTD_LEVEL)
}


function toBase64Url(data: Uint8Array): string {
  const binaryString = String.fromCharCode(...data)
  const base64 = btoa(binaryString)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}


async function encrypt(params: any, password: string): Promise<string> {
    const plaintext = textEncoder.encode(JSON.stringify(params))
    const compressed = await compress(plaintext)
    const key = await deriveKey(password)
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_SIZE))

    const encryptedResult = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, tagLength: 128 },
      key,
      compressed
    )

    const ciphertext = encryptedResult.slice(0, encryptedResult.byteLength - AUTH_TAG_SIZE)
    const authTag = encryptedResult.slice(encryptedResult.byteLength - AUTH_TAG_SIZE)

    const payload = new Uint8Array(NONCE_SIZE + ciphertext.byteLength + AUTH_TAG_SIZE)
    payload.set(nonce, 0)
    payload.set(new Uint8Array(ciphertext), NONCE_SIZE)
    payload.set(new Uint8Array(authTag), NONCE_SIZE + ciphertext.byteLength)

    return toBase64Url(payload)
}

// Decrypt function removed - not used in frontend component
// Decryption is handled by the backend API
</script>

<style scoped>
.art-generator {
  min-height: 100vh;
  padding: 32px 48px;
  background: var(--color-bg);
  color: var(--color-text-primary);
}

.container {
  display: flex;
  gap: 40px;
  align-items: stretch;
  max-width: 1280px;
  margin: 0 auto;
}

.input-panel {
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.canvas-panel {
  flex: 1;
  min-width: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group--stretch {
  flex: 1;
}

.form-group--stretch .input-textarea {
  flex: 1;
}

label {
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.input-field {
  background: var(--color-surface-muted);
}

.input-textarea {
  flex: 1;
  min-height: 260px;
  resize: vertical;
  background: var(--color-surface-muted);
  font-size: 0.95rem;
  line-height: 1.5;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
}

.input-textarea::-webkit-scrollbar {
  width: 6px;
}

.input-textarea::-webkit-scrollbar-track {
  background: transparent;
}

.input-textarea::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.input-textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.18);
}

.help-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.generation-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.generate-button {
  align-self: flex-start;
}

.generate-button:hover:not(:disabled) {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.parameter-hints {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 16px;
  background: var(--color-surface-muted);
}

.parameter-hints header {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.parameter-hints ul {
  list-style: disc;
  padding-left: 18px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.error-display {
  border: 1px solid rgba(255, 107, 107, 0.4);
  border-radius: 6px;
  padding: 12px 14px;
  background: rgba(255, 107, 107, 0.08);
}

.error-message {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.9rem;
}

.canvas-placeholder {
  width: 100%;
  height: 100%;
  min-height: 420px;
  border-radius: 6px;
  border: 1px dashed var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  text-align: center;
}

.placeholder-content h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.placeholder-content p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.copy-notification {
  position: fixed;
  top: 24px;
  right: 32px;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

@media (max-width: 1200px) {
  .container {
    flex-direction: column;
    gap: 24px;
  }

  .input-panel {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 768px) {
  .art-generator {
    padding: 24px;
  }

  .canvas-panel {
    padding: 16px;
  }
}
</style>
