'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function saveConnectionSettings(connections) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Save P21 connection
            if (connections.p21) {
                const response = yield fetch('/api/connection-settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: 'p21',
                        settings: connections.p21,
                        lastUpdated: new Date().toISOString()
                    }),
                });
                if (!response.ok) {
                    throw new Error('Failed to save P21 connection settings');
                }
            }
            // Save POR connection
            if (connections.por) {
                const response = yield fetch('/api/connection-settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: 'por',
                        settings: connections.por,
                        lastUpdated: new Date().toISOString()
                    }),
                });
                if (!response.ok) {
                    throw new Error('Failed to save POR connection settings');
                }
            }
        }
        catch (error) {
            console.error('Error saving connection settings:', error);
            throw error;
        }
    });
}
export function getConnectionSettings() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const connections = {
                p21: null,
                por: null
            };
            // Get P21 connection
            const p21Response = yield fetch('/api/connection-settings/p21');
            if (p21Response.ok) {
                const p21Data = yield p21Response.json();
                connections.p21 = p21Data.settings;
            }
            // Get POR connection
            const porResponse = yield fetch('/api/connection-settings/por');
            if (porResponse.ok) {
                const porData = yield porResponse.json();
                connections.por = porData.settings;
            }
            return connections;
        }
        catch (error) {
            console.error('Error getting connection settings:', error);
            return null;
        }
    });
}
