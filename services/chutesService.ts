
// services/chutesService.ts
import { getActiveChutesKey } from './chutesKeyService';
const API_URL = "https://image.chutes.ai/generate";

/**
 * Generates an image using the Chutes.ai API and returns it as a base64 string.
 * This version correctly handles a direct binary image response from the API.
 * @param prompt The text prompt for the image generation.
 * @param negative_prompt A text prompt describing what to avoid in the image.
 * @returns A promise that resolves with the base64 encoded string of the generated image.
 */
export const generateImageWithChutes = async (prompt: string, negative_prompt: string = "blur, distortion, low quality, watermark, text"): Promise<string> => {
    const API_KEY = await getActiveChutesKey();
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "qwen-image",
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "guidance_scale": 7.5,
            "width": 576, // Using 9:16 aspect ratio for consistency in the app
            "height": 1024,
            "num_inference_steps": 50
        })
    });

    if (!response.ok) {
        // If the server returned an error, it's likely to be JSON.
        try {
            const errorData = await response.json();
            const errorMessage = errorData.error || errorData.detail || `HTTP error! status: ${response.status}`;
            throw new Error(`Chutes API error: ${errorMessage}`);
        } catch (e) {
            // If parsing error JSON fails, just throw the HTTP status.
            throw new Error(`Chutes API HTTP error! status: ${response.status}`);
        }
    }

    // Check the Content-Type header to confirm we received an image.
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.startsWith("image/")) {
        // The response is an image, so we process it as a blob.
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    // reader.result is a data URL (e.g., "data:image/jpeg;base64,..."). We need only the base64 part.
                    resolve((reader.result as string).split(',')[1]);
                } else {
                    reject(new Error("FileReader failed to read the image blob."));
                }
            };
            reader.onerror = (error) => reject(new Error("Error reading blob: " + error));
            reader.readAsDataURL(blob);
        });
    } else {
        // The response was successful (200 OK) but wasn't an image. This is an unexpected state.
        console.error("Unexpected response from Chutes API. Expected an image, but received:", await response.text());
        throw new Error("Unexpected response from the image generation API.");
    }
}
