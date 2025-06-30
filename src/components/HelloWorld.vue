<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
const fetchResponse = ref<string>('')
const isLoading = ref<boolean>(false)

interface ServerResponse {
  message: string
  timestamp: string
  randomNumber: number
  method: string
  query: Record<string, string | string[]>
  headers: {
    'user-agent'?: string
    host?: string
  }
  processedAt: string
}

const fetchResource = async (): Promise<void> => {
  isLoading.value = true
  fetchResponse.value = ''
  
  try {
    const response = await fetch('/api/process?test=true')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data: ServerResponse = await response.json()
    fetchResponse.value = JSON.stringify(data, null, 2)
  } catch (error) {
    fetchResponse.value = `Error: ${error instanceof Error ? error.message : String(error)}`
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <div class="card">
    <button type="button" @click="fetchResource" :disabled="isLoading">
      {{ isLoading ? 'Loading...' : 'Test Vercel Function' }}
    </button>
    <pre v-if="fetchResponse" style="text-align: left; margin-top: 1rem; padding: 1rem; background: #1a1a1a; border-radius: 8px; overflow-x: auto;">{{ fetchResponse }}</pre>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
