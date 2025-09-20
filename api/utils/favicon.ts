import { fetchWithRetry } from './fetch.js';

interface FaviconResult {
  faviconBase64: string;
  mimeType: string;
  isDefault?: boolean;
}

/**
 * Fetches favicon from a URL and returns base64 encoded data
 * Maintains steganographic disguise by always returning a result
 */
export async function fetchFavicon(url: string): Promise<FaviconResult> {
  try {
    // Try multiple favicon URLs in order of preference
    const faviconUrls = generateFaviconUrls(url);
    
    for (const faviconUrl of faviconUrls) {
      try {
        const result = await fetchWithRetry(faviconUrl, {
          timeout: 5000,
          retries: 2
        });
        
        if (result.success && result.response) {
          // Convert response to base64
          const base64Data = await responseToBase64(result.response);
          if (base64Data) {
            return {
              faviconBase64: base64Data,
              mimeType: detectMimeType(result.response),
              isDefault: false
            };
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch favicon from ${faviconUrl}:`, error);
        continue;
      }
    }
    
    // Return default favicon if all attempts fail
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
      // Fallback to Google's favicon service
      `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    ];
  } catch (error) {
    return [`https://www.google.com/s2/favicons?domain=${url}&sz=64`];
  }
}

/**
 * Convert response to base64 string
 */
async function responseToBase64(response: string): Promise<string | null> {
  try {
    // If response is already base64 or needs conversion
    if (typeof response === 'string') {
      // Check if it's already base64
      if (isValidBase64(response)) {
        return response;
      }
      // Convert string to base64
      return Buffer.from(response, 'binary').toString('base64');
    }
    return null;
  } catch (error) {
    console.error('Error converting to base64:', error);
    return null;
  }
}

/**
 * Detect MIME type from response
 */
function detectMimeType(response: string): string {
  // Simple MIME type detection based on content
  if (response.startsWith('\x89PNG')) {
    return 'image/png';
  } else if (response.startsWith('\xFF\xD8\xFF')) {
    return 'image/jpeg';
  } else if (response.startsWith('GIF87a') || response.startsWith('GIF89a')) {
    return 'image/gif';
  } else if (response.includes('<?xml') || response.includes('<svg')) {
    return 'image/svg+xml';
  }
  return 'image/x-icon'; // Default for .ico files
}

/**
 * Check if string is valid base64
 */
function isValidBase64(str: string): boolean {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
}

/**
 * Returns a default favicon for steganographic purposes
 * Always provides a valid result to maintain disguise
 */
function getDefaultFavicon(): FaviconResult {
  // Simple 16x16 transparent PNG as base64
  const defaultFaviconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5wkTBwgJ9q3CgAAAAB9JREFUOMtjYBgFo2AUjIJRMApGwSgYBaNgFAwPAAAFEAABr8G/kgAAAABJRU5ErkJggg==';
  
  return {
    faviconBase64: defaultFaviconBase64,
    mimeType: 'image/png',
    isDefault: true
  };
}

/**
 * Encode favicon to base64 for art integration
 */
export function encodeFaviconForArt(faviconData: FaviconResult): string {
  return `data:${faviconData.mimeType};base64,${faviconData.faviconBase64}`;
}