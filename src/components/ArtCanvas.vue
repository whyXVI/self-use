<template>
  <div class="art-canvas-container">
    <!-- Canvas Area -->
    <div class="canvas-section">
      <canvas 
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        class="art-canvas"
        @click="onCanvasClick"
      />
      
      <!-- Enhanced Loading Overlay -->
      <div v-if="isGenerating" class="loading-overlay">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-progress">
            <div class="progress-bar"></div>
          </div>
          <p class="loading-text">{{ loadingMessage }}</p>
        </div>
      </div>

      <!-- Canvas Toolbar -->
      <div class="canvas-toolbar">
        <button 
          @click="downloadArt" 
          :disabled="!hasArt"
          class="toolbar-button download-button"
          title="Download artwork"
        >
          🎨 Download Art
        </button>
        
        <button 
          v-if="showConfigButton"
          @click="toggleConfigPanel" 
          class="toolbar-button config-button"
          title="Configuration access"
        >
          ⚙️ Tools
        </button>
        
        <div class="canvas-info">
          {{ canvasWidth }}×{{ canvasHeight }}
        </div>
      </div>
    </div>

    <!-- Favicon Integration -->
    <div v-if="faviconData" class="favicon-integration">
      <FaviconDisplay 
        :faviconData="faviconData"
        :showOverlay="true"
        :showInfo="false"
      />
    </div>

    <!-- Config Panel (Hidden/Artistic) -->
    <div v-if="showConfigPanel && configData" class="config-panel">
      <div class="config-header">
        <h3>Artistic Tools</h3>
        <button @click="toggleConfigPanel" class="close-button">×</button>
      </div>
      
      <div class="config-content">
        <div class="config-section">
          <label>Composition Profile</label>
          <div class="config-actions">
            <button 
              @click="copyConfig('singbox')"
              class="config-copy-button"
              title="Copy structured composition data"
            >
              📋 Structure
            </button>
            <button 
              @click="copyConfig('clash')"
              class="config-copy-button"
              title="Copy style composition data"
            >
              📋 Style
            </button>
          </div>
        </div>
        
        <div class="config-metadata">
          <p>Generated: {{ formattedTimestamp }}</p>
          <p>Authentication: {{ authStatus }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { ArtGenerationResult, FaviconData } from '../types/art'
import FaviconDisplay from './FaviconDisplay.vue'

interface Props {
  artData?: ArtGenerationResult
  canvasWidth?: number
  canvasHeight?: number
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  canvasWidth: 800,
  canvasHeight: 600,
  backgroundColor: '#f8f9fa'
})

// Emits
const emit = defineEmits<{
  configCopied: [type: string, content: string]
  canvasClick: [event: MouseEvent]
}>()

// Refs
const canvasRef = ref<HTMLCanvasElement>()
const isGenerating = ref(false)
const showConfigPanel = ref(false)
const loadingMessage = ref('Generating artistic composition...')

// Loading messages for enhanced user experience
const loadingMessages = [
  'Generating artistic composition...',
  'Applying color schemes...',
  'Integrating textures...',
  'Optimizing canvas...',
  'Finalizing artwork...'
]

// Computed properties
const hasArt = computed(() => !!props.artData?.artData)

const faviconData = computed(() => props.artData?.faviconData)

const configData = computed(() => props.artData?.configData)

const showConfigButton = computed(() => {
  return props.artData?.authenticated && configData.value
})

const authStatus = computed(() => {
  if (!props.artData) return 'Not generated'
  // Disguise authentication status as artistic generation mode
  return props.artData.authenticated ? 'Enhanced mode' : 'Standard mode'
})

// Authentication indicators for potential future use
// const hasAuthenticationIndicators = computed(() => {
//   return props.artData?.authenticated && props.artData?.faviconData
// })

const formattedTimestamp = computed(() => {
  if (!props.artData?.metadata?.generatedAt) return 'Unknown'
  return new Date(props.artData.metadata.generatedAt).toLocaleString()
})

// Methods
const updateLoadingMessage = (index: number) => {
  if (index < loadingMessages.length) {
    loadingMessage.value = loadingMessages[index]
  }
}

const renderArt = async () => {
  if (!canvasRef.value || !props.artData?.artData) return

  isGenerating.value = true
  const startTime = performance.now()
  let messageIndex = 0
  
  try {
    updateLoadingMessage(messageIndex++)
    
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Performance optimization: Use offscreen canvas for complex operations
    const offscreenCanvas = new OffscreenCanvas(props.canvasWidth, props.canvasHeight)
    const offscreenCtx = offscreenCanvas.getContext('2d')
    if (!offscreenCtx) return

    updateLoadingMessage(messageIndex++)

    // Clear offscreen canvas
    offscreenCtx.fillStyle = props.backgroundColor
    offscreenCtx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)

    // Load and render the art data with timeout for performance
    const renderPromises: Promise<void>[] = []

    updateLoadingMessage(messageIndex++)

    if (props.artData.artData.startsWith('data:image/svg+xml')) {
      renderPromises.push(renderSVGArt(offscreenCtx, props.artData.artData))
    } else {
      renderPromises.push(renderImageArt(offscreenCtx, props.artData.artData))
    }

    // Integrate favicon if available and authenticated
    if (faviconData.value && props.artData.authenticated) {
      renderPromises.push(integrateFavicon(offscreenCtx, faviconData.value))
    }

    updateLoadingMessage(messageIndex++)

    // Wait for all rendering with timeout (performance requirement: <2s)
    await Promise.race([
      Promise.all(renderPromises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Rendering timeout')), 1800)
      )
    ])

    updateLoadingMessage(messageIndex++)

    // Transfer to main canvas
    const imageBitmap = offscreenCanvas.transferToImageBitmap()
    ctx.drawImage(imageBitmap, 0, 0)

    const endTime = performance.now()
    console.log(`Art rendering completed in ${Math.round(endTime - startTime)}ms`)

  } catch (error) {
    console.error('Error rendering art:', error)
    // Fallback to simple rendering if complex rendering fails
    await renderSimpleFallback()
  } finally {
    isGenerating.value = false
    loadingMessage.value = loadingMessages[0] // Reset for next time
  }
}

