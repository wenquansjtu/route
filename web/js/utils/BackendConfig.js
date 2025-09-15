// Utility to determine the backend URL based on the current domain
export class BackendConfig {
    static getBackendUrl() {
        // In development, use localhost:8080
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080';
        }
        
        // In production, use the same domain as the frontend
        // This assumes the backend is served from the same domain
        return window.location.origin;
    }
    
    static getWebSocketUrl() {
        // Get the backend URL and replace http/https with ws/wss
        const backendUrl = this.getBackendUrl();
        if (backendUrl.startsWith('https://')) {
            return backendUrl.replace('https://', 'wss://');
        } else {
            return backendUrl.replace('http://', 'ws://');
        }
    }
}