import express from 'express'
import cors from 'cors'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())
app.use('/api/generate', express.text({ type: 'application/json' }))

// Import the API function
async function loadGenerateAPI() {
  try {
    const { POST } = await import('./api/generate.ts')
    return POST
  } catch (error) {
    console.error('Error loading API:', error)
    return null
  }
}

// API endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const POST = await loadGenerateAPI()
    if (!POST) {
      return res.status(500).json({ error: 'API function not available' })
    }

    // Handle both JSON objects and encrypted strings
    let bodyData
    if (typeof req.body === 'string') {
      // If it's a string, check if it's JSON or encrypted data
      try {
        bodyData = JSON.parse(req.body)
      } catch {
        // It's an encrypted string, pass it as-is
        bodyData = req.body
      }
    } else {
      // It's already a parsed JSON object
      bodyData = req.body
    }

    // Create a mock Request object
    const request = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    })

    const response = await POST(request)
    const data = await response.json()

    res.status(response.status).json(data)
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Development API server running on http://localhost:${PORT}`)
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/generate`)
})