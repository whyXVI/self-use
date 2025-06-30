export async function fetchWithRetry(url: string): Promise<{ success: boolean; response: string | undefined }> {
    for (let i = 0; i < 2; i++) {
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 4000);
            
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error();
            
            return { success: true, response: await response.text() };
        } catch {
            await new Promise(r => setTimeout(r, 50));
        }
    }
    return { success: false, response: undefined };
}

