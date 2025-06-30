import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const timestamp = new Date().toISOString()
  const randomNumber = Math.floor(Math.random() * 1000)
  
  const result = {
    message: 'Hello from Vercel Serverless Function!',
    timestamp,
    randomNumber,
    method: req.method,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'host': req.headers.host
    },
    processedAt: `Processed on server at ${timestamp}`
  }
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  res.status(200).json(result)
}