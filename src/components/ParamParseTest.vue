<template>
  <div class="param-parse-test">
    <div class="container">
      <div class="left-panel">
        <textarea 
          v-model="inputText" 
          placeholder="{}"
          class="input-textarea"
        ></textarea>
        <button @click="sendRequest" class="send-button">
          发送
        </button>
      </div>
      
      <div class="right-panel">
        <div class="response-area">
          <pre v-if="response">{{ response }}</pre>
          <p v-else class="placeholder">等待响应...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Base64 } from 'js-base64'

const inputText = ref('')
const response = ref('')

const sendRequest = async () => {
  if (!inputText.value.trim()) {
    response.value = '请输入内容'
    return
  }

  try {
    const encoded = Base64.encodeURI(inputText.value)
    const res = await fetch(`/api/generate?content=${encoded}`)
    
    response.value = await res.text()
  } catch (error) {
    response.value = `请求失败: ${error instanceof Error ? error.message : String(error)}`
  }
}
</script>

<style scoped>
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

.left-panel,
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.input-textarea {
  flex: 1;
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  font-family: monospace;
  font-size: 14px;
}

.send-button {
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.send-button:hover {
  background-color: #0056b3;
}

.response-area {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  overflow: auto;
  background-color: #f8f9fa;
}

.response-area pre {
  margin: 0;
  font-family: monospace;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.placeholder {
  color: #6c757d;
  font-style: italic;
}
</style>