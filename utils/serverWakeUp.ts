// Utility to wake up the backend server on app start
// This prevents the first API call from taking too long due to cold start

import { API_URL } from '../constants/api';

export const wakeUpServer = async () => {
    try {
        console.log('Waking up backend server...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        await fetch(`${API_URL}/items?limit=1`, {
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('Backend server is ready!');
    } catch (error) {
        // Ignore errors - this is just a wake-up call
        console.log('Server wake-up call completed (may still be starting)');
    }
};
