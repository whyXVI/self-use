export async function fetchWithRetry(url: string): Promise<{ success: boolean; response: string | undefined }> {
    for (let i = 0; i < 3; i++) {
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error();
            
            return { success: true, response: await response.text() };
        } catch {
            if (i === 2) return { success: false, response: undefined };
            await new Promise(r => setTimeout(r, 500));
        }
    }
    return { success: false, response: undefined };
}

