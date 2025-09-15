# Backend Domain Update

## Problem
The application was hardcoded to connect to `http://localhost:8080` for all WebSocket and API connections. This caused issues when deploying the application to different domains, as the frontend would still try to connect to localhost instead of the current domain.

## Solution
Created a dynamic backend configuration system that automatically detects the appropriate backend URL based on the current domain.

## Changes Made

### 1. Created Backend Configuration Utility
File: [web/js/utils/BackendConfig.js](file:///Users/hh/tao/route/web/js/utils/BackendConfig.js)

This utility determines the correct backend URL:
- In development (localhost): Uses `http://localhost:8080`
- In production: Uses the same domain as the frontend

### 2. Updated WebSocket Client
File: [web/js/utils/WebSocketClient.js](file:///Users/hh/tao/route/web/js/utils/WebSocketClient.js)

- Added import for BackendConfig
- Changed default connection URL from hardcoded `http://localhost:8080` to dynamic `BackendConfig.getBackendUrl()`

### 3. Updated Main Application
File: [web/js/main.js](file:///Users/hh/tao/route/web/js/main.js)

- Added import for BackendConfig
- Updated WebSocket connection to use `BackendConfig.getBackendUrl()`
- Updated API fetch calls to use dynamic backend URL

### 4. Updated Real AI Interface
File: [web/js/real-ai-interface.js](file:///Users/hh/tao/route/web/js/real-ai-interface.js)

- Added import for BackendConfig
- Updated WebSocket connection to use `BackendConfig.getBackendUrl()`

### 5. Updated Metrics Dashboard
File: [web/js/metrics-dashboard.js](file:///Users/hh/tao/route/web/js/metrics-dashboard.js)

- Added import for BackendConfig
- Updated Socket.IO connection to use `BackendConfig.getBackendUrl()`

### 6. Updated Test Files
- [test-connection-fixed.js](file:///Users/hh/tao/route/test-connection-fixed.js): Updated to use BackendConfig
- [test-websocket-fixed.html](file:///Users/hh/tao/route/test-websocket-fixed.html): Updated to use BackendConfig
- [test-websocket.html](file:///Users/hh/tao/route/test-websocket.html): Added dynamic URL detection

### 7. Updated Vite Configuration
File: [vite.config.js](file:///Users/hh/tao/route/vite.config.js)

- Added `changeOrigin: true` to proxy configuration for better cross-origin handling

## Benefits

1. **Automatic Configuration**: The application now automatically connects to the correct backend based on the current domain
2. **Development/Production Separation**: Maintains localhost connection for development while using current domain for production
3. **No Hardcoded URLs**: Eliminates hardcoded URLs throughout the codebase
4. **Easier Deployment**: Simplifies deployment to different domains without code changes

## Usage

The application will now:
- When running on localhost:3000, connect to the backend on localhost:8080
- When deployed to any other domain, connect to the backend on the same domain

This allows the same codebase to work in both development and production environments without modification.