import { encrypt, decrypt } from './utils/crypto';

export const maxDuration = 5;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const encryptedSeed = searchParams.get('seed');

        if (!encryptedSeed) {
            return new Response('Query parameter "seed" is required.', {
                status: 400,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
        }

        const params = await decrypt(encryptedSeed);
        
        const responseData: any = {
            receivedParams: params,
            processedAt: new Date().toISOString(),
        };
        
        if (params && typeof params === 'object' && typeof params.url === 'string') {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                
                const fetchResponse = await fetch(params.url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; ContentFetcher/1.0)',
                    }
                });
                
                clearTimeout(timeoutId);
                
                const contentType = fetchResponse.headers.get('content-type');
                
                if (contentType && contentType.includes('text/plain')) {
                    const textContent = await fetchResponse.text();
                    responseData.fetchedContent = {
                        url: params.url,
                        contentType: contentType,
                        content: textContent,
                        fetchedAt: new Date().toISOString(),
                        status: fetchResponse.status,
                        statusText: fetchResponse.statusText
                    };
                } else {
                    responseData.fetchedContent = {
                        url: params.url,
                        contentType: contentType || 'unknown',
                        error: 'Content-Type is not text/plain',
                        status: fetchResponse.status,
                        statusText: fetchResponse.statusText
                    };
                }
            } catch (fetchError: any) {
                responseData.fetchedContent = {
                    url: params.url,
                    error: fetchError.name === 'AbortError' 
                        ? 'Fetch timeout' 
                        : fetchError.message,
                    errorType: fetchError.name
                };
            }
        }
        
        const encryptedResponse = await encrypt(responseData);

        return new Response(encryptedResponse, {
            status: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error: any) {
        console.error("Error during content generation:", error);

        return new Response(`An internal server error occurred: ${error.message}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }
}