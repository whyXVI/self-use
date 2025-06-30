<template>
  <div class="param-parse-test">
    <div class="container">
      <div class="left-panel">
        <div class="form-group">
          <label for="password">ENCRYPTION_PASSWORD</label>
          <input 
            id="password"
            type="password" 
            v-model="password" 
            placeholder="Enter encryption password"
            class="input-field"
          />
        </div>
        <div class="form-group textarea-group">
          <label for="params">JSON Parameters</label>
          <textarea 
            id="params"
            v-model="inputText" 
            placeholder="{&#10;  &quot;message&quot;: &quot;Hello World&quot;&#10;}"
            class="input-textarea"
          ></textarea>
        </div>
        <button @click="handleEncrypt" :disabled="isLoading" class="action-button encrypt-button">
          {{ isLoading ? 'Encrypting...' : '1. Encrypt on Client' }}
        </button>
        
        <button 
          @click="handleApiRequest" 
          :disabled="!encryptedOutput || isLoadingApi" 
          class="action-button api-button"
        >
          {{ isLoadingApi ? 'Requesting...' : '2. Send Request to API' }}
        </button>
        </div>
      
      <div class="right-panel">
        <div class="response-container">
            <label>Encrypted Seed (Base64Url)</label>
            <div class="response-area">
                <button 
                  v-if="encryptedOutput && !errorMessage" 
                  @click="copyToClipboard(encryptedOutput)"
                  class="copy-button"
                  title="Copy to clipboard"
                >
                  📋
                </button>
                <pre v-if="errorMessage" class="error-message">{{ errorMessage }}</pre>
                <pre v-else-if="encryptedOutput">{{ encryptedOutput }}</pre>
                <p v-else class="placeholder">Waiting for encryption result...</p>
            </div>
        </div>

        <div class="response-container">
            <label>API Response (`/api/generate`)</label>
            <div class="response-area">
                <button 
                  v-if="apiResponse && !apiError" 
                  @click="copyToClipboard(apiResponse)"
                  class="copy-button"
                  title="Copy to clipboard"
                >
                  📋
                </button>
                <pre v-if="apiError" class="error-message">{{ apiError }}</pre>
                <pre v-else-if="apiResponse">{{ apiResponse }}</pre>
                <p v-else class="placeholder">Waiting for API response...</p>
            </div>
        </div>
        <div class="response-container">
            <label>Decrypted Response</label>
            <div class="response-area">
                <button 
                  v-if="decryptedResponse" 
                  @click="copyToClipboard(JSON.stringify(decryptedResponse, null, 2))"
                  class="copy-button"
                  title="Copy to clipboard"
                >
                  📋
                </button>
                <pre v-if="decryptedResponse">{{ JSON.stringify(decryptedResponse, null, 2) }}</pre>
                <p v-else class="placeholder">Waiting for decryption result...</p>
            </div>
        </div>

        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Zstd } from '@hpcc-js/wasm';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';

const password = ref('123');
const inputText = ref('{"template":2}');
const encryptedOutput = ref('');
const decryptedResponse = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const isLoadingApi = ref(false);
const apiResponse = ref('');
const apiError = ref('');

const textEncoder = new TextEncoder();
const SALT = textEncoder.encode("my-blog-easter-egg");
const HKDF_INFO = textEncoder.encode('blog-encryption');
const NONCE_SIZE = 12;
const AUTH_TAG_SIZE = 16;
const ZSTD_LEVEL = 19;

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}

async function deriveKey(passwordStr: string): Promise<CryptoKey> {
    const passwordBytes = textEncoder.encode(passwordStr);
    
    const derivedKey = hkdf(
        sha256,
        passwordBytes,
        SALT,
        HKDF_INFO,
        32
    );
    
    return crypto.subtle.importKey(
        "raw",
        derivedKey,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]  // Fixed: added decrypt permission
    );
}

async function compress(data: Uint8Array): Promise<Uint8Array> {
  const zstd = await Zstd.load();
  return zstd.compress(data, ZSTD_LEVEL);
}

