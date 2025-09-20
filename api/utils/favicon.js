import { fetchFavicon } from './favicon.js';
export const maxDuration = 10;

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return new Response(JSON.stringify({
                error: 'URL parameter is required',
                faviconBase64: '',
                mimeType: 'image/png',
                isDefault: true
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const result = await fetchFavicon(url);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error fetching favicon:", error);

        // Return default favicon on error
        return new Response(JSON.stringify({
            faviconBase64: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5wkTBwgJ9q3CgAAAAB9JREFUOMtjYBgFo2AUjIJRMApGwSgYBaNgFAwPAAAFEAABr8G/kgAAAABJRU5ErkJggg==',
            mimeType: 'image/png',
            isDefault: true
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}