import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';
import { getChutesServers } from '../services/chutesKeyService';
import Card from './Card';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
    const [chutesServers, setChutesServers] = useState<{id: number, name: string}[]>([]);
    const [activeChutesServerId, setActiveChutesServerId] = useState<number | null>(null);
    const [isLoadingChutes, setIsLoadingChutes] = useState(true);


    const loadChutesSettings = useCallback(async () => {
        setIsLoadingChutes(true);
        try {
            const servers = getChutesServers();
            setChutesServers(servers);
            const activeServerSetting = await dbService.getSetting('activeChutesServerId');
            const defaultServer = servers.length > 0 ? servers[servers.length - 1].id : null;
            setActiveChutesServerId(activeServerSetting?.value as number ?? defaultServer);
        } catch (error) {
            console.error("Failed to load server settings:", error);
        } finally {
            setIsLoadingChutes(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadChutesSettings();
        }
    }, [isOpen, loadChutesSettings]);
    
    const handleSetChutesServer = async (id: number | null) => {
        try {
            await dbService.addSetting({ key: 'activeChutesServerId', value: id });
            setActiveChutesServerId(id);
        } catch (error) {
            console.error("Failed to set active server:", error);
        }
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-md max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-indigo-400">Pengaturan</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    <h3 className="font-semibold text-gray-300 text-lg">Pilih Server</h3>
                    <p className="text-sm text-gray-400">Pilih server yang akan digunakan untuk membuat video. Jika satu server sibuk, coba ganti ke server lain.</p>
                    {isLoadingChutes ? <p>Memuat server...</p> : (
                        <div className="space-y-2">
                            {chutesServers.map(server => (
                                <label key={server.id} className="flex items-center p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                                    <input
                                        type="radio"
                                        name="video-server"
                                        value={server.id}
                                        checked={activeChutesServerId === server.id}
                                        onChange={() => handleSetChutesServer(server.id)}
                                        className="w-5 h-5 text-indigo-500 bg-gray-800 border-gray-600 focus:ring-indigo-600 ring-offset-gray-900"
                                    />
                                    <span className="ml-3 font-medium text-gray-200">{server.name}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default SettingsModal;