
import { dbService } from './db';

const CHUTES_SERVERS = [
    { id: 1, name: 'Server 1', key: 'cpk_0267e53d523d4d5e81f99d9f80d55744.715cba14dba6533f9c86626ca11c10f0.jKs1iTc7MXvyipcROJ0v2GEXVWSdrIrt' },
    { id: 2, name: 'Server 2', key: 'cpk_3b513f4067214d4f98fef0fdb4ba3c85.715cba14dba6533f9c86626ca11c10f0.NShliaIhHxsud3tXV74JaacySNONjrpH' },
    { id: 3, name: 'Server 3', key: 'cpk_410fa3634d454d1190aa5f68d46ef879.715cba14dba6533f9c86626ca11c10f0.Er75SE2RcrwmMbUXu2qakZJQeaeRNKUQ' },
    { id: 4, name: 'Server 4', key: 'cpk_0672fc1bb0434627bea9ae66b23988e2.715cba14dba6533f9c86626ca11c10f0.MeLwG9MvAHkEebdDArzEzkPgCGVBT19H' },
    { id: 5, name: 'Server 5', key: 'cpk_bc3de31d85d747b3be7465ce2c231175.715cba14dba6533f9c86626ca11c10f0.uYqsdsXbTlWZmE6u7Cq9Bi5HLiSsjvbA' },
    { id: 6, name: 'Server 6', key: 'cpk_bed90818b4194a86ad693d8c66efe4a3.715cba14dba6533f9c86626ca11c10f0.uMd0nYQSYtxswgh8L098pR7K0NZtQNod' }
];

const DEFAULT_SERVER_ID = 6;

export const getChutesServers = () => CHUTES_SERVERS.map(({id, name}) => ({id, name}));

export const getActiveChutesKey = async (): Promise<string> => {
    try {
        const setting = await dbService.getSetting('activeChutesServerId');
        const activeId = setting?.value as number | undefined;

        if (activeId !== null && activeId !== undefined) {
            const server = CHUTES_SERVERS.find(s => s.id === activeId);
            if (server) {
                return server.key;
            }
        }
    } catch (e) {
        console.error("Error getting active Chutes server from DB, using default.", e);
    }
    
    // Default to server 6 if nothing is set
    const defaultServer = CHUTES_SERVERS.find(s => s.id === DEFAULT_SERVER_ID)!;
    return defaultServer.key;
};
