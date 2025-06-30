import { Base64 } from 'js-base64'

export const maxDuration = 5;

export function GET(request: Request) {
    const { searchParams } = new URL(request.url)
  const content = searchParams.get('content')
    if (!content) {
        return new Response('No content provided', { status: 400 });
    }
    const decodedContent = Base64.decode(content);
  return new Response("Res:" + decodedContent, {status: 200, headers: { 'Content-Type': 'text/plain' } });
}