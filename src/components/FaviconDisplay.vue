<template>
  <div class="favicon-display" v-if="faviconData" @click="onFaviconClick">
    <div class="favicon-container">
      <img 
        :src="faviconData.encoded" 
        :alt="altText"
        class="favicon-image"
        @error="onImageError"
        @load="onImageLoad"
      />
      <div class="favicon-overlay" v-if="showOverlay">
        <div class="favicon-metadata">
          <span class="favicon-type">{{ faviconData.mimeType }}</span>
          <span class="favicon-size">{{ imageSize }}</span>
        </div>
      </div>
    </div>
    <div class="favicon-info" v-if="showInfo">
      <p class="favicon-source">Texture source: {{ getSourceDomain() }}</p>
      <p class="favicon-status" :class="statusClass">
        {{ isDefault ? 'Default artistic texture' : 'Custom texture loaded' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { FaviconData } from '../types/art'

interface Props {
  faviconData?: FaviconData
  showOverlay?: boolean
  showInfo?: boolean
  altText?: string
}

const props = withDefaults(defineProps<Props>(), {
  showOverlay: false,
  showInfo: true,
  altText: 'Artistic texture element'
})

const emit = defineEmits<{
  faviconClick: []
}>()

const imageSize = ref<string>('Unknown')
const imageLoaded = ref(false)

const isDefault = computed(() => props.faviconData?.isDefault || false)

const statusClass = computed(() => ({
  'favicon-status--default': isDefault.value,
  'favicon-status--custom': !isDefault.value
}))

const getSourceDomain = (): string => {
  // Extract domain for artistic display purposes only
  if (!props.faviconData?.encoded) return 'Unknown'
  
  try {
    // This is just for display - maintain steganographic disguise
    return 'Artistic resource'
  } catch {
    return 'Generated texture'
  }
}

const onImageLoad = (event: Event) => {
  imageLoaded.value = true
  const img = event.target as HTMLImageElement
  imageSize.value = `${img.naturalWidth}×${img.naturalHeight}`
}

const onImageError = () => {
  console.warn('Favicon image failed to load')
  imageLoaded.value = false
}

const onFaviconClick = () => {
  if (imageLoaded.value) {
    emit('faviconClick')
  }
}

onMounted(() => {
  // Component mounted - favicon display ready
})
</script>

<style scoped>
.favicon-display {
  position: relative;
  display: inline-block;
  margin: 0.5rem;
  cursor: pointer;
}

.favicon-container {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: #f8f9fa;
}

.favicon-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
  display: block;
  border-radius: 4px;
}

.favicon-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.favicon-container:hover .favicon-overlay {
  opacity: 1;
}

.favicon-metadata {
  text-align: center;
  color: white;
  font-size: 0.75rem;
}

.favicon-type {
  display: block;
  font-weight: 500;
}

.favicon-size {
  display: block;
  opacity: 0.8;
  margin-top: 0.25rem;
}

.favicon-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.favicon-source {
  margin: 0 0 0.25rem 0;
  font-style: italic;
}

.favicon-status {
  margin: 0;
  font-weight: 500;
}

.favicon-status--default {
  color: #6c757d;
}

.favicon-status--custom {
  color: #28a745;
}

/* Artistic styling to maintain creative facade */
.favicon-display {
  filter: sepia(10%) saturate(110%) hue-rotate(5deg);
}

.favicon-container::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  border-radius: 10px;
  z-index: -1;
}
</style>
