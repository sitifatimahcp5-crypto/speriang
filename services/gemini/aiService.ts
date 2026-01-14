import { GoogleGenAI } from "@google/genai";
import { dbService } from '../db';
import { ApiKey } from '../../types';

let ai: GoogleGenAI | null = null;
let initPromise: Promise<GoogleGenAI> | null = null;

const initializeClient = async (): Promise<GoogleGenAI> => {
    try {
        const activeIdSetting = await dbService.getSetting('activeApiKeyId');
        if (activeIdSetting && typeof activeIdSetting.value === 'number') {
            // FIX: Use the specific dbService.getApiKey function instead of the incorrect dbService.getByKey.
            const activeKey = await dbService.getApiKey(activeIdSetting.value);
            if (activeKey) {
                console.log(`Using API key "${activeKey.name}" from database.`);
                return new GoogleGenAI({ apiKey: activeKey.key });
            }
        }
    } catch (e) {
        console.error("Error getting API key from DB, falling back to environment variable.", e);
    }

    if (process.env.API_KEY) {
        console.log("Using API key from environment variable as fallback.");
        return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    }
    
    throw new Error("No active API key is set in Settings, and the API_KEY environment variable is not available.");
};

// Singleton pattern to ensure we only initialize the client once per session.
export const getAiClient = (): Promise<GoogleGenAI> => {
    if (ai && !initPromise) {
        return Promise.resolve(ai);
    }
    if (initPromise) {
        return initPromise;
    }
    initPromise = initializeClient().then(client => {
        ai = client;
        initPromise = null;
        return ai;
    }).catch(err => {
        initPromise = null; // Clear promise on error to allow retries
        console.error("Failed to initialize AI client:", err);
        throw err;
    });
    return initPromise;
};

// FIX: Export reinitializeAiClient to allow resetting and reloading the AI client with a new API key.
export const reinitializeAiClient = async (): Promise<GoogleGenAI> => {
    ai = null;
    initPromise = null;
    console.log("AI client re-initialization triggered.");
    return getAiClient();
};