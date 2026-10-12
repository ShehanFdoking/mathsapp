// Sinhala font fetcher for PDF generation
// Fetches Noto Sans Sinhala from Google Fonts at runtime

export async function fetchSinhalaFont(): Promise<Uint8Array> {
    // Using a direct CDN link to Noto Sans Sinhala Regular
    // Alternative reliable URL from GitHub if Google Fonts fails
    const fontUrl = "https://github.com/google/fonts/raw/main/ofl/notosanssinhala/NotoSansSinhala-Regular.ttf";

    try {
        const response = await fetch(fontUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch Sinhala font: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error("Error fetching Sinhala font:", error);
        throw new Error("Failed to load Sinhala font");
    }
}

// Cache for the font to avoid repeated downloads
let fontCache: Uint8Array | null = null;

export async function getSinhalaFont(): Promise<Uint8Array> {
    if (!fontCache) {
        fontCache = await fetchSinhalaFont();
    }
    return fontCache;
}
