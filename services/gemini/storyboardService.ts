


import { Type, Modality } from "@google/genai";
// FIX: Import VeoPromptData to use it as the return type for generateVeoPrompts.
import { Product, Scene, VeoPromptData } from "../../types";
import { getAiClient } from "./aiService";

export const generateStoryboard = async (product: Product, sceneCount: number, language: string, promotionStyle: string, hookStyle: string): Promise<{ description: string; script: string; }[]> => {
  const ai = await getAiClient();
  const prompt = `You are an expert viral video scriptwriter for the Indonesian market, specializing in TikTok & Shopee Video. Your task is to create a high-converting, engaging storyboard for a short video ad for the product: "${product.name}".
Product Description: "${product.description}".

**CRITICAL INSTRUCTIONS:**

1.  **Ad Style:** The required promotion style is: "**${promotionStyle}**". You MUST strictly adhere to the characteristics described in this style. For example, if it says "Soft Selling" with a description of telling a story, you must craft a narrative. If it says "Hard Selling" with scarcity, you must be direct and create urgency. If it mentions "Drama", create a mini-story with high emotional stakes. If it mentions "Humor", make it funny. If it says "News Presenter", be formal and professional.

2.  **Hook/Opening:** The hook for the very first scene is critical. The instruction for the hook is: "**${hookStyle}**".
    *   If the instruction is a specific phrase (e.g., "kenapa ya", "kalian tahu gak", "sumpah, nyesel baru tahu"), you MUST start the script for the very first scene with that exact phrase.
    *   If the instruction is "sesuaikan gaya promosi", you must create a powerful, original hook that perfectly matches the chosen **Ad Style**. For example, a "Drama" style might start with a mysterious question, while "Humor" might start with a funny observation.
    *   If the instruction is a custom user-provided hook, you MUST start the script with that exact text.

3.  **Script Length:** Each scene's "script" (for voiceover/dialogue) must be extremely concise, strictly between **18 and 20 syllables (suku kata)**. This is perfect for a short video clip per scene.

4.  **Language:** The entire "script" must be in **${language}**.

5.  **CTA (Call to Action):** DO NOT add the final Call to Action (like 'Cek keranjang kuning'). The application will add it automatically. Your script should naturally lead up to a CTA.

6.  **Structure:** Create a storyboard with exactly ${sceneCount} scenes.

Respond ONLY with a valid JSON array of objects. Each object must have two keys: "description" (a vivid visual description for the scene) and "script" (the voiceover script following all rules above). Do not include any other text or explanations.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            script: { type: Type.STRING },
          },
        },
      },
    },
  });

  const jsonString = response.text.trim();
  return JSON.parse(jsonString);
};

export const composeSceneImage = async (avatarBase64: string, productBase64: string, sceneDescription: string, locationBase64?: string): Promise<string> => {
  const ai = await getAiClient();
  const parts: any[] = [
    { inlineData: { data: avatarBase64, mimeType: 'image/jpeg' } },
    { inlineData: { data: productBase64, mimeType: 'image/jpeg' } },
  ];
  
  let locationInstruction = "";
  if (locationBase64) {
    parts.push({ inlineData: { data: locationBase64, mimeType: 'image/jpeg' } });
    locationInstruction = "Use the third provided image as the background for the scene. The final image must seamlessly integrate the avatar and product into this background.";
  }

  const prompt = `
Create a 9:16 portrait aspect ratio, ultra-photorealistic advertising image that looks exactly like a real human photograph, not CGI or 3D render. The scene description is: "${sceneDescription}"

${locationInstruction}

CRITICAL RULES:
1. **ASPECT RATIO:** The final output image MUST be a 9:16 portrait. This is the most important and non-negotiable rule.
2. **AVATAR LIKENESS:** Replicate the exact same person from the reference avatar image (first image) with 100% likeness — identical face, body, clothing, hair, and expression. Identity consistency must be flawless.
3. **PRODUCT INTEGRATION:** Naturally integrate the provided product (second image) into the scene with realistic scale, lighting, and shadows. The product must look physically present, not digitally pasted.
4. **PHOTOREALISM:** The final result must look like a professional lifestyle photo taken with a real camera, indistinguishable from reality.
5. **CAMERA STYLE:** Use commercial photography style: Canon EOS R5, 85mm lens, f/1.8, ISO 100, natural depth of field, realistic lighting with soft shadows, visible skin pores, lifelike reflections in the eyes.
6. **QUALITY:** Resolution must be ultra-detailed, 8K, with clean and sharp focus, and cinematic color grading.
7. **NO EXTRAS:** The image MUST be clean. No text, no subtitles, no logos, no watermarks, no graphic overlays, no cartoon or animation elements.
`;
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: parts.reverse() }, // Text prompt last
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error("No image was generated for the scene.");
};


// FIX: Modified the function to return an array of structured VeoPromptData objects instead of strings, aligning it with the application's type definitions and resolving downstream type errors.
export const generateVeoPrompts = async (storyboard: Scene[], language: string, voiceOverStyle: 'narasi' | 'lypsing', avatarGender: 'Pria' | 'Wanita'): Promise<VeoPromptData[]> => {
    const ai = await getAiClient();
    const voiceName = avatarGender === 'Pria' ? 'Charon' : 'Kore';

    const prompt = `You are a world-class VEO-3 prompt engineer. Your task is to create a JSON array of powerful and detailed VEO-3 video prompt objects, one for each scene in the provided storyboard.

**CRITICAL INSTRUCTIONS:**
1.  **JSON Array Output:** Your entire response MUST be a single, valid JSON array. Each object in the array represents a scene and must match the provided schema.
2.  **Style Adherence:** The user has specified a voice over style of **'${voiceOverStyle}'**. You MUST generate the prompts strictly following the logic of the corresponding style.
    *   **Narasi (Narration):** The character does not speak. \`dialogueInstruction\` should be for a narrator. \`mainPrompt\` should describe character actions without speaking.
    *   **Lypsing (Lip-sync):** The character speaks to the camera. \`dialogueInstruction\` must mention lip-syncing. \`mainPrompt\` should describe the character speaking.
3.  **JSON Schema Breakdown for each object:**
    *   \`dialogueInstruction\` (string): A clear instruction for the audio. It must specify the language ('${language}'), the voice name ('${voiceName}'), and the delivery style based on the **'${voiceOverStyle}'**. It must include the scene's script verbatim.
    *   \`mainPrompt\` (string): The core animation instruction. It must describe an 8-second video clip composed of 2-3 dynamic, smoothly-cut sub-scenes based on the scene's 'description'. Describe character actions, subtle movements, environment animations, and cinematic camera work.
    *   \`negativePrompt\` (string): A comprehensive list of negative keywords to avoid common AI video artifacts.
4.  **Language:** The descriptive parts (\`mainPrompt\`, \`negativePrompt\`) MUST be in **English**. The voiceover script inside \`dialogueInstruction\` MUST be in **${language}**.
5.  **Quality:** The prompts should aim for a hyperrealistic, 8K, cinematic video.

**Storyboard Data:**
- Target Language: ${language}
- Voice Name: ${voiceName}
- Avatar Gender: ${avatarGender}
- Voice Over Style: ${voiceOverStyle}
- Storyboard Scenes:
${storyboard.map((s, i) => `  Scene ${i + 1}:\n    Description: ${s.description}\n    Script: "${s.script.replace(/"/g, '\\"')}"`).join('\n\n')}

Respond ONLY with a valid JSON array of objects. Do not add any other text or explanations.`;
    
    const veoPromptSchema = {
        type: Type.OBJECT,
        properties: {
            dialogueInstruction: { type: Type.STRING },
            mainPrompt: { type: Type.STRING },
            negativePrompt: { type: Type.STRING },
        },
        required: ['dialogueInstruction', 'mainPrompt', 'negativePrompt'],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: veoPromptSchema
            },
        },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString);
};