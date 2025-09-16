// Utility to determine the backend URL based on the current domain
export class BackendConfig {
    static isVercelDeployment() {
        // Check if we're on a Vercel deployment
        return window.location.hostname.includes('vercel.app');
    }
    
    static isRouteVercelDeployment() {
        // Check if we're on the specific route-roan.vercel.app deployment
        return window.location.hostname === 'route-roan.vercel.app';
    }
    
    static isLocalhost() {
        // Check if we're on localhost
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
    
    static getBackendUrl() {
        // For the specific route-roan.vercel.app deployment, use the fixed backend URL
        if (this.isRouteVercelDeployment()) {
            return 'https://route-roan.vercel.app';
        }
        
        // For other Vercel deployments, we need to handle this differently
        if (this.isVercelDeployment()) {
            // For Vercel, we'll use the same domain but with a different approach
            // You'll need to set up your backend separately or use a different solution
            console.warn('Vercel deployment detected. WebSocket connections may not work without a separate backend.');
            return window.location.origin;
        }
        
        // In development, use localhost:8080
        if (this.isLocalhost()) {
            return 'http://localhost:8080';
        }
        
        // In production (non-Vercel), use the same domain as the frontend
        return window.location.origin;
    }
    
    static getWebSocketUrl() {
        // For the specific route-roan.vercel.app deployment, use the fixed WebSocket URL
        if (this.isRouteVercelDeployment()) {
            return 'wss://route-roan.vercel.app';
        }
        
        // Get the backend URL and replace http/https with ws/wss
        const backendUrl = this.getBackendUrl();
        if (backendUrl.startsWith('https://')) {
            return backendUrl.replace('https://', 'wss://');
        } else {
            return backendUrl.replace('http://', 'ws://');
        }
    }
    
    static shouldUseDemoMode() {
        // Use demo mode for Vercel deployments where WebSocket server is not available
        // Except for route-roan.vercel.app which should have a real backend
        return this.isVercelDeployment() && !this.isRouteVercelDeployment();
    }
}