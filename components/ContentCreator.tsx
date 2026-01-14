import React, { useState, useEffect, useCallback, useRef } from 'react';
import { dbService } from '../services/db';
import * as contentCreatorService from '../services/gemini/contentCreatorService';
import * as ttsService from '../services/gemini/ttsService';
import * as avatarService from '../services/gemini/avatarService';
import * as videoService from '../services/gemini/videoService';
import * as seoService from '../services/gemini/seoService';
import { Scene, Project, Page, Character, Avatar, Location, VeoPromptData, Mode, SeoContent } from '../types';
import LoadingOverlay from './LoadingOverlay';
import Card from './Card';
import { DownloadIcon, ClipboardIcon, CheckIcon, VideoIcon } from './icons/Icons';
import Loader from './Loader';
import VoiceSelector from './VoiceSelector';
import SeoDisplay from './SeoDisplay';

interface ContentCreatorProps {
    setCurrentPage: (page: Page) => void;
}

type Step = 'idea' | 'characterApproval' | 'storyboardApproval' | 'sceneImageApproval' | 'final';
type SceneTab = 'image' | 'video1' | 'video2';


const VISUAL_STYLES = [
    { value: 'Photorealistic', label: 'Fotorealistik (Mirip Manusia)' },
    { value: '3D Cartoon (Gaya Pixar)', label: 'Anomali / Disney / Pixar' },
    { value: 'Anime Shounen', label: 'Anime Shounen (Gaya Naruto/Bleach)' },
    { value: 'abstract', label: 'Abstrak' },
    { value: 'anime', label: 'Anime' },
    { value: 'art deco', label: 'Art Deco' },
    { value: 'art nouveau', label: 'Art Nouveau' },
    { value: 'comic book', label: 'Buku Komik' },
    { value: 'watercolor', label: 'Cat Air' },
    { value: 'blueprint', label: 'Cetak Biru' },
    { value: 'claymation', label: 'Claymation' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'enhance', label: 'Detail Tinggi' },
    { value: 'dark fantasy', label: 'Fantasi Gelap' },
    { value: 'analog film', label: 'Film Analog' },
    { value: 'photographic', label: 'Fotografis' },
    { value: 'futuristic', label: 'Futuristik' },
    { value: 'graffiti', label: 'Grafiti' },
    { value: 'dark cartoon horror illustration, cinematic comic style', label: 'Horor Kartun Sinematik' },
    { value: 'illustration', label: 'Ilustrasi' },
    { value: 'impressionism', label: 'Impresionisme' },
    { value: 'isometric', label: 'Isometrik' },
    { value: 'stained glass', label: 'Kaca Patri' },
    { value: 'low poly', label: 'Low Poly' },
    { value: 'minimalist', label: 'Minimalis' },
    { value: '3d model', label: 'Model 3D' },
    { value: '3D Render', label: 'Model 3D (Gaya Final Fantasy)' },
    { value: 'national geographic', label: 'National Geographic' },
    { value: 'neon punk', label: 'Neon Punk' },
    { value: 'origami', label: 'Origami' },
    { value: 'retro', label: 'Retro' },
    { value: 'concept art', label: 'Seni Konsep' },
    { value: 'digital art', label: 'Seni Digital' },
    { value: 'fantasy art', label: 'Seni Fantasi' },
    { value: 'line art', label: 'Seni Garis' },
    { value: 'pixel art', label: 'Seni Piksel' },
    { value: 'pop art', label: 'Seni Pop' },
    { value: 'vector art', label: 'Seni Vektor' },
    { value: 'cinematic', label: 'Sinematik' },
    { value: 'charcoal sketch', label: 'Sketsa Arang' },
    { value: 'steampunk', label: 'Steampunk' },
    { value: 'surrealism', label: 'Surealisme' },
    { value: 'synthwave', label: 'Synthwave' },
    { value: 'ukiyo-e', label: 'Ukiyo-e' },
    { value: 'vaporwave', label: 'Vaporwave' },
    { value: 'vintage', label: 'Vintage' },
];
const LANGUAGES = ['Bahasa Indonesia', 'English', 'Jawa', 'Sunda', 'Isi Sendiri...'];
const STORY_GENRES = ['Drama', 'Komedi', 'Aksi', 'Keluarga', 'Horor', 'Petualangan', 'Romantis', 'Slice of Life'];

// FIX: Corrected the `value` property to `name` in several objects to conform to the `Voice` interface.
const FEMALE_VOICES = [ { name: 'Zephyr', description: 'Cerah, bersemangat, ringan' }, { name: 'Kore', description: 'Tegas, profesional, percaya diri' }, { name: 'Leda', description: 'Muda, segar, lincah' }, { name: 'Aoede', description: 'Ringan, santai, mengalir alami' }, { name: 'Callirrhoe', description: 'Tenang, rileks, ramah' }, { name: 'Autonoe', description: 'Cerah, hangat, optimis' }, { name: 'Despina', description: 'Halus, elegan, profesional' }, { name: 'Erinome', description: 'Jernih, ringan, mudah dipahami' }, { name: 'Laomedeia', description: 'Ceria, optimis, positif' }, { name: 'Achernar', description: 'Lembut, sopan, bersahabat' }, { name: 'Gacrux', description: 'Dewasa, tenang, berwawa' }, { name: 'Sulafat', description: 'Hangat, ramah, empatik' } ];
const MALE_VOICES = [ { name: 'Puck', description: 'Ceria, energik, positif' }, { name: 'Charon', description: 'Informatif, jelas, profesional' }, { name: 'Fenrir', description: 'Antusias, ekspresif, penuh energi' }, { name: 'Orus', description: 'Tegas, mantap, authoritative' }, { name: 'Enceladus', description: 'Lembut, natural, bernapas' }, { name: 'Iapetus', description: 'Jernih, tegas, fokus' }, { name: 'Umbriel', description: 'Santai, ramah, fleksibel' }, { name: 'Algieba', description: 'Halus, elegan, berkelas' }, { name: 'Algenib', description: 'Berat, berkarakter, unik' }, { name: 'Rasalgethi', description: 'Informatif, netral, terstruktur' }, { name: 'Alnilam', description: 'Tegas, profesional, kuat' }, { name: 'Schedar', description: 'Seimbang, natural, stabil' }, { name: 'Pulcherrima', description: 'Tegas, fokus, dominan' }, { name: 'Achird', description: 'Ramah, bersahabat, ringan' }, { name: 'Zubenelgenubi', description: 'Santai, informal, natural' }, { name: 'Vindemiatrix', description: 'Lembut, tenang, penuh empati' }, { name: 'Sadachbia', description: 'Ceria, hidup, enerjik' }, { name: 'Sadaltager', description: 'Pintar, tenang, seperti mentor' } ];
const TTS_STYLES = [
    { value: 'cheerful', label: 'Ceria & Bersemangat' },
    { value: 'professional', label: 'Profesional & Informatif' },
    { value: 'calm', label: 'Tenang & Meyakinkan' },
    { value: 'energetic', label: 'Enerjik & Antusias' },
    { value: 'sad', label: 'Sedih & Empatik' },
    { value: 'whispering', label: 'Berbisik & Intim' },
    { value: 'custom', label: 'Isi Sendiri...' }
];


