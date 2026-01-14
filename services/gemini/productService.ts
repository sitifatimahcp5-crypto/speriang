import { getAiClient } from "./aiService";

export const optimizeDescription = async (productName: string, existingDescription: string = ''): Promise<string> => {
  const ai = await getAiClient();
  const prompt = `
You are a master copywriter for the Indonesian e-commerce market, specializing in short, punchy, and persuasive product descriptions for platforms like TikTok Shop and Shopee Video.

Your task is to create a compelling product description based on the product name provided.

Product Name: "${productName}"
${existingDescription ? `Existing Description (for context): "${existingDescription}"` : ''}

CRITICAL RULES:
1.  **Language:** The output MUST be in Bahasa Indonesia.
2.  **Length:** The description must be concise, ideally between 15-25 words.
3.  **Style:** Use a soft-selling, benefit-oriented approach. Focus on what the customer gets or feels.
4.  **Tone:** Enthusiastic, trustworthy, and slightly urgent. Use common Indonesian marketing phrases if appropriate (e.g., "Wajib punya!", "Solusi buat kamu...", "Bikin hidup lebih mudah!").
5.  **Output:** Respond with ONLY the description text, nothing else.

Example for "Kipas Angin Genggam Portabel":
"Gerah pas di jalan? Kipas angin mini ini solusinya! Anginnya kenceng, desainnya lucu, dan bisa masuk kantong. Wajib punya!"

Now, generate a description for the product name provided above.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text.trim();
};