const renderSimpleFallback = async () => {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Simple gradient fallback
  const gradient = ctx.createLinearGradient(0, 0, props.canvasWidth, props.canvasHeight)
  gradient.addColorStop(0, '#667eea')
  gradient.addColorStop(1, '#764ba2')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
  
  // Simple text
  ctx.fillStyle = 'white'
  ctx.font = '24px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Art Generation', props.canvasWidth / 2, props.canvasHeight / 2)
}

const renderSVGArt = async (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, svgData: string) => {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, props.canvasWidth, props.canvasHeight)
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load SVG art'))
    img.src = svgData
  })
}

const renderImageArt = async (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, imageData: string) => {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, props.canvasWidth, props.canvasHeight)
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image art'))
    img.src = imageData
  })
}

const integrateFavicon = async (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, favicon: FaviconData) => {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        // Position favicon as artistic texture element
        const faviconSize = 64
        const x = props.canvasWidth - faviconSize - 20
        const y = 20
        
        // Add subtle artistic integration
        ctx.globalAlpha = 0.8
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        
        ctx.drawImage(img, x, y, faviconSize, faviconSize)
        
        // Reset context
        ctx.globalAlpha = 1
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => {
      console.warn('Failed to load favicon for integration')
      resolve() // Continue without favicon
    }
    
    img.src = favicon.encoded
  })
}

const downloadArt = () => {
  if (!canvasRef.value || !hasArt.value) return

  try {
    const canvas = canvasRef.value
    const link = document.createElement('a')
    
    link.download = `artwork-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Failed to download artwork:', error)
  }
}

const toggleConfigPanel = () => {
  showConfigPanel.value = !showConfigPanel.value
}

const copyConfig = async (type: 'singbox' | 'clash') => {
  if (!configData.value) return

  try {
    let content = ''
    
    if (type === 'singbox' && configData.value.singbox) {
      content = JSON.stringify(configData.value.singbox, null, 2)
    } else if (type === 'clash' && configData.value.clash) {
      content = configData.value.clash
    }

    if (content) {
      await navigator.clipboard.writeText(content)
      emit('configCopied', type, content)
    }
  } catch (error) {
    console.error('Failed to copy config:', error)
  }
}

const onCanvasClick = (event: MouseEvent) => {
  emit('canvasClick', event)
}

// Watchers
watch(() => props.artData, async () => {
  if (props.artData?.artData) {
    await nextTick()
    renderArt()
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  if (props.artData?.artData) {
    await nextTick()
    renderArt()
  }
})
</script>

<style scoped>
.art-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.canvas-section {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 1rem;
}

.art-canvas {
  display: block;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
  transition: all 0.3s ease;
}

.art-canvas:hover {
  transform: scale(1.01);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(248, 249, 250, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  backdrop-filter: blur(8px);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e3e6ea;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.loading-progress {
  width: 200px;
  height: 4px;
  background: #e3e6ea;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  animation: progress 2s ease-in-out infinite;
}

.loading-text {
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
  text-align: center;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes progress {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  backdrop-filter: blur(8px);
}

.toolbar-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.9);
  color: #495057;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.download-button:hover:not(:disabled) {
  background: #e8f5e8;
  color: #28a745;
}

.config-button:hover {
  background: #e8f2ff;
  color: #0066cc;
}

.canvas-info {
  font-size: 0.75rem;
  color: #6c757d;
  font-family: monospace;
}

.favicon-integration {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
}

.config-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  min-width: 320px;
  z-index: 10;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.config-header h3 {
  margin: 0;
  color: #495057;
  font-size: 1.1rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f8f9fa;
  color: #495057;
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-section label {
  font-weight: 500;
  color: #495057;
  font-size: 0.875rem;
}

.config-actions {
  display: flex;
  gap: 0.5rem;
}

.config-copy-button {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  color: #495057;
}

.config-copy-button:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
  transform: translateY(-1px);
}

.config-metadata {
  padding-top: 0.5rem;
  border-top: 1px solid #e9ecef;
  font-size: 0.75rem;
  color: #6c757d;
}

.config-metadata p {
  margin: 0.25rem 0;
}

/* Artistic theming to maintain creative facade */
.art-canvas-container {
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.05));
}

.config-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 249, 250, 0.95));
}
</style>