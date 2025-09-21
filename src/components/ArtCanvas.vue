<template>
  <div class="art-canvas-container">
    <div class="canvas-section">
      <canvas 
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        class="art-canvas"
        @click="onCanvasClick"
      />
      
      <div v-if="isGenerating" class="loading-overlay">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-progress">
            <div class="progress-bar"></div>
          </div>
          <p class="loading-text">{{ loadingMessage }}</p>
        </div>
      </div>

      <div class="canvas-toolbar">
        <button 
          @click="downloadArt" 
          :disabled="!hasArt"
          class="toolbar-button download-button"
          title="Download rendering"
        >
          Download
        </button>
        
        <button 
          v-if="showConfigButton"
          @click="toggleConfigPanel" 
          class="toolbar-button config-button"
          title="Configuration panel"
        >
          Configs
        </button>
        
        <div class="canvas-info">
          {{ canvasWidth }} x {{ canvasHeight }}
        </div>
      </div>
    </div>

    <div v-if="faviconData" class="favicon-integration">
      <FaviconDisplay 
        :faviconData="faviconData"
        :showOverlay="true"
        :showInfo="false"
        @faviconClick="handleFaviconClick"
      />
    </div>

    <div v-if="showConfigPanel && configData" class="config-panel">
      <div class="config-header">
        <h3>Configuration</h3>
        <button @click="toggleConfigPanel" class="close-button">Close</button>
      </div>
      
      <div class="config-content">
        <div class="config-section">
          <label>Available exports</label>
          <div class="config-actions">
            <button 
              @click="copyConfig('singbox')"
              class="config-copy-button"
              title="Copy singbox configuration"
            >
              Copy singbox
            </button>
            <button 
              @click="copyConfig('clash')"
              class="config-copy-button"
              title="Copy clash configuration"
            >
              Copy clash
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
  backgroundColor: '#151921'
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
const loadingMessage = ref('Preparing rendering...')

// Loading messages for enhanced user experience
const loadingMessages = [
  'Preparing rendering...',
  'Mapping palette...',
  'Processing layers...',
  'Optimizing canvas...',
  'Finalizing output...'
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
  return props.artData.authenticated ? 'Enhanced' : 'Standard'
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

const handleFaviconClick = () => {
  if (!faviconData.value || faviconData.value.isDefault) {
    return
  }

  void copyConfig('singbox')
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
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.canvas-section {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.art-canvas {
  display: block;
  border-radius: 6px;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  cursor: crosshair;
}

.loading-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  bottom: 72px;
  border-radius: 6px;
  background: rgba(12, 15, 20, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-top-color: var(--color-accent);
  animation: spin 1s linear infinite;
}

.loading-progress {
  width: 160px;
  height: 3px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-accent);
  border-radius: 999px;
  animation: progress 1.6s ease-in-out infinite;
}

.loading-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes progress {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(-15%);
  }
  100% {
    transform: translateX(20%);
  }
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-button {
  padding: 0.45rem 1rem;
  border-radius: 4px;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: 0.85rem;
}

.toolbar-button:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.canvas-info {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.favicon-integration {
  position: absolute;
  top: 24px;
  right: 24px;
}

.config-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 320px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 20px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.close-button {
  font-size: 0.8rem;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.close-button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-section label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.config-actions {
  display: flex;
  gap: 8px;
}

.config-copy-button {
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.config-copy-button:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.config-metadata {
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (max-width: 1024px) {
  .art-canvas-container {
    flex-direction: column;
    align-items: stretch;
  }

  .favicon-integration {
    position: static;
    align-self: flex-end;
  }
}

@media (max-width: 768px) {
  .canvas-section {
    padding: 12px;
  }

  .loading-overlay {
    left: 12px;
    right: 12px;
    bottom: 64px;
  }
}
</style>
