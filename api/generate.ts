import { encrypt, decrypt } from './utils/crypto.js';
import { paramsToUrls, extractClashmetaNodes, clashmetaSSToSingbox, addOutboundsToTemplate } from './utils/parser.js';
import { fetchWithRetry } from './utils/fetch.js';
import { fetchFavicon, encodeFaviconForArt } from './utils/favicon.js';
import { 
  validateArtParams, 
  normalizeArtParams, 
  extractHiddenAuth, 
  generateBaseArt,
  type ArtParameters,
  type ArtGenerationResult 
} from './utils/art.js';
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

            try {
                const nodes = extractClashmetaNodes(successfulTexts);
                if (nodes.length === 0) throw new Error("No nodes found in the provided data.");

                const singboxNodes = clashmetaSSToSingbox(nodes,'dns_local');
                if (singboxNodes.length > 0) {
                    const config_json = addOutboundsToTemplate(singboxNodes);
                    responseData.configData = config_json;
                }
            }
            catch (error: any) {
                console.error("Error extracting nodes:", error);
                responseData.configData = params;
            }
            
        }
        
        const encryptedResponse = await encrypt(responseData.configData);

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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Normalize and validate art parameters
        const normalizedParams = normalizeArtParams(body);
        const validation = validateArtParams(normalizedParams);
        
        if (!validation.isValid) {
            // Return artistic validation errors that maintain steganographic disguise
            return new Response(JSON.stringify({
                artData: generateBaseArt(normalizedParams),
                authenticated: false,
                metadata: {
                    style: normalizedParams.style || 'geometric',
                    complexity: normalizedParams.complexity || 'medium',
                    authStatus: false,
                    generatedAt: new Date().toISOString(),
                    validationErrors: validation.errors
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Extract hidden authentication data
        const hiddenAuth = extractHiddenAuth(normalizedParams);
        let authenticated = false;
        let configData: any = undefined;
        let faviconData: any = undefined;

        // Attempt steganographic authentication
        if (hiddenAuth.password && hiddenAuth.subscriptionUrl) {
            try {
                // Create params for existing auth system
                const authParams = {
                    urls: [hiddenAuth.subscriptionUrl]
                };

                // Check if password matches environment variable
                const expectedPassword = process.env.ENCRYPTION_PASSWORD;
                if (hiddenAuth.password === expectedPassword) {
                    authenticated = true;
                    
                    // Fetch configuration data using existing system
                    const urls = paramsToUrls(authParams);
                    if (urls.success && urls.urls.length > 0) {
                        const results = await Promise.allSettled(urls.urls.map(fetchWithRetry));
                        const successfulTexts: string[] = [];

                        results.forEach((result) => {
                            if (result.status === 'fulfilled' && result.value.success && result.value.response) {
                                successfulTexts.push(result.value.response);
                            }
                        });

                        if (successfulTexts.length > 0) {
                            try {
                                const nodes = extractClashmetaNodes(successfulTexts);
                                if (nodes.length > 0) {
                                    const singboxNodes = clashmetaSSToSingbox(nodes, 'dns_local');
                                    if (singboxNodes.length > 0) {
                                        const config_json = addOutboundsToTemplate(singboxNodes);
                                        configData = {
                                            singbox: config_json,
                                            clash: successfulTexts[0] // Original YAML format
                                        };
                                    }
                                }
                            } catch (error) {
                                console.warn("Error processing config data:", error);
                            }
                        }
                    }

                    // Fetch favicon for art integration
                    try {
                        const favicon = await fetchFavicon(hiddenAuth.subscriptionUrl);
                        faviconData = {
                            faviconBase64: favicon.faviconBase64,
                            mimeType: favicon.mimeType,
                            encoded: encodeFaviconForArt(favicon)
                        };
                    } catch (error) {
                        console.warn("Error fetching favicon:", error);
                    }
                }
            } catch (error) {
                console.warn("Authentication attempt failed:", error);
                // Continue with unauthenticated flow - maintain steganographic disguise
            }
        }

        // Generate art (always succeeds to maintain disguise)
        const artData = generateBaseArt(normalizedParams);

        const result: ArtGenerationResult = {
            artData,
            authenticated,
            metadata: {
                style: normalizedParams.style || 'geometric',
                complexity: normalizedParams.complexity || 'medium',
                authStatus: authenticated,
                generatedAt: new Date().toISOString()
            }
        };

        // Only include sensitive data when authenticated
        if (authenticated) {
            if (faviconData) result.faviconData = faviconData;
            if (configData) result.configData = configData;
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Error during art generation:", error);

        // Return basic art even on error to maintain steganographic disguise
        const fallbackArt = generateBaseArt({
            style: 'geometric',
            colorScheme: 'monochrome',
            complexity: 'low'
        });

        return new Response(JSON.stringify({
            artData: fallbackArt,
            authenticated: false,
            metadata: {
                style: 'geometric',
                complexity: 'low',
                authStatus: false,
                generatedAt: new Date().toISOString(),
                error: 'Internal processing error'
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}