// --- Audio Helper Functions ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createWavBlob(decodedPcmData: Uint8Array): Blob {
    const SAMPLE_RATE = 24000;
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const dataSize = decodedPcmData.length;
    const bitsPerSample = 16;
    const blockAlign = 1 * (bitsPerSample / 8);

    function writeString(view: DataView, offset: number, str: string) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // numChannels
    view.setUint32(24, SAMPLE_RATE, true);
    view.setUint32(28, SAMPLE_RATE * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    return new Blob([view, decodedPcmData], { type: 'audio/wav' });
}


const ContentCreator: React.FC<ContentCreatorProps> = ({ setCurrentPage }) => {
    const [step, setStep] = useState<Step>('idea');
    const [storyIdea, setStoryIdea] = useState('');
    const [visualStyle, setVisualStyle] = useState(VISUAL_STYLES[0].value);
    const [storyGenre, setStoryGenre] = useState(STORY_GENRES[0]);
    const [language, setLanguage] = useState(LANGUAGES[0]);
    const [customLanguage, setCustomLanguage] = useState('');
    const [sceneCount, setSceneCount] = useState(3);
    const [generatedCharacters, setGeneratedCharacters] = useState<Character[]>([]);
    const [storyboard, setStoryboard] = useState<Scene[]>([]);
    const [storyboardText, setStoryboardText] = useState<{description: string, script: string, characters_in_scene: string[]}[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingText, setLoadingText] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
    const [openVeoAccordion, setOpenVeoAccordion] = useState<number | null>(null);
    const isCancelledRef = useRef(false);
    const [projectId, setProjectId] = useState<number | null>(null);
    const [sceneVideos, setSceneVideos] = useState<Record<number, { isLoading: boolean; videos: ({ url: string; blob: Blob } | null)[]; error: string | null }>>({});
    const [activeTabs, setActiveTabs] = useState<Record<number, SceneTab>>({});
    const [seoContent, setSeoContent] = useState<SeoContent | null>(null);

    // States for existing assets
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedAvatarIds, setSelectedAvatarIds] = useState<number[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

    // TTS State
    const [fullScript, setFullScript] = useState('');
    const [ttsSaveStatus, setTtsSaveStatus] = useState('');
    const [isTtsLoading, setIsTtsLoading] = useState(false);
    const [ttsError, setTtsError] = useState<string | null>(null);
    const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
    const [selectedTtsGender, setSelectedTtsGender] = useState<'Wanita' | 'Pria'>('Wanita');
    const [selectedTtsVoice, setSelectedTtsVoice] = useState<string>(FEMALE_VOICES[0].name);
    const [selectedTtsStyle, setSelectedTtsStyle] = useState<string>('cheerful');
    const [customTtsStyle, setCustomTtsStyle] = useState<string>('');

    useEffect(() => {
        setSelectedTtsVoice(selectedTtsGender === 'Wanita' ? FEMALE_VOICES[0].name : MALE_VOICES[0].name);
    }, [selectedTtsGender]);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const [avatarsData, locationsData] = await Promise.all([
                    dbService.getAvatars(),
                    dbService.getLocations(),
                ]);
                setAvatars(avatarsData);
                setLocations(locationsData);
            } catch (err) {
                console.error("Failed to fetch assets:", err);
                setError("Gagal memuat aset tersimpan.");
            }
        };
        fetchAssets();
    }, []);
    
    const handleAvatarSelect = (id: number) => {
        setSelectedAvatarIds(prev =>
            prev.includes(id) ? prev.filter(avatarId => avatarId !== id) : [...prev, id]
        );
    };

    const handleLocationSelect = (id: number) => {
        setSelectedLocationId(prev => (prev === id ? null : id));
    };

    const handleGenerateCreativePlan = async () => {
        // FIX: Corrected the 'finalLanguage' variable assignment to prevent a "used before its declaration" error. It now correctly uses the 'language' state variable as the fallback.
        const finalLanguage = language === 'Isi Sendiri...' ? customLanguage : language;

        if (!storyIdea.trim() || !finalLanguage.trim()) {
            setError("Ide cerita dan bahasa harus diisi.");
            return;
        }
        setError(null);
        setIsLoading(true);
        setGeneratedCharacters([]);
        setStoryboardText([]);
        isCancelledRef.current = false;
        
        const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

        try {
            if (selectedAvatarIds.length > 0) {
                // HYBRID OR EXISTING-ONLY FLOW
                setLoadingText("Menganalisis cerita & karakter...");
                const selectedAvatars = avatars.filter(a => selectedAvatarIds.includes(a.id!));
                const characterPayload = selectedAvatars.map(a => ({ name: a.name, imageBase64: a.imageBase64 }));

                const plan = await contentCreatorService.generateHybridStoryPlan(
                    storyIdea, visualStyle, finalLanguage, sceneCount, storyGenre, characterPayload, selectedLocation ? { name: selectedLocation.name } : undefined
                );
                if (isCancelledRef.current) throw new Error("Operation cancelled.");

                setStoryboardText(plan.storyboard);

                let allCharactersForApproval: Character[] = selectedAvatars.map(a => ({
                    id: a.id,
                    name: a.name,
                    imageBase64: a.imageBase64,
                    description: `Karakter dari Aset`
                }));

                if (plan.characters && plan.characters.length > 0) {
                    // New characters need to be generated
                    const newCharactersWithImages: Character[] = [];
                    for (const charDef of plan.characters) {
                        setLoadingText(`Membuat gambar karakter baru: ${charDef.name}...`);
                        const imageBase64 = await avatarService.generateAvatarImage(charDef.description, visualStyle);
                        if (isCancelledRef.current) throw new Error("Operation cancelled.");
                        newCharactersWithImages.push({ ...charDef, imageBase64 });
                    }
                    allCharactersForApproval = [...allCharactersForApproval, ...newCharactersWithImages];
                    setGeneratedCharacters(allCharactersForApproval);
                    setStep('characterApproval');
                } else {
                    // No new characters, skip approval
                    setGeneratedCharacters(allCharactersForApproval);
                    const initialStoryboard = plan.storyboard.map((sceneData, i) => ({
                        sceneNumber: i + 1,
                        description: sceneData.description,
                        script: sceneData.script,
                        image: '',
                        characters_in_scene: sceneData.characters_in_scene
                    }));
                    setStoryboard(initialStoryboard);
                    setStep('storyboardApproval');
                }

            } else {
                 // PURE GENERATION FLOW
                setLoadingText("Menganalisis cerita & membuat karakter...");
                const plan = await contentCreatorService.generateFullStoryPlan(storyIdea, visualStyle, finalLanguage, sceneCount, storyGenre, selectedLocation ? { name: selectedLocation.name } : undefined);
                if (isCancelledRef.current) throw new Error("Operation cancelled.");

                setStoryboardText(plan.storyboard);

                const charactersWithImages: Character[] = [];
                for (let i = 0; i < plan.characters.length; i++) {
                    const charDef = plan.characters[i];
                    setLoadingText(`Membuat gambar karakter ${charDef.name}...`);
                    const imageBase64 = await avatarService.generateAvatarImage(charDef.description, visualStyle);
                    if (isCancelledRef.current) throw new Error("Operation cancelled.");
                    charactersWithImages.push({ ...charDef, imageBase64 });
                }
                setGeneratedCharacters(charactersWithImages);
                setStep('characterApproval');
            }
        } catch (err: any) {
            if (!err.message.includes("cancelled")) setError(err.message || "Gagal membuat rencana kreatif.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmCharacters = async () => {
        setIsLoading(true);
        setLoadingText("Menyimpan karakter ke Aset...");
        isCancelledRef.current = false;
        try {
            // Only save newly generated characters that don't come from assets
            const newCharacters = generatedCharacters.filter(c => c.description !== 'Karakter dari Aset');
            const existingAvatars = await dbService.getAvatars();
            for (const char of newCharacters) {
                // Check if an avatar with the same name already exists to prevent duplicates.
                const isDuplicate = existingAvatars.some(avatar => avatar.name.toLowerCase() === char.name.toLowerCase());
                if (!isDuplicate) {
                    const avatar: Omit<Avatar, 'id'> = {
                        name: char.name,
                        imageBase64: char.imageBase64,
                        gender: char.description.toLowerCase().includes('pria') || char.description.toLowerCase().includes('man') ? 'Pria' : 'Wanita'
                    };
                    await dbService.addAvatar(avatar as Avatar);
                } else {
                     console.log(`Avatar "${char.name}" already exists. Skipping save.`);
                }
            }
            if (isCancelledRef.current) throw new Error("Operation cancelled.");

            const initialStoryboard = storyboardText.map((sceneData, i) => ({
                sceneNumber: i + 1,
                description: sceneData.description,
                script: sceneData.script,
                image: '',
                isRegenerating: false,
                characters_in_scene: sceneData.characters_in_scene
            }));
            setStoryboard(initialStoryboard);
            setStep('storyboardApproval');
        } catch(err: any) {
             if (!err.message.includes("cancelled")) setError(err.message || "Gagal menyimpan karakter.");
        } finally {
             setIsLoading(false);
        }
    };
    
    const handlePromptChange = (index: number, newPrompt: string) => {
        setGeneratedCharacters(prev =>
            prev.map((char, i) =>
                i === index ? { ...char, description: newPrompt } : char
            )
        );
    };

    const handleRegenerateCharacter = async (index: number) => {
        const characterToRegen = generatedCharacters[index];
        if (!characterToRegen || characterToRegen.isRegenerating) return;

        setGeneratedCharacters(prev =>
            prev.map((char, i) =>
                i === index ? { ...char, isRegenerating: true } : char
            )
        );
        setError(null);

        try {
            const newImageBase64 = await avatarService.generateAvatarImage(characterToRegen.description, visualStyle);
            setGeneratedCharacters(prev =>
                prev.map((char, i) =>
                    i === index ? { ...char, imageBase64: newImageBase64, isRegenerating: false } : char
                )
            );
        } catch (err) {
            console.error("Failed to regenerate character:", err);
            setError(`Gagal membuat ulang ${characterToRegen.name}.`);
            setGeneratedCharacters(prev =>
                prev.map((char, i) =>
                    i === index ? { ...char, isRegenerating: false } : char
                )
            );
        }
    };
    
    const handleGenerateSceneImages = async () => {
        setIsLoading(true);
        setError(null);
        isCancelledRef.current = false;
        try {
            const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
            const locationBase64 = selectedLocation?.imageBase64;
            const scenesWithImages: Scene[] = [];

            for (let i = 0; i < storyboard.length; i++) {
                if (isCancelledRef.current) throw new Error("Operation cancelled.");
                setLoadingText(`Membuat gambar adegan ${i + 1}/${storyboard.length}...`);
                const sceneData = storyboard[i];
                
                const charactersForScene = generatedCharacters.filter(char =>
                    sceneData.characters_in_scene?.includes(char.name)
                );
                const characterImagePayloadForScene = charactersForScene.map(c => ({ name: c.name, imageBase64: c.imageBase64 }));

                const sceneImageBase64 = await contentCreatorService.composeMultiCharacterSceneImage(characterImagePayloadForScene, sceneData.description, visualStyle, locationBase64);
                
                scenesWithImages.push({ ...sceneData, image: `data:image/jpeg;base64,${sceneImageBase64}` });
            }
            setStoryboard(scenesWithImages);
            setStep('sceneImageApproval');
        } catch (err: any) {
             if (!err.message.includes("cancelled")) setError(err.message || "Gagal membuat gambar adegan.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateVeoAndSave = async () => {
        setIsLoading(true);
        setError(null);
        isCancelledRef.current = false;
        const finalLanguage = language === 'Isi Sendiri...' ? customLanguage : language;
        try {
            let finalStoryboard: Scene[] = [];
            for (let i = 0; i < storyboard.length; i++) {
                if (isCancelledRef.current) throw new Error("Operation cancelled.");
                setLoadingText(`Membuat prompt VEO untuk adegan ${i + 1}...`);
                const sceneData = storyboard[i];
                const veoPrompt = await contentCreatorService.generateVeoPromptsFromScenes(sceneData.description, sceneData.script, visualStyle);
                finalStoryboard.push({ ...sceneData, veoPrompt });
            }
            setStoryboard(finalStoryboard);

            setLoadingText("Membuat konten SEO...");
            const seoContext = `Konten video dengan ide cerita: "${storyIdea}". Genre: ${storyGenre}. Naskah: ${finalStoryboard.map(s => s.script).join(' ')}`;
            const generatedSeo = await seoService.generateSeoContent(seoContext, finalLanguage);
            setSeoContent(generatedSeo);
            
            setLoadingText("Menyimpan proyek ke Riwayat...");
            const projectData: Omit<Project, 'id'> = {
                productName: `Proyek: ${storyIdea.substring(0, 30)}...`,
                storyboard: finalStoryboard,
                createdAt: new Date().toISOString(),
                contentType: 'content-creator',
                storyIdea: storyIdea,
                seoContent: generatedSeo,
            };
            const newProjectId = await dbService.addProject(projectData as Project);
            setProjectId(newProjectId);
            for(const char of generatedCharacters) {
                const { id, ...charData } = char;
                await dbService.addCharacter({ ...charData, projectId: newProjectId });
            }

            const initialFullScript = finalStoryboard.map(s => s.script).join('\n\n');
            setFullScript(initialFullScript);
            setStep('final');
        } catch (err: any) {
             if (!err.message.includes("cancelled")) setError(err.message || "Gagal memfinalisasi proyek.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateScene = async (index: number) => {
        const sceneToRegen = storyboard[index];
        if (!sceneToRegen || sceneToRegen.isRegenerating || storyboard.some(s => s.isRegenerating)) return;

        setStoryboard(prev => prev.map((s, i) => i === index ? { ...s, isRegenerating: true } : s));
        setError(null);
        
        try {
            const charactersForScene = generatedCharacters.filter(char =>
                sceneToRegen.characters_in_scene?.includes(char.name)
            );
            const characterImagePayloadForScene = charactersForScene.map(c => ({ name: c.name, imageBase64: c.imageBase64 }));
            
            const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
            const locationBase64 = selectedLocation?.imageBase64;

            const newImageBase64 = await contentCreatorService.composeMultiCharacterSceneImage(
                characterImagePayloadForScene,
                sceneToRegen.description,
                visualStyle,
                locationBase64
            );
            
            const newImage = `data:image/jpeg;base64,${newImageBase64}`;
            
            setStoryboard(prevStoryboard => {
                const updatedStoryboard = prevStoryboard.map((s, i) =>
                    i === index ? { ...s, image: newImage, isRegenerating: false } : s
                );
                
                if (projectId) {
                    dbService.getProjects().then(projects => {
                        const project = projects.find(p => p.id === projectId);
                        if (project) {
                            dbService.updateProject({ ...project, storyboard: updatedStoryboard });
                        }
                    });
                }
                
                return updatedStoryboard;
            });
        } catch (err) {
            console.error("Gagal membuat ulang adegan:", err);
            setError(`Gagal membuat ulang gambar untuk Adegan ${index + 1}.`);
            setStoryboard(prev => prev.map((s, i) => i === index ? { ...s, isRegenerating: false } : s));
        }
    };

    const handleGenerateSceneVideos = async (index: number) => {
        const scene = storyboard[index];
        if (!scene || !scene.image || !projectId) return;

        setSceneVideos(prev => ({
            ...prev,
            [index]: { isLoading: true, videos: [null, null], error: "Mengoptimalkan prompt..." }
        }));
        
        const onRetryCallback = (variation: 1 | 2) => (attempt: number, maxRetries: number) => {
            setSceneVideos(prev => ({
                ...prev,
                [index]: { ...prev[index], error: `Server sibuk untuk Video ${variation}. Mencoba lagi... (${attempt}/${maxRetries})` }
            }));
        };

        try {
            const imageBase64 = scene.image.split(',')[1];
            const optimizedPrompts = await videoService.optimizeScenesForVideo(scene.description);

            if (optimizedPrompts.length < 2) throw new Error("Gagal mendapatkan dua variasi prompt.");

            setSceneVideos(prev => ({
                ...prev,
                [index]: { ...prev[index], error: "Membuat Video 1..." }
            }));
            const videoBlob1 = await videoService.generateVideoFromImage(imageBase64, optimizedPrompts[0], onRetryCallback(1));
            
            setSceneVideos(prev => ({
                ...prev,
                [index]: { ...prev[index], error: "Membuat Video 2..." }
            }));
            const videoBlob2 = await videoService.generateVideoFromImage(imageBase64, optimizedPrompts[1], onRetryCallback(2));

            const videoUrl1 = URL.createObjectURL(videoBlob1);
            const videoUrl2 = URL.createObjectURL(videoBlob2);
            
            await Promise.all([
                dbService.addVideoHistoryItem({ mode: Mode.Video, prompt: optimizedPrompts[0], output: videoBlob1, createdAt: new Date().toISOString(), projectId, sceneNumber: index + 1, variation: 1 }),
                dbService.addVideoHistoryItem({ mode: Mode.Video, prompt: optimizedPrompts[1], output: videoBlob2, createdAt: new Date().toISOString(), projectId, sceneNumber: index + 1, variation: 2 })
            ]);

            setSceneVideos(prev => ({
                ...prev,
                [index]: {
                    isLoading: false,
                    videos: [
                        { url: videoUrl1, blob: videoBlob1 },
                        { url: videoUrl2, blob: videoBlob2 }
                    ],
                    error: null
                }
            }));

            setActiveTabs(prev => ({ ...prev, [index]: 'video1' }));

        } catch (err: any) {
            console.error(`Gagal membuat video untuk adegan ${index + 1}:`, err);
            setSceneVideos(prev => ({
                ...prev,
                [index]: { isLoading: false, videos: [null, null], error: err.message || "Gagal membuat video." }
            }));
        }
    };

    const handleGenerateVoiceover = async () => {
        if (!fullScript || !projectId) return;
        const finalStyle = selectedTtsStyle === 'custom' ? customTtsStyle : selectedTtsStyle;
        const prompt = `Speak with a ${finalStyle} tone: ${fullScript}`;

        setIsTtsLoading(true);
        setTtsError(null);
        setTtsAudioUrl(null);
        setTtsSaveStatus('');

        try {
            const audioBase64 = await ttsService.generateSpeech(prompt, selectedTtsVoice, 1.0);
            
            await dbService.addTTSHistoryItem({
                text: fullScript,
                voice: selectedTtsVoice,
                style: finalStyle,
                audioBase64,
                createdAt: new Date().toISOString(),
                speakingRate: 1.0,
                projectId: projectId
            });

            const pcmData = decode(audioBase64);
            const wavBlob = createWavBlob(pcmData);
            const url = URL.createObjectURL(wavBlob);
            setTtsAudioUrl(url);
            setTtsSaveStatus('Audio berhasil disimpan ke Riwayat Suara!');
            setTimeout(() => setTtsSaveStatus(''), 4000);

        } catch (err: any) {
            setTtsError(err.message || 'Gagal membuat suara.');
        } finally {
            setIsTtsLoading(false);
        }
    };

    const handleReset = () => {
        setStep('idea');
        setStoryIdea('');
        setVisualStyle(VISUAL_STYLES[0].value);
        setStoryGenre(STORY_GENRES[0]);
        setLanguage(LANGUAGES[0]);
        setSceneCount(3);
        setGeneratedCharacters([]);
        setStoryboard([]);
        setError(null);
        setSelectedAvatarIds([]);
        setSelectedLocationId(null);
        setProjectId(null);
        setSceneVideos({});
        setSeoContent(null);
    };

    const downloadImage = (base64Image: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadBlob = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleDownload = (index: number) => {
        const activeTab = activeTabs[index] || 'image';
        const scene = storyboard[index];
        const videoData = sceneVideos[index];

        if (activeTab === 'image') {
            downloadImage(scene.image, `scene_${scene.sceneNumber}.jpg`);
        } else if (activeTab === 'video1' && videoData?.videos[0]?.url) {
            const a = document.createElement('a');
            a.href = videoData.videos[0].url;
            a.download = `scene_${scene.sceneNumber}_video1.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else if (activeTab === 'video2' && videoData?.videos[1]?.url) {
            const a = document.createElement('a');
            a.href = videoData.videos[1].url;
            a.download = `scene_${scene.sceneNumber}_video2.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const handleCopyToClipboard = (promptData: VeoPromptData, index: number) => {
        const fullPrompt = `DIALOGUE INSTRUCTION:\n${promptData.dialogueInstruction}\n\nMAIN PROMPT:\n${promptData.mainPrompt}\n\nNEGATIVE PROMPT:\n${promptData.negativePrompt}`;
        navigator.clipboard.writeText(fullPrompt);
        setCopiedPromptIndex(index);
        setTimeout(() => setCopiedPromptIndex(null), 2000);
    };

    const renderIdeaStep = () => (
        <Card className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-center">Langkah 1: Tentukan Ide & Konsep</h2>
            <div>
                <label htmlFor="storyIdea" className="block text-lg font-semibold text-gray-200 mb-2">Masukkan Ide Cerita Anda</label>
                <textarea id="storyIdea" rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400" value={storyIdea} onChange={(e) => setStoryIdea(e.target.value)} placeholder="Contoh: petualangan dua sahabat mencari harta karun legendaris di hutan terlarang."/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label htmlFor="storyGenre" className="block text-sm font-medium mb-2">Genre Cerita</label><select id="storyGenre" value={storyGenre} onChange={e => setStoryGenre(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">{STORY_GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                <div><label htmlFor="visualStyle" className="block text-sm font-medium mb-2">Gaya Visual</label><select id="visualStyle" value={visualStyle} onChange={e => setVisualStyle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">{VISUAL_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                <div>
                    <label htmlFor="language" className="block text-sm font-medium mb-2">Bahasa</label>
                    <select id="language" value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select>
                    {language === 'Isi Sendiri...' && (
                        <input
                            type="text"
                            value={customLanguage}
                            onChange={e => setCustomLanguage(e.target.value)}
                            placeholder="Masukkan bahasa..."
                            className="mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5"
                        />
                    )}
                </div>
                <div><label htmlFor="sceneCount" className="block text-sm font-medium mb-2">Jumlah Adegan</label><select id="sceneCount" value={sceneCount} onChange={e => setSceneCount(parseInt(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5">{Array.from({ length: 30 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            </div>
            
             <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-gray-200">Gunakan Aset Tersimpan (Opsional)</h3>
                {avatars.length > 0 ? (
                    <div>
                        <label className="block text-sm font-medium mb-2">Pilih Karakter (Avatar)</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {avatars.map(avatar => (
                                <div key={avatar.id} onClick={() => handleAvatarSelect(avatar.id!)} className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all p-1 bg-gray-800 ${selectedAvatarIds.includes(avatar.id!) ? 'border-indigo-500 ring-2 ring-indigo-500 scale-105' : 'border-transparent hover:border-gray-500'}`}>
                                    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-900">
                                        <img src={`data:image/jpeg;base64,${avatar.imageBase64}`} alt="" className="absolute inset-0 h-full w-full object-cover blur-md scale-110" aria-hidden="true" />
                                        <img src={`data:image/jpeg;base64,${avatar.imageBase64}`} alt={avatar.name} className="relative h-full w-full object-contain" />
                                    </div>
                                    <p className="text-xs text-center mt-1 p-1 truncate">{avatar.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : <p className="text-sm text-gray-500">Tidak ada avatar tersimpan. Buat di menu Aset.</p>}
                
                {locations.length > 0 && (
                     <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Pilih Lokasi</label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {locations.map(location => (
                                <div key={location.id} onClick={() => handleLocationSelect(location.id!)} className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all p-1 bg-gray-800 ${selectedLocationId === location.id ? 'border-indigo-500 ring-2 ring-indigo-500 scale-105' : 'border-transparent hover:border-gray-500'}`}>
                                     <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-900">
                                        <img src={`data:image/jpeg;base64,${location.imageBase64}`} alt="" className="absolute inset-0 h-full w-full object-cover blur-md scale-110" aria-hidden="true" />
                                        <img src={`data:image/jpeg;base64,${location.imageBase64}`} alt={location.name} className="relative h-full w-full object-contain" />
                                    </div>
                                     <p className="text-xs text-center mt-1 p-1 truncate">{location.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center pt-4"><button onClick={handleGenerateCreativePlan} className="btn-primary font-bold py-3 px-12 rounded-full text-lg">Lanjutkan</button></div>
        </Card>
    );
    
    const renderCharacterApprovalStep = () => (
        <Card className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-center">Langkah 2: Pratinjau & Edit Karakter</h2>
            <p className="text-center text-gray-400">AI telah membuat karakter untuk cerita Anda. Edit prompt dan buat ulang gambar jika perlu.</p>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
                {generatedCharacters.map((char, index) => (
                    <Card key={index} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-gray-900/50">
                        {/* Left Column: Image */}
                        <div className="relative aspect-square w-full max-w-sm mx-auto">
                            <div className="w-full h-full rounded-lg bg-gray-800 flex items-center justify-center">
                                <img src={`data:image/jpeg;base64,${char.imageBase64}`} alt={char.name} className="w-full h-full object-contain rounded-lg" />
                            </div>
                            {char.isRegenerating && (
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
                                    <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
                                    <p className="text-sm mt-2 text-white">Membuat ulang...</p>
                                </div>
                            )}
                        </div>
    
                        {/* Right Column: Details & Actions */}
                        <div className="space-y-3">
                            <h3 className="text-xl font-semibold text-indigo-400">{char.name}</h3>
                            <div>
                                <label htmlFor={`prompt-${index}`} className="block text-sm font-medium text-gray-300 mb-1">Prompt Karakter</label>
                                <textarea
                                    id={`prompt-${index}`}
                                    rows={5}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-gray-200 disabled:bg-gray-800 disabled:text-gray-500"
                                    value={char.description}
                                    onChange={(e) => handlePromptChange(index, e.target.value)}
                                    disabled={char.description === 'Karakter dari Aset' || char.isRegenerating}
                                />
                            </div>
                            <button
                                onClick={() => handleRegenerateCharacter(index)}
                                disabled={char.description === 'Karakter dari Aset' || char.isRegenerating || generatedCharacters.some(c => c.isRegenerating)}
                                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                                Buat Ulang Karakter
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
            <p className="text-center text-gray-500 text-sm">Karakter baru akan disimpan ke Aset Anda saat melanjutkan (kecuali jika nama sudah ada).</p>
            <div className="flex justify-center gap-4 pt-4">
                <button onClick={() => setStep('idea')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-full">Kembali & Edit Ide</button>
                <button onClick={handleConfirmCharacters} className="btn-primary font-bold py-3 px-8 rounded-full" disabled={generatedCharacters.some(c => c.isRegenerating)}>
                    Cocok, Lanjutkan
                </button>
            </div>
        </Card>
    );

    const renderStoryboardApprovalStep = () => (
        <Card className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-center">Langkah 3: Edit Naskah Storyboard</h2>
            <p className="text-center text-gray-400">Naskah telah dibuat. Anda bisa mengedit deskripsi visual atau naskah suara sebelum membuat gambar.</p>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
                {storyboard.map((scene, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                        <h3 className="font-bold text-indigo-400 mb-2">Adegan {scene.sceneNumber}</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-300">Deskripsi Visual (Untuk AI)</label>
                                <textarea rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm" value={scene.description} onChange={e => setStoryboard(s => s.map((sc, i) => i === index ? {...sc, description: e.target.value} : sc))} />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-300">Naskah Suara (Voice Over)</label>
                                <textarea rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm" value={scene.script} onChange={e => setStoryboard(s => s.map((sc, i) => i === index ? {...sc, script: e.target.value} : sc))} />
                             </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-center gap-4 pt-4">
                <button onClick={() => generatedCharacters.some(c => c.description !== 'Karakter dari Aset') ? setStep('characterApproval') : setStep('idea')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-full">Kembali</button>
                <button onClick={handleGenerateSceneImages} className="btn-primary font-bold py-3 px-8 rounded-full">Buat Gambar Adegan</button>
            </div>
        </Card>
    );

    const renderSceneImageApprovalStep = () => (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center">Langkah 4: Pratinjau & Edit Gambar Adegan</h2>
            <p className="text-center text-gray-400">Setiap gambar adegan telah dibuat. Edit deskripsi atau naskah, lalu buat ulang gambar jika perlu.</p>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                {storyboard.map((scene, index) => {
                    const sceneCharacters = generatedCharacters.filter(char => scene.characters_in_scene?.includes(char.name));
                    
                    return (
                        <Card key={index} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start bg-gray-900/50">
                            <div className="relative">
                                <div className="relative aspect-[9/16] w-full bg-gray-800 rounded-lg overflow-hidden">
                                    <img src={scene.image} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" />
                                    {scene.isRegenerating && (
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
                                            <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
                                            <p className="text-sm mt-2 text-white">Membuat ulang...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-xl text-indigo-400">Adegan {scene.sceneNumber}</h3>
                                {sceneCharacters.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-300">Karakter dalam Adegan</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {sceneCharacters.map(char => (
                                                <div key={char.name} className="flex items-center gap-2 p-1 pr-2 bg-gray-700 rounded-full">
                                                    <img src={`data:image/jpeg;base64,${char.imageBase64}`} alt={char.name} className="w-6 h-6 rounded-full object-cover" />
                                                    <span className="text-xs font-medium">{char.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-gray-300">Deskripsi Visual (Prompt Gambar)</label>
                                    <textarea rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm" value={scene.description} onChange={e => setStoryboard(s => s.map((sc, i) => i === index ? {...sc, description: e.target.value} : sc))} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-300">Naskah Suara</label>
                                    <textarea rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm" value={scene.script} onChange={e => setStoryboard(s => s.map((sc, i) => i === index ? {...sc, script: e.target.value} : sc))} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => downloadImage(scene.image, `scene_${scene.sceneNumber}.jpg`)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"><DownloadIcon className="w-4 h-4"/>Unduh Gambar</button>
                                    <button onClick={() => handleRegenerateScene(index)} disabled={scene.isRegenerating} className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                                        Buat Ulang Gambar
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
             <div className="flex justify-center gap-4 pt-4">
                <button onClick={() => setStep('storyboardApproval')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-full">Kembali</button>
                <button onClick={handleGenerateVeoAndSave} className="btn-primary font-bold py-3 px-8 rounded-full">Lanjutkan & Buat Prompt VEO</button>
            </div>
        </div>
    );

    const renderFinalStep = () => (
         <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center">Langkah 5: Hasil Akhir</h2>
            <p className="text-center text-gray-400">Proyek Anda berhasil dibuat dan disimpan di Riwayat.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storyboard.map((scene, index) => {
                    const activeTab = activeTabs[index] || 'image';
                    const sceneVideoData = sceneVideos[index];
                    const isAnyLoading = scene.isRegenerating || sceneVideoData?.isLoading;
                    const projectName = storyIdea.replace(/\s+/g, '_').substring(0, 15);
                    return (
                        <Card key={index} className="p-3 flex flex-col bg-gray-900/50">
                            <div className="relative">
                                <div className="flex justify-center p-1 bg-gray-800 rounded-t-lg text-xs">
                                    <button onClick={() => setActiveTabs(prev => ({ ...prev, [index]: 'image' }))} className={`px-3 py-1 rounded-md ${activeTab === 'image' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Gambar</button>
                                    <button onClick={() => setActiveTabs(prev => ({ ...prev, [index]: 'video1' }))} disabled={!sceneVideoData?.videos[0]} className={`px-3 py-1 rounded-md ${activeTab === 'video1' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:text-gray-500 disabled:hover:bg-transparent`}>Adegan 1</button>
                                    <button onClick={() => setActiveTabs(prev => ({ ...prev, [index]: 'video2' }))} disabled={!sceneVideoData?.videos[1]} className={`px-3 py-1 rounded-md ${activeTab === 'video2' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:text-gray-500 disabled:hover:bg-transparent`}>Adegan 2</button>
                                </div>
                                <div className="relative aspect-[9/16] w-full bg-gray-800 rounded-b-lg overflow-hidden">
                                    {activeTab === 'image' && <img src={scene.image} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" />}
                                    {activeTab === 'video1' && sceneVideoData?.videos[0]?.url && <video src={sceneVideoData.videos[0].url} controls loop className="w-full h-full object-cover" />}
                                    {activeTab === 'video2' && sceneVideoData?.videos[1]?.url && <video src={sceneVideoData.videos[1].url} controls loop className="w-full h-full object-cover" />}
                                    {isAnyLoading && (
                                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
                                            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-indigo-400"></div>
                                            <p className="text-sm mt-2 text-white">{scene.isRegenerating ? 'Membuat ulang...' : sceneVideoData?.error || 'Membuat video...'}</p>
                                        </div>
                                    )}
                                    {sceneVideoData?.error && !isAnyLoading && activeTab !== 'image' && (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2"><p className="text-red-400 text-center text-xs">{sceneVideoData.error}</p></div>
                                    )}
                                </div>
                            </div>
                            <div className="py-2 flex justify-center gap-2 flex-wrap">
                                {activeTab === 'image' && (
                                     <button onClick={() => handleGenerateSceneVideos(index)} disabled={isAnyLoading} className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-pink-600 text-white font-semibold py-1.5 px-3 rounded-md transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed" title="Buat Video dari Gambar">
                                        <VideoIcon className="w-4 h-4"/>
                                        <span>Buat Video</span>
                                    </button>
                                )}
                                 {sceneVideoData?.videos[0] && (
                                  <button onClick={() => downloadBlob(sceneVideoData.videos[0]!.blob, `${projectName}_scene_${scene.sceneNumber}_video_1.mp4`)} className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-green-600 text-white font-semibold py-1.5 px-3 rounded-md transition-colors"><DownloadIcon className="w-4 h-4"/><span>Unduh Video 1</span></button>
                                )}
                                {sceneVideoData?.videos[1] && (
                                  <button onClick={() => downloadBlob(sceneVideoData.videos[1]!.blob, `${projectName}_scene_${scene.sceneNumber}_video_2.mp4`)} className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-green-600 text-white font-semibold py-1.5 px-3 rounded-md transition-colors"><DownloadIcon className="w-4 h-4"/><span>Unduh Video 2</span></button>
                                )}
                            </div>
                            <div className="flex-1 space-y-3 pt-2 border-t border-gray-700">
                                <h3 className="font-bold text-lg text-indigo-400">Adegan {scene.sceneNumber}</h3>
                                <p className="text-gray-300 bg-gray-900 p-2 rounded text-sm">{scene.script}</p>
                                {scene.veoPrompt && (
                                    <div className="border border-gray-700 rounded-lg overflow-hidden">
                                        <div className="flex justify-between items-center p-3 bg-gray-800">
                                            <button onClick={() => setOpenVeoAccordion(openVeoAccordion === index ? null : index)} className="flex-grow flex items-center justify-between text-left">
                                                <h4 className="font-semibold">Prompt VEO</h4>
                                                <svg className={`w-5 h-5 transform transition-transform ${openVeoAccordion === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(scene.veoPrompt!, index); }} className="ml-4 flex items-center gap-1 text-sm bg-gray-600 px-2 py-1 rounded">
                                                {copiedPromptIndex === index ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />} {copiedPromptIndex === index ? 'Disalin' : 'Salin'}
                                            </button>
                                        </div>
                                        {openVeoAccordion === index && (
                                            <div className="p-4 bg-gray-900/50 space-y-3">
                                                <div><h5 className="font-semibold text-sm text-gray-400 mb-1">Instruksi Dialog</h5><p className="text-sm whitespace-pre-wrap text-indigo-300">{scene.veoPrompt.dialogueInstruction}</p></div>
                                                <div><h5 className="font-semibold text-sm text-gray-400 mb-1">Prompt Utama (Animasi)</h5><p className="text-sm whitespace-pre-wrap text-gray-200">{scene.veoPrompt.mainPrompt}</p></div>
                                                <div><h5 className="font-semibold text-sm text-gray-400 mb-1">Prompt Negatif</h5><p className="text-xs whitespace-pre-wrap text-gray-500">{scene.veoPrompt.negativePrompt}</p></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
            
            {seoContent && <SeoDisplay content={seoContent} />}

            <Card className="p-4 sm:p-6 mt-6 bg-gray-900/50">
                <h3 className="text-xl font-bold text-purple-400 mb-4">Buat Suara untuk Naskah Lengkap</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Naskah Lengkap (Bisa diedit)</label>
                        <textarea value={fullScript} onChange={e => setFullScript(e.target.value)} rows={8} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-300" />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Jenis Kelamin Suara</label>
                            <div className="flex justify-center gap-6 bg-gray-800 border border-gray-700 rounded-lg p-2.5">
                                <label className="flex items-center cursor-pointer"><input type="radio" name="ttsGender" value="Wanita" checked={selectedTtsGender === 'Wanita'} onChange={() => setSelectedTtsGender('Wanita')} className="w-4 h-4 text-indigo-500"/><span className="ml-2 text-sm">Wanita</span></label>
                                <label className="flex items-center cursor-pointer"><input type="radio" name="ttsGender" value="Pria" checked={selectedTtsGender === 'Pria'} onChange={() => setSelectedTtsGender('Pria')} className="w-4 h-4 text-indigo-500"/><span className="ml-2 text-sm">Pria</span></label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Model Suara</label>
                             <VoiceSelector 
                                voices={selectedTtsGender === 'Wanita' ? FEMALE_VOICES : MALE_VOICES}
                                selectedVoice={selectedTtsVoice}
                                onSelectVoice={setSelectedTtsVoice}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Gaya Bicara</label>
                            <select value={selectedTtsStyle} onChange={e => setSelectedTtsStyle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-sm">{TTS_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                        </div>
                        {selectedTtsStyle === 'custom' && <input type="text" value={customTtsStyle} onChange={e => setCustomTtsStyle(e.target.value)} placeholder="Gaya kustom (Inggris)" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-sm"/>}
                    </div>
                </div>
                <div className="text-center mt-4">
                    <button onClick={handleGenerateVoiceover} disabled={isTtsLoading} className="btn-primary font-bold py-2 px-8 rounded-lg">{isTtsLoading ? 'Membuat...' : 'Buat & Simpan Suara'}</button>
                </div>
                {isTtsLoading && <div className="flex justify-center mt-4"><Loader text="Membuat suara..."/></div>}
                {ttsError && <p className="text-red-400 text-center mt-2">{ttsError}</p>}
                {ttsSaveStatus && <p className="text-green-400 text-center mt-2 text-sm font-semibold">{ttsSaveStatus}</p>}
                {ttsAudioUrl && !isTtsLoading && <div className="mt-4"><audio controls src={ttsAudioUrl} className="w-full" /></div>}
            </Card>

            <div className="text-center pt-4"><button onClick={handleReset} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-12 rounded-full">Buat Proyek Baru</button></div>
        </div>
    );

    const renderStepContent = () => {
        switch (step) {
            case 'idea': return renderIdeaStep();
            case 'characterApproval': return renderCharacterApprovalStep();
            case 'storyboardApproval': return renderStoryboardApprovalStep();
            case 'sceneImageApproval': return renderSceneImageApprovalStep();
            case 'final': return renderFinalStep();
            default: return renderIdeaStep();
        }
    };

    return (
        <div className="space-y-8">
            {isLoading && <LoadingOverlay text={loadingText} onCancel={() => isCancelledRef.current = true} />}
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500">Buat Konten Video Cepat</h1>
            {error && <p className="text-red-400 text-center p-4 bg-red-900/50 rounded-lg">{error}</p>}
            {renderStepContent()}
        </div>
    );
};

export default ContentCreator;