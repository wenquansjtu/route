// Utility to determine the backend URL based on the current domain
export class BackendConfig {
    static isVercelDeployment() {
        // Check if we're on a Vercel deployment
        return window.location.hostname.includes('vercel.app');
    }
    
    static isLocalhost() {
        // Check if we're on localhost
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
    
    static getBackendUrl() {
        // For Vercel deployments, use the same domain as the frontend
        if (this.isVercelDeployment()) {
            // Use the same domain as the frontend for backend requests
            return window.location.origin;
        }
        
        // In development, use localhost:8081 (where our local server is running)
        if (this.isLocalhost()) {
            return 'http://localhost:8081';  // 确保使用正确的端口
        }
        
        // In production (non-Vercel), use the same domain as the frontend
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
    
    static shouldUseDemoMode() {
        // No longer use demo mode for Vercel deployments
        // Only use demo mode when we're on localhost but the backend server is not running
        return false;
    }
}