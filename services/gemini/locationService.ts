import { getAiClient } from "./aiService";

export const generateLocationImage = async (prompt: string): Promise<string> => {
  const ai = await getAiClient();
  const finalPrompt = `
Create an ultra-photorealistic background image suitable for a product advertisement. The image must look like a real photograph, not CGI or a 3D render.

**Scene Description:** ${prompt}

**CRITICAL RULES:**
1.  **Aspect Ratio:** The final image MUST be a 9:16 portrait aspect ratio.
2.  **Photorealism:** The result must be indistinguishable from a high-resolution photograph taken with a professional camera (e.g., Canon EOS R5, 50mm lens, f/2.8). Focus on realistic lighting, textures, and depth of field.
3.  **Composition:** The scene should be visually appealing and composed with a clear area that could serve as a focal point for a product. Avoid overly cluttered or distracting elements. Unless specified, the scene should not contain prominent people.
4.  **Quality:** The image must be ultra-detailed, 8K, with clean and sharp focus and cinematic color grading.
5.  **Clean Image:** No text, no logos, no watermarks, no frames.
`;

  const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '9:16',
      },
    });

  return response.generatedImages[0].image.imageBytes;
};