// services/gemini/avatarService.ts
import * as chutesService from "../chutesService";

/**
 * Generates an avatar image using a specified prompt and visual style.
 * This function now dynamically constructs the prompt to match the desired style.
 * @param prompt A detailed description of the desired avatar.
 * @param visualStyle The artistic style for the avatar (e.g., 'Photorealistic', '3D Cartoon').
 * @returns A promise that resolves with the base64 encoded string of the generated avatar image.
 */
export const generateAvatarImage = async (prompt: string, visualStyle: string): Promise<string> => {
  let styleInstruction = '';
  let negativePrompt = "blur, distortion, low quality, watermark, text, signature, logo, ugly, disfigured";

  switch (visualStyle) {
    case 'Photorealistic (Mirip Manusia)':
      styleInstruction = `
**Style:** Ultra-photorealistic portrait photo. The result MUST be indistinguishable from a real human photograph taken with a professional camera. Absolutely NO 3D render, CGI, or cartoonish artifacts.
**Camera & Lighting:** Commercial photography style using a Canon EOS R5 with an 85mm lens at f/1.8, ISO 100. Emphasize natural depth of field, realistic soft lighting, and visible skin pores.
**Quality:** 8K ultra-detailed resolution, sharp focus, cinematic color grading.
`;
      negativePrompt += ", 3d, cgi, render, painting, anime, cartoon, illustration";
      break;
    case '3D Cartoon (Gaya Pixar)':
      styleInstruction = `
**Style:** Charming 3D character in the style of modern Pixar animation.
**Features:** Focus on expressive, oversized eyes, stylized but appealing proportions, and soft, rounded shapes.
**Lighting & Texture:** Use soft, cinematic lighting that highlights the character's form. Textures should be clean and slightly simplified, typical of high-end 3D animation.
**Mood:** Whimsical, friendly, and full of personality.
`;
      negativePrompt += ", photorealistic, human, photo, scary, horror";
      break;
    case '3D Render (Gaya Final Fantasy)':
      styleInstruction = `
**Style:** Highly detailed, realistic 3D character render in the style of modern games like Final Fantasy VII Remake.
**Features:** A perfect blend of realism and stylized beauty. Hair should be intricately detailed strand-by-strand. Skin should look flawless but clearly CGI. Clothing must have complex, high-fidelity textures.
**Lighting & Quality:** Dramatic, cinematic lighting with high contrast. 8K resolution, showcasing immense detail.
`;
      negativePrompt += ", photo, drawing, 2d, anime, cartoon, painting, sketch";
      break;
    case 'Anime Shounen (Gaya Naruto/Bleach)':
      styleInstruction = `
**Style:** Dynamic 2D anime character in a modern Shounen style, reminiscent of series like Naruto, Bleach, or Jujutsu Kaisen.
**Features:** Sharp, expressive line art, cel-shading, and intense, emotive eyes. The character should have a dynamic or iconic pose.
**Mood:** Action-oriented, energetic, and powerful.
`;
      negativePrompt += ", 3d, photorealistic, photo, realistic, soft, painting";
      break;
    default:
       styleInstruction = `
**Style:** High-quality, professional digital art based on the visual style: '${visualStyle}'.
**Quality:** 8K ultra-detailed resolution, sharp focus, and cinematic color grading.
`;
      break;
  }

  const finalPrompt = `
Create a 9:16 portrait aspect ratio image. The character should be in a full-body or three-quarters view, facing forward, and looking directly at the camera.

${styleInstruction}

**Character Description:** ${prompt}

**CRITICAL RULES:**
1.  The final result MUST strictly adhere to the specified **Style**.
2.  The image must be clean: No text, no logos, no watermarks.
`;
  
  return await chutesService.generateImageWithChutes(finalPrompt, negativePrompt);
};