import { Type } from "@google/genai";
import { getAiClient } from "./aiService";
import { SeoContent } from "../../types";

const seoSchema = {
  type: Type.OBJECT,
  properties: {
    judul_clickbait: { type: Type.STRING, description: "Satu judul clickbait yang menarik untuk semua platform." },
    tiktok: {
      type: Type.OBJECT,
      properties: {
        deskripsi: { type: Type.STRING, description: "Deskripsi SEO-friendly khusus untuk TikTok." },
        tagar: { type: Type.STRING, description: "String berisi hashtag relevan untuk TikTok, dipisahkan spasi (e.g., #fyp #viral #marketing)." }
      },
      required: ['deskripsi', 'tagar']
    },
    shopee: {
      type: Type.OBJECT,
      properties: {
        deskripsi: { type: Type.STRING, description: "Deskripsi produk atau video yang dioptimalkan untuk Shopee." },
        tagar: { type: Type.STRING, description: "String berisi hashtag relevan untuk Shopee." }
      },
      required: ['deskripsi', 'tagar']
    },
    reels_youtube: {
      type: Type.OBJECT,
      properties: {
        deskripsi: { type: Type.STRING, description: "Deskripsi video yang dioptimalkan untuk Instagram Reels dan YouTube Shorts." },
        tagar: { type: Type.STRING, description: "String berisi hashtag relevan untuk Reels dan Shorts." }
      },
      required: ['deskripsi', 'tagar']
    },
    facebook_pro: {
      type: Type.OBJECT,
      properties: {
        deskripsi: { type: Type.STRING, description: "Deskripsi postingan yang dioptimalkan untuk Facebook Professional Mode." },
        tagar: { type: Type.STRING, description: "String berisi hashtag relevan untuk Facebook." }
      },
      required: ['deskripsi', 'tagar']
    },
    whatsapp: {
      type: Type.OBJECT,
      properties: {
        deskripsi: { type: Type.STRING, description: "Pesan promosi terstruktur untuk WhatsApp, menggunakan emoji, format *bold* dan _italic_, dan baris baru (enter) untuk kerapian." },
        tagar: { type: Type.STRING, description: "Hanya berisi Call To Action (CTA) singkat atau link, karena tagar tidak umum di WhatsApp." }
      },
      required: ['deskripsi', 'tagar']
    }
  },
  required: ['judul_clickbait', 'tiktok', 'shopee', 'reels_youtube', 'facebook_pro', 'whatsapp']
};

export const generateSeoContent = async (promptContext: string, language: string): Promise<SeoContent> => {
  const ai = await getAiClient();
  const systemInstruction = `Anda adalah ahli strategi Pemasaran Media Sosial yang berspesialisasi dalam SEO dan konten viral untuk pasar Indonesia. Tugas Anda adalah membuat paket SEO lengkap berdasarkan ide konten pengguna. Output harus berupa objek JSON tunggal yang cocok dengan skema yang diberikan. Bahasa untuk konten SEO harus ${language}.
Fokus Utama: Ciptakan Persuasi. Gunakan bahasa persuasif, ciptakan rasa urgensi, dan tonjolkan proposisi penjualan unik dari produk/layanan pengguna untuk mendorong tindakan segera. Target audiensnya adalah orang Indonesia yang tertarik dengan apa yang ditawarkan oleh bisnis pengguna.

Instruksi:
Judul Clickbait: Buat satu judul gaya clickbait yang sangat menarik dan efektif di semua platform. Judul ini harus membuat orang penasaran untuk mengklik.
Konten Spesifik Platform: Untuk setiap platform, hasilkan:
Deskripsi menarik yang disesuaikan dengan gaya dan audiens platform tersebut. Tonjolkan manfaat dan nilai.
String tagar yang relevan, sedang tren, dan spesifik.
Konten Spesifik WhatsApp: Buat pesan promosi yang dioptimalkan untuk WhatsApp.
Struktur: Gunakan pembukaan yang ramah, sorot penawaran utama, dan akhiri dengan ajakan bertindak yang jelas. Penting, gunakan jeda baris (
) untuk memisahkan paragraf dan membuat tata letak yang bersih dan mudah dibaca. Gunakan emoji untuk memecah teks. Gunakan format WhatsApp, seperti *bold* untuk penekanan dan _italic_ untuk sorotan.
Output: Pastikan output akhir HANYA objek JSON yang sesuai dengan skema. Jangan menambahkan teks atau penjelasan tambahan.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Buat paket SEO lengkap untuk aset pemasaran yang dibuat dari ide ini: "${promptContext}"`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: seoSchema,
    },
  });
  
  const jsonString = response.text.trim();
  return JSON.parse(jsonString) as SeoContent;
};