import { encrypt, decrypt } from './utils/crypto.js';
import { paramsToUrls, extractClashmetaNodes, clashmetaSSToSingbox, addOutboundsToTemplate } from './utils/parser.js';
import { fetchWithRetry } from './utils/fetch.js';
export const maxDuration = 10;


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
        if (typeof params !== 'object' || params === null) {
            return new Response(params, {
                status: 200,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
        }
        
        const responseData: any = {
            receivedParams: params,
            processedAt: new Date().toISOString()
        };
        
        // Fetch specific params
        const urls = paramsToUrls(params);
        if (urls.success) {
            const results = await Promise.allSettled(urls.urls.map(fetchWithRetry));
            const successfulTexts: string[] = [];

            results.forEach((result) => {
                if (result.status === 'fulfilled' && result.value.success && result.value.response) {
                    
                    successfulTexts.push(result.value.response);
                    
                } else {
                    console.warn("Fetch failed:", result);
                }
            });
            responseData.successfulFetches = successfulTexts.length;

            const nodes = extractClashmetaNodes(successfulTexts);
            const singboxNodes = clashmetaSSToSingbox(nodes,'dns_local');

            if (singboxNodes.length > 0) {
                const config_json = addOutboundsToTemplate(singboxNodes);
                responseData.configData = config_json;
            }
            
        }
        
        
        // fill template

        

        
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