function toBase64Url(data: Uint8Array): string {
  const binaryString = String.fromCharCode(...data);
  const base64 = btoa(binaryString);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function handleEncrypt() {
  if (!password.value || !inputText.value.trim()) {
    errorMessage.value = 'Error: Both password and JSON parameters are required.';
    encryptedOutput.value = '';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  encryptedOutput.value = '';
  apiResponse.value = '';
  apiError.value = '';

  try {
    let paramsObject;
    try {
      paramsObject = JSON.parse(inputText.value);
    } catch (e) {
      throw new Error("Invalid JSON format.");
    }

    const plaintext = textEncoder.encode(JSON.stringify(paramsObject));
    const compressed = await compress(plaintext);
    const key = await deriveKey(password.value);
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
    
    const encryptedResult = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, tagLength: 128 },
      key,
      compressed
    );
    
    const ciphertext = encryptedResult.slice(0, encryptedResult.byteLength - AUTH_TAG_SIZE);
    const authTag = encryptedResult.slice(encryptedResult.byteLength - AUTH_TAG_SIZE);
    
    const payload = new Uint8Array(NONCE_SIZE + ciphertext.byteLength + AUTH_TAG_SIZE);
    payload.set(nonce, 0);
    payload.set(new Uint8Array(ciphertext), NONCE_SIZE);
    payload.set(new Uint8Array(authTag), NONCE_SIZE + ciphertext.byteLength);
    
    encryptedOutput.value = toBase64Url(payload);

  } catch (error: any) {
    errorMessage.value = `Encryption failed: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function decompress(data: Uint8Array): Promise<Uint8Array> {
  const zstd = await Zstd.load();
  return zstd.decompress(data);
}

function fromBase64Url(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decrypt(encryptedString: string, passwordStr: string): Promise<any> {
  try {
    const payload = fromBase64Url(encryptedString);
    
    const nonce = payload.slice(0, NONCE_SIZE);
    const authTag = payload.slice(payload.length - AUTH_TAG_SIZE);
    const ciphertext = payload.slice(NONCE_SIZE, payload.length - AUTH_TAG_SIZE);
    
    const key = await deriveKey(passwordStr);
    
    const encryptedData = new Uint8Array(ciphertext.length + authTag.length);
    encryptedData.set(ciphertext, 0);
    encryptedData.set(authTag, ciphertext.length);
    
    const compressed = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce, tagLength: 128 },
      key,
      encryptedData
    );
    
    const plaintext = await decompress(new Uint8Array(compressed));
    
    const textDecoder = new TextDecoder();
    const jsonString = textDecoder.decode(plaintext);
    return JSON.parse(jsonString);
    
  } catch (error: any) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

async function handleApiRequest() {
    if (!encryptedOutput.value) {
        apiError.value = "Error: No encrypted seed available. Please generate one first.";
        return;
    }

    isLoadingApi.value = true;
    apiResponse.value = '';
    apiError.value = '';

    try {
        const url = `/api/generate?seed=${encryptedOutput.value}`;
        
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status: ${response.status}. Response: ${errorText || '(empty)'}`);
        }

        apiResponse.value = await response.text();
        

    } catch (error: any) {
        apiError.value = `API request error: ${error.message}`;
    } finally {
        isLoadingApi.value = false;
    }
    try {
        decryptedResponse.value = await decrypt(apiResponse.value, password.value);
    } catch (error: any) {
        throw new Error(`Decryption of API response failed: ${error.message}`);
    }
}

</script>

<style scoped>
/* Styles remain unchanged */
.param-parse-test {
  width: 100%;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.container {
  display: flex;
  gap: 20px;
  height: 100%;
}

.left-panel, .right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.textarea-group {
  flex: 1;
}

label {
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.input-field, .input-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  box-sizing: border-box;
}

.input-textarea {
  flex: 1;
  resize: none;
}

.action-button {
  padding: 12px 20px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s, opacity 0.3s;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.encrypt-button {
  background-color: #28a745;
}

.encrypt-button:hover:not(:disabled) {
  background-color: #218838;
}

.api-button {
  background-color: #007bff;
}

.api-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.response-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.response-area {
  position: relative;
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: auto;
  word-break: break-all;
  min-height: 120px;
}

.response-area pre {
  margin: 0;
  font-family: monospace;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.placeholder {
  color: #6c757d;
  font-style: italic;
  margin: 0;
}

.error-message {
  color: #dc3545;
}

.copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  z-index: 1;
}

.copy-button:hover {
  border-color: #007bff;
}
</style>