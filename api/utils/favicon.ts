interface FaviconResult {
  faviconBase64: string;
  mimeType: string;
  isDefault?: boolean;
}

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 2;

/**
 * Fetches favicon from a URL and returns base64 encoded data
 * Maintains steganographic disguise by always returning a result
 */
export async function fetchFavicon(url: string): Promise<FaviconResult> {
  try {
    const faviconUrls = generateFaviconUrls(url);

    for (const faviconUrl of faviconUrls) {
      const fetched = await fetchBinaryWithRetry(faviconUrl, DEFAULT_TIMEOUT, DEFAULT_RETRIES);
      if (!fetched) {
        continue;
      }

      const mimeType = detectMimeType(new Uint8Array(fetched.buffer), fetched.contentType);
      if (shouldSkipMime(mimeType)) {
        continue;
      }

      return {
        faviconBase64: arrayBufferToBase64(fetched.buffer),
        mimeType,
        isDefault: false
      };
    }

    return getDefaultFavicon();
  } catch (error) {
    console.error('Error in fetchFavicon:', error);
    return getDefaultFavicon();
  }
}

/**
 * Generate possible favicon URLs for a domain
 */
function generateFaviconUrls(url: string): string[] {
  try {
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

    return [
      `${baseUrl}/favicon.ico`,
      `${baseUrl}/favicon.png`,
      `${baseUrl}/apple-touch-icon.png`,
      `${baseUrl}/apple-touch-icon-180x180.png`,
      `${baseUrl}/apple-touch-icon-152x152.png`,
      `${baseUrl}/android-chrome-192x192.png`,
      `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    ];
  } catch (error) {
    return [`https://www.google.com/s2/favicons?domain=${url}&sz=64`];
  }
}

function getDefaultFavicon(): FaviconResult {
  const defaultFaviconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5wkTBwgJ9q3CgAAAAB9JREFUOMtjYBgFo2AUjIJRMApGwSgYBaNgFAwPAAAFEAABr8G/kgAAAABJRU5ErkJggg==';

  return {
    faviconBase64: defaultFaviconBase64,
    mimeType: 'image/png',
    isDefault: true
  };
}

export function encodeFaviconForArt(faviconData: FaviconResult): string {
  return `data:${faviconData.mimeType};base64,${faviconData.faviconBase64}`;
}

interface FaviconBinaryFetchResult {
  buffer: ArrayBuffer;
  contentType?: string;
}

async function fetchBinaryWithRetry(url: string, timeoutMs: number, retries: number): Promise<FaviconBinaryFetchResult | null> {
  const attempts = Math.max(retries + 1, 1);

  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get('content-type') || undefined;
      if (contentType && shouldSkipMime(contentType)) {
        continue;
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength === 0) {
        continue;
      }

      return { buffer, contentType };
    } catch (error) {
      console.warn(`Failed to fetch favicon from ${url} (attempt ${attempt + 1}/${attempts}):`, error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64');
}

function detectMimeType(data: Uint8Array, headerMime?: string): string {
  if (headerMime) {
    const sanitized = headerMime.split(';')[0].trim();
    if (sanitized && !shouldSkipMime(sanitized)) {
      return sanitized;
    }
  }

  if (data.length >= 4) {
    if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
      return 'image/png';
    }

    if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
      return 'image/jpeg';
    }

    if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x38) {
      return 'image/gif';
    }

    if (data[0] === 0x00 && data[1] === 0x00 && data[2] === 0x01 && data[3] === 0x00) {
      return 'image/x-icon';
    }
  }

  try {
    const sample = new TextDecoder().decode(data.slice(0, 128));
    if (sample.includes('<svg')) {
      return 'image/svg+xml';
    }
  } catch {
    // Ignore decode errors for binary data
  }

  return 'image/x-icon';
}

function shouldSkipMime(mime: string): boolean {
  const normalized = mime.split(';')[0].trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized.startsWith('image/')) {
    return false;
  }

  return normalized.startsWith('text/');
}
