// services/gemini/contentCreatorService.ts
import { Type, Modality } from "@google/genai";
import { getAiClient } from "./aiService";
import { VeoPromptData } from "../../types";

interface StoryboardSceneData {
    description: string;
    script: string;
    characters_in_scene: string[];
}

interface CharacterData {
    name: string;
    description: string;
}

interface StoryGenerationResponse {
    storyboard: StoryboardSceneData[];
    characters: CharacterData[];
}

export const generateFullStoryPlan = async (
    storyIdea: string, 
    visualStyle: string, 
    language: string, 
    sceneCount: number,
    genre: string,
    location?: { name: string }
): Promise<StoryGenerationResponse> => {
  const ai = await getAiClient();
  
  const prompt = `You are a creative director and screenwriter for viral short-form videos (TikTok, Reels) for the Indonesian market. Your goal is to create a pure, engaging, story-driven narrative. This is for creative content, NOT for advertising or selling anything. There should be absolutely no mention of products, sales, or calls to action.

**User's Request:**
*   **Story Idea:** "${storyIdea}"
*   **Genre:** ${genre}
*   **Visual Style:** ${visualStyle}
*   **Language:** ${language}
*   **Number of Scenes:** ${sceneCount}
${location ? `*   **Setting / Location:** The story MUST take place at this location: "${location.name}"` : ''}

**Story Structure & Narrative Elements:**
You must structure the story across the ${sceneCount} scenes following this classic narrative arc. Distribute these phases logically.
1.  **Hook / Pembuka:** The first scene MUST grab attention immediately with a strong hook (a powerful sentence, a surprising situation, or an intriguing question).
2.  **Pengenalan Tokoh & Dunia:** Introduce the main characters and their initial situation.
3.  **Pemicu Konflik:** An event that changes everything for the characters.
4.  **Konflik & Perjuangan:** The characters' struggle, showing their ups and downs.
5.  **Klimaks:** The peak of the story's emotion or action.
6.  **Resolusi / Akhir:** The conclusion of the struggle. The final scene should have a reflective sentence that leaves an impression.

To make the story more memorable, incorporate these elements:
*   **Narator:** The script should be from the perspective of a narrator telling the story.
*   **Konflik Batin:** Show the characters' internal struggles.
*   **Simbolisme:** Use simple symbols to represent deeper meanings.
*   **Twist Kecil:** Consider adding a small, unexpected twist if it fits the genre.

**CRITICAL INSTRUCTIONS:**
1.  **Pure Storytelling:** Craft a compelling mini-story based on the user's idea, strictly following the specified **Genre** and the **Story Structure**. The narrative must be a self-contained, engaging story. Do NOT include any product placements, calls to action, or selling elements.
2.  **Characters:** Identify all characters. For each, create a unique name and a detailed, photorealistic 'description' for an AI image generator.
3.  **Storyboard:** Create a storyboard with exactly ${sceneCount} scenes. For each scene:
    *   'description': A vivid visual description. Describe the setting, character actions, camera angle, and mood.
    *   'script': A short voiceover script (22-30 syllables / suku kata)). **Crucially, the script must be in a narrative, storytelling style, as if one person is telling the story to the audience. The tone MUST be casual and engaging ('gaya narasi/bercerita, santai dan menarik').**
    *   'characters_in_scene': A list of character names in the scene.
4.  **Output Format:** Respond ONLY with a valid JSON object matching the provided schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
              }
            }
          },
          storyboard: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                script: { type: Type.STRING },
                characters_in_scene: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
          },
        },
      },
    },
  });

  const jsonString = response.text.trim();
  return JSON.parse(jsonString);
};

export const generateHybridStoryPlan = async (
    storyIdea: string,
    visualStyle: string,
    language: string,
    sceneCount: number,
    genre: string,
    existingCharacters: { name: string; imageBase64: string }[],
    location?: { name: string }
): Promise<StoryGenerationResponse> => {
    const ai = await getAiClient();
    const parts: any[] = [];
    
    const characterInstructions = existingCharacters.map((char) => {
        parts.push({ inlineData: { data: char.imageBase64, mimeType: 'image/jpeg' } });
        return `- Pre-existing Character: "${char.name}". Their appearance is defined by the provided image.`;
    }).join('\n');

    const prompt = `You are a creative storyteller for the Indonesian market. Your task is to take a user's story idea and a list of PRE-EXISTING characters and create a pure story. This is for creative content, NOT for advertising or selling anything. The narrative must not contain any product placements, calls to action, or selling elements.

**Pre-existing Characters:**
${characterInstructions}

**User's Request:**
*   **Story Idea:** "${storyIdea}"
*   **Genre:** ${genre}
*   **Visual Style:** ${visualStyle}
*   **Language:** ${language}
*   **Number of Scenes:** ${sceneCount}
${location ? `*   **Setting / Location:** The story MUST take place here: "${location.name}"` : ''}

**Story Structure & Narrative Elements:**
You must structure the story across the ${sceneCount} scenes following this classic narrative arc. Distribute these phases logically.
1.  **Hook / Pembuka:** The first scene MUST grab attention immediately.
2.  **Pengenalan Tokoh & Dunia:** Re-introduce the pre-existing characters in their current situation.
3.  **Pemicu Konflik:** An event that changes everything.
4.  **Konflik & Perjuangan:** The characters' struggle.
5.  **Klimaks:** The peak of the story's emotion or action.
6.  **Resolusi / Akhir:** The conclusion, ending with a reflective sentence.

To make the story memorable, incorporate:
*   **Narator:** The script should be from a narrator's perspective.
*   **Konflik Batin:** Show the characters' internal struggles.
*   **Simbolisme & Twist Kecil:** Use symbols or small twists where appropriate.

**CRITICAL INSTRUCTIONS:**
1.  **Story & Script:** Create an engaging mini-story that fits the specified **Genre** and **Story Structure**. The 'script' for each scene must be in a narrative, storytelling style, as if one person is telling the story to the audience. The tone MUST be casual and engaging ('gaya narasi/bercerita, santai dan menarik'), and the length must be strictly between 20-25 words (kata).
2.  **Analyze and Augment:** Use the pre-existing characters. Determine if the story REQUIRES *additional* characters to fit the narrative.
3.  **Generate NEW Characters Only:** If new characters are needed, create definitions for THEM ONLY (name and detailed description). If not, the 'characters' list in the JSON must be an empty array [].
4.  **Create Storyboard:** Create a storyboard with exactly ${sceneCount} scenes, including 'description', 'script', and 'characters_in_scene'.
5.  **Output Format:** Respond ONLY with a valid JSON object matching the provided schema. The 'characters' array should ONLY contain NEW characters.`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    characters: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
                            required: ['name', 'description'],
                        },
                    },
                    storyboard: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING },
                                script: { type: Type.STRING },
                                characters_in_scene: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                            required: ['description', 'script', 'characters_in_scene'],
                        },
                    },
                },
                required: ['characters', 'storyboard'],
            },
        },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString);
};


export const generateStoryboardWithCharacterImages = async (
    storyIdea: string,
    visualStyle: string,
    language: string,
    sceneCount: number,
    characters: { name: string; imageBase64: string }[]
): Promise<StoryboardSceneData[]> => {
    const ai = await getAiClient();
    const parts: any[] = [];
    
    const characterInstructions = characters.map((char) => {
        parts.push({ inlineData: { data: char.imageBase64, mimeType: 'image/jpeg' } });
        return `- Character "${char.name}": The person shown in the image provided before the main prompt. Their visual identity MUST be preserved.`;
    }).join('\n');

    const prompt = `You are a creative director for viral short-form video content for the Indonesian market. Your task is to take a user's story idea and a set of predefined characters and generate a creative storyboard.

**Provided Characters:**
${characterInstructions}
(The character images are provided as inline data before this text prompt.)

**User's Request:**
*   **Story Idea:** "${storyIdea}"
*   **Visual Style:** ${visualStyle}
*   **Language:** ${language}
*   **Number of Scenes:** ${sceneCount}

**CRITICAL INSTRUCTIONS:**
1.  **Use Provided Characters:** You MUST create a story that features the characters provided. Do NOT invent new characters.
2.  **Storyboard:** Create a storyboard with exactly ${sceneCount} scenes. For each scene, provide:
    *   'description': A vivid visual description for an AI image generator. Describe the setting, character actions (referencing them by name), camera angle, and overall mood, incorporating the requested **Visual Style**.
    *   'script': A short voiceover script (22-30 syllables / suku kata) in the requested **Language**. It must be in a narrative, storytelling style ('gaya narasi/bercerita').
    *   'characters_in_scene': A list of the names of the characters from the "Provided Characters" list who appear in this scene.
3.  **Output Format:** Respond ONLY with a valid JSON array of objects (the storyboard). Do not include the character definitions in your response.`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        script: { type: Type.STRING },
                        characters_in_scene: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['description', 'script', 'characters_in_scene'],
                },
            },
        },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString);
};


export const composeMultiCharacterSceneImage = async (
    characterImages: { name: string; imageBase64: string }[], 
    sceneDescription: string, 
    visualStyle: string,
    locationBase64?: string
): Promise<string> => {
  const ai = await getAiClient();
  const parts: any[] = [];
  
  let assetInstructions = characterImages.map((char, index) => {
    parts.push({ inlineData: { data: char.imageBase64, mimeType: 'image/jpeg' } });
    return `- Character "${char.name}": Use the likeness from the provided character image.`;
  }).join('\n');
  
  if (locationBase64) {
    parts.push({ inlineData: { data: locationBase64, mimeType: 'image/jpeg' } });
    assetInstructions += `\n- Background: Use the provided location image (the last image) as the background.`;
  }

  const prompt = `
Create a 9:16 portrait aspect ratio, ultra-photorealistic image based on the provided assets and instructions.

**Visual Style:** ${visualStyle}

**Asset Instructions:**
${assetInstructions}

**Scene Description:** "${sceneDescription}"

**CRITICAL RULES:**
1.  **ASPECT RATIO:** The final output image MUST be a 9:16 portrait.
2.  **CHARACTER LIKENESS:** Replicate the exact likeness of each character from their respective reference images. Identity consistency is the #1 priority.
3.  **SCENE COMPOSITION:** Arrange the characters and background according to the **Scene Description**.
4.  **STYLE ADHERENCE:** The entire image must conform to the specified **Visual Style**.
5.  **PHOTOREALISM:** The final result must look like a real, high-quality photograph or artwork, not a clumsy composite.
6.  **CLEAN IMAGE:** No text, subtitles, logos, or watermarks.
`;
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: parts.reverse() }, // Text prompt last is often best
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

export const generateVeoPromptsFromScenes = async (sceneDescription: string, script: string, visualStyle: string): Promise<VeoPromptData> => {
    const ai = await getAiClient();
    const prompt = `You are a world-class cinematic director and VEO-3 prompt engineer. Your task is to create a JSON object for a single, hyper-cinematic 8-second video clip based on a scene description, animating it with sophisticated techniques.

**Scene Context:**
*   **Scene Description:** "${sceneDescription}"
*   **Voiceover Script:** "${script}"
*   **Visual Style:** ${visualStyle}

**CRITICAL INSTRUCTIONS:**
1.  **JSON Output ONLY:** Your entire response MUST be a single, valid JSON object matching the schema. No markdown, no explanations.
2.  **Cinematic Multi-Shot Structure:** The 'mainPrompt' MUST describe an 8-second video composed of 2-3 distinct, seamlessly connected sub-scenes (shots). Use professional cinematography terms.
3.  **Detailed Animation:** Describe subtle, realistic animations for characters (micro-expressions like a slight smile, slow blink, thoughtful glance, natural breathing) and the environment (dust motes in light, gentle sway of plants, fabric movement).
4.  **Schema and Content Guidelines:**
    *   **dialogueInstruction (string):** Create a clear audio instruction in Bahasa Indonesia for a narrator. The style MUST be narration ('narasi'), meaning the character in the video should not speak. The instruction must contain the script verbatim.
    *   **mainPrompt (string):**
        *   Start with: "A hyperrealistic 8K cinematic video, 9:16 portrait ratio, in a ${visualStyle} style."
        *   Describe the full scene, characters, and environment in rich detail.
        *   Structure the 8-second clip into 2-3 numbered shots with durations, like this: "Scene 1 (3s): [Description of camera move and action]. Scene 2 (2s): [Description of a different camera angle, like a close-up]. Scene 3 (3s): [Description of the final action and camera move]."
        *   Use cinematic terms: 'slow dolly push', 'rack focus from foreground to character's face', 'extreme close-up on the character's eyes', 'gentle orbital pan', 'subtle lens flare'.
    *   **negativePrompt (string):** Use this exact, comprehensive string: "low quality, jagged, flickering, distorted face, unnatural movement, robotic, stiff, poor lip-sync, CGI, 3D render, cartoon, text, watermark, logo, blurry, mutated hands, extra limbs, bad anatomy, disproportionate, creepy, static background, dead eyes, bad lighting, plastic look"

---
**EXAMPLE of a CINEMATIC OUTPUT:**
\`\`\`json
{
  "dialogueInstruction": "A narrator speaks in a calm, thoughtful tone in Bahasa Indonesia: 'Setiap hari sama, capek, butuh sesuatu yang baru.'",
  "mainPrompt": "A hyperrealistic 8K cinematic video, 9:16 portrait ratio, in a cinematic style. A tired Indonesian programmer in his late 20s sits in a dimly lit, cozy room at night. The 8-second video consists of three seamlessly integrated shots: Scene 1 (3s): A slow tracking shot pushes towards the character as he slumps over an old keyboard, his face illuminated by the monitor's cool glow. He blinks slowly, a sigh visible in his posture. Scene 2 (2s): Extreme close-up rack focus from his fingers hesitating over the keys to his exhausted, emotionless eyes. You can see the reflection of code in his glasses. Scene 3 (3s): A medium shot from the side. He leans back, running a hand through his hair in frustration. Dust motes dance in the single beam of light from a desk lamp.",
  "negativePrompt": "low quality, jagged, flickering, distorted face, unnatural movement, robotic, stiff, poor lip-sync, CGI, 3D render, cartoon, text, watermark, logo, blurry, mutated hands, extra limbs, bad anatomy, disproportionate, creepy, static background, dead eyes, bad lighting, plastic look"
}
\`\`\`
---

Now, based on the provided scene description and script, generate your JSON object.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
    });

    const jsonString = response.text.trim().replace(/^```json|```$/g, '');
    try {
        return JSON.parse(jsonString) as VeoPromptData;
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", jsonString);
        throw new Error("AI returned an invalid JSON format for the VEO prompt.");
    }
};