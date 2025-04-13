'use server';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function checkServerHealth(serverType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/api/admin/health', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serverType }),
            });
            const data = yield response.json();
            return {
                isConnected: data.isConnected,
                error: data.error,
                details: data.details,
                config: data.config,
            };
        }
        catch (error) {
            return {
                isConnected: false,
                error: 'Failed to check server health',
            };
        }
    });
}
export function getServerConfig(serverType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`/api/connection-settings/${serverType}`, {
                method: 'GET',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch server config');
            }
            const data = yield response.json();
            return data;
        }
        catch (error) {
            console.error('Error fetching server config:', error);
            return null;
        }
    });
}
export function updateServerConfig(serverType, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`/api/connection-settings/${serverType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config),
            });
            if (!response.ok) {
                throw new Error('Failed to update server config');
            }
            return true;
        }
        catch (error) {
            console.error('Error updating server config:', error);
            return false;
        }
    });
}
