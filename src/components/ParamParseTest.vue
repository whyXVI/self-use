<template>
  <div class="art-generator">
    <div class="container">
      <!-- Single Input Panel -->
      <div class="input-panel">
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

    // Generate art using the service (handles silent degradation internally)
    const result = await artGenerator.generateArt(processedParams)
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
</script>

<style scoped>
.art-generator {
  width: 100%;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
}

.container {
  display: flex;
  gap: 20px;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.input-panel {
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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
  color: #495057;
  font-size: 16px;
}

.input-textarea {
  width: 100%;
  min-height: 200px;
  padding: 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  background: #f8f9fa;
}

.input-textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
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
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.parameter-hints p {
  margin: 4px 0;
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

.parameter-hints p:first-child {
  font-weight: 500;
  color: #495057;
}

.error-display {
  padding: 12px;
  background: linear-gradient(135deg, #ffe6e6 0%, #ffcccc 100%);
  border-radius: 8px;
  border-left: 4px solid #dc3545;
}

.error-message {
  color: #dc3545;
  margin: 0;
  font-weight: 500;
}

.canvas-placeholder {
  width: 800px;
  height: 600px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 2px dashed #dee2e6;
}

.placeholder-content {
  text-align: center;
  color: #6c757d;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.placeholder-content h3 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 1.5rem;
  font-weight: 600;
}

.placeholder-content p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  max-width: 300px;
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