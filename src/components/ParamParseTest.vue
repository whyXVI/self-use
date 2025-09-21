<template>
  <div class="art-generator">
    <div class="container">
      <!-- Single Input Panel -->
      <div class="input-panel">
        <div class="form-group">
          <label for="artisticKey">艺术增强密钥 (可选)</label>
          <input
            id="artisticKey"
            type="password"
            v-model="artisticKey"
            placeholder="提供访问高级艺术特性的密钥"
            class="input-field artistic-key"
          />
          <small class="help-text">
            此密钥解锁高级纹理来源和增强渲染功能
          </small>
        </div>

        <div class="form-group">
          <label for="params">Art Generation Parameters</label>
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
            {{ isGenerating ? 'Generating Art...' : '🎨 Generate Art' }}
          </button>
          
          <div class="parameter-hints">
            <p>Core: style, colorScheme, complexity, resolution</p>
            <p>Enhanced: password (brush intensity), subscriptionUrl (texture source)</p>
            <p>Alternative: brushStroke, canvasTexture, renderMode</p>
          </div>
        </div>

        <!-- Error Display -->
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
            <div class="placeholder-icon">🎨</div>
            <h3>Artistic Canvas</h3>
            <p>Enter parameters above and generate to see your art composition</p>
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
const artParams = ref('{\n  "style": "geometric",\n  "colorScheme": "vibrant",\n  "complexity": "medium",\n  "password": "",\n  "subscriptionUrl": ""\n}')
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
      errorMessage.value = 'Please check the artistic parameter format'
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
      showCopySuccess('Art generated with enhanced artistic features!')
    } else {
      showCopySuccess('Art generated successfully!')
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
      showCopySuccess('Basic art composition generated')
    } catch (fallbackError) {
      console.error('Fallback art generation failed:', fallbackError)
    }
  } finally {
    isGenerating.value = false
  }
}

function onConfigCopied(type: string, _content: string) {
  showCopySuccess(`${type} configuration copied to clipboard`)
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
  width: 100%;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #00ff41;
  position: relative;
}

.art-generator::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(0, 255, 65, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(0, 255, 65, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.container {
  display: flex;
  gap: 20px;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.input-panel {
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: rgba(13, 17, 23, 0.95);
  border: 1px solid #333;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 255, 65, 0.1);
  backdrop-filter: blur(10px);
}

.canvas-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #00ff41;
  font-size: 16px;
  text-shadow: 0 0 2px #00ff41;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.input-textarea {
  width: 100%;
  min-height: 200px;
  padding: 16px;
  border: 2px solid #333;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
  transition: all 0.3s ease;
  background: #1a1a1a;
  color: #00ff41;
  text-shadow: 0 0 2px #00ff41;
}

.input-textarea:focus {
  outline: none;
  border-color: #00ff41;
  background: #0d1117;
  box-shadow: 0 0 8px rgba(0, 255, 65, 0.3);
}

.input-textarea::placeholder {
  color: #006600;
  opacity: 0.7;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #333;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  box-sizing: border-box;
  transition: all 0.3s ease;
  background: #1a1a1a;
  color: #00ff41;
  text-shadow: 0 0 2px #00ff41;
}

.input-field:focus {
  outline: none;
  border-color: #00ff41;
  background: #0d1117;
  box-shadow: 0 0 8px rgba(0, 255, 65, 0.3);
}

.input-field::placeholder {
  color: #006600;
  opacity: 0.7;
}

.artistic-key {
  background: linear-gradient(135deg, #0d1117 0%, #1a1a1a 100%);
  border-left: 4px solid #00ff41;
  box-shadow: 0 0 4px rgba(0, 255, 65, 0.2);
}

.help-text {
  margin-top: 6px;
  font-size: 12px;
  color: #00cc33;
  line-height: 1.4;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  opacity: 0.8;
}

.generation-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-button {
  padding: 12px 24px;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-align: center;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.generate-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.parameter-hints {
  padding: 12px;
  background: linear-gradient(135deg, #0d1117 0%, #1a1a1a 100%);
  border-radius: 8px;
  border-left: 4px solid #00ff41;
  border: 1px solid #333;
}

.parameter-hints p {
  margin: 4px 0;
  font-size: 13px;
  color: #00cc33;
  line-height: 1.4;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.parameter-hints p:first-child {
  font-weight: 500;
  color: #00ff41;
  text-shadow: 0 0 2px #00ff41;
}

.error-display {
  padding: 12px;
  background: linear-gradient(135deg, #2d1b1b 0%, #3d1f1f 100%);
  border-radius: 8px;
  border-left: 4px solid #ff4444;
  border: 1px solid #ff4444;
  box-shadow: 0 0 8px rgba(255, 68, 68, 0.2);
}

.error-message {
  color: #ff6666;
  margin: 0;
  font-weight: 500;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  text-shadow: 0 0 2px #ff6666;
}

.canvas-placeholder {
  width: 800px;
  height: 600px;
  background: linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 255, 65, 0.1);
  backdrop-filter: blur(10px);
  border: 2px dashed #00ff41;
  position: relative;
  overflow: hidden;
}

.canvas-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 20px,
    rgba(0, 255, 65, 0.05) 20px,
    rgba(0, 255, 65, 0.05) 40px
  );
  pointer-events: none;
}

.placeholder-content {
  text-align: center;
  color: #00cc33;
  position: relative;
  z-index: 1;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.8;
  color: #00ff41;
  text-shadow: 0 0 10px #00ff41;
}

.placeholder-content h3 {
  margin: 0 0 0.5rem 0;
  color: #00ff41;
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  text-shadow: 0 0 4px #00ff41;
}

.placeholder-content p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  max-width: 300px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  opacity: 0.8;
}

.copy-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  font-weight: 500;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive design */
@media (max-width: 1200px) {
  .container {
    flex-direction: column;
    gap: 16px;
  }
  
  .input-panel {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .canvas-placeholder {
    width: 100%;
    max-width: 800px;
    height: 400px;
  }
}

@media (max-width: 768px) {
  .art-generator {
    padding: 12px;
  }
  
  .input-panel {
    padding: 16px;
  }
  
  .input-textarea {
    min-height: 150px;
  }
  
  .canvas-placeholder {
    height: 300px;
  }
}
</style>