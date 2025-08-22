// Force refresh the background worker to process corrected SQL
import fetch from 'node-fetch';

async function forceRefresh() {
    const port = process.env.BACKEND_PORT || '3001';
    const baseUrl = `http://localhost:${port}`;
    console.log(`🔄 Forcing background worker refresh via ${baseUrl} ...`);

    // Helper: get JWT token (prefer env JWT_TOKEN, else try login)
    const getToken = async () => {
        if (process.env.JWT_TOKEN) return process.env.JWT_TOKEN;
        const username = process.env.LOGIN_USER;
        const password = process.env.LOGIN_PASS;

        if (!username || !password) {
            console.log('ℹ️  JWT_TOKEN not provided. To auto-login, set LOGIN_USER and LOGIN_PASS env vars.');
            return null;
        }

        try {
            console.log('🔐 Logging in to obtain JWT...');
            const resp = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!resp.ok) {
                console.log('❌ Login failed:', resp.status, resp.statusText);
                return null;
            }
            const data = await resp.json();
            if (!data?.token) {
                console.log('❌ Login response missing token');
                return null;
            }
            console.log('✅ Obtained JWT token');
            return data.token;
        } catch (e) {
            console.log('❌ Login request error:', e.message);
            return null;
        }
    };

    try {
        const token = await getToken();
        if (!token) {
            console.log('⚠️  No JWT available. Set JWT_TOKEN, or provide LOGIN_USER and LOGIN_PASS to auto-login.');
            return;
        }

        // Trigger refresh via the backend API (authenticated)
        const response = await fetch(`${baseUrl}/api/worker/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json().catch(() => ({}));
            console.log('✅ Force refresh initiated successfully');
            if (Object.keys(result).length) {
                console.log('📦 Response:', result);
            }
        } else {
            console.log('❌ Force refresh failed:', response.status, response.statusText);
            if (response.status === 401 || response.status === 403) {
                console.log('🔑 Authentication required. Ensure JWT_TOKEN is valid or LOGIN_USER/LOGIN_PASS are correct.');
            }
        }
    } catch (error) {
        console.log('❌ Could not connect to backend:', error.message);
        console.log(`💡 Make sure the backend is running on port ${port}`);
    }
}

forceRefresh();
