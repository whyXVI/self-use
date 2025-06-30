import { Base64 } from 'js-base64'

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const content = searchParams.get('content')

  if (!content) {
    return new Response(JSON.stringify({ error: 'Missing content parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return Promise.resolve()
    .then(() => Base64.decode(content))
    .then(decoded => {
      return new Response(decoded, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    })
    .catch(error => {
      return new Response(JSON.stringify({ 
        error: 'Decode failed', 
        message: error instanceof Error ? error.message : String(error) 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    })
}