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
        {{ isDefault ? 'Default texture' : 'Fetched texture ready' }}
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
  altText: 'Texture preview'
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
    return 'Secured source'
  } catch {
    return 'Generated texture'
  }
}

const onImageLoad = (event: Event) => {
  imageLoaded.value = true
  const img = event.target as HTMLImageElement
  imageSize.value = `${img.naturalWidth} x ${img.naturalHeight}`
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
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
}

.favicon-container {
  position: relative;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  padding: 6px;
  transition: border-color 0.2s ease;
}

.favicon-display:hover .favicon-container {
  border-color: var(--color-accent);
}

.favicon-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
  display: block;
  border-radius: 4px;
}

.favicon-overlay {
  position: absolute;
  inset: 6px;
  border-radius: 4px;
  background: rgba(10, 14, 18, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.favicon-display:hover .favicon-overlay {
  opacity: 1;
}

.favicon-metadata {
  text-align: center;
  color: var(--color-text-primary);
  font-size: 0.75rem;
  line-height: 1.4;
}

.favicon-info {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.favicon-source {
  margin: 0;
}

.favicon-status {
  margin: 0;
  font-weight: 500;
}

.favicon-status--default {
  color: var(--color-text-muted);
}

.favicon-status--custom {
  color: var(--color-accent);
}
</style>
