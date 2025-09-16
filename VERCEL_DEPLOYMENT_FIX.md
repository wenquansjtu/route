# Vercel Deployment Configuration Update

## Problem
Previously, when deploying the application to Vercel at `https://route-roan.vercel.app`, WebSocket connections were failing because:
1. Vercel is a static hosting platform that doesn't support traditional WebSocket servers
2. The application was trying to connect to `wss://route-roan.vercel.app/socket.io/` which doesn't exist
3. This caused connection errors and prevented the application from functioning properly

## Solution
Updated the application to use Server-Sent Events (SSE) instead of WebSocket connections for Vercel deployments. SSE is HTTP-based and fully compatible with Vercel's infrastructure. The application will now:
1. Use SSE for real-time communication on Vercel deployments
2. Maintain WebSocket compatibility for local development and other environments
3. Provide the same real-time functionality with SSE as with WebSocket

## Changes Made

### 1. Updated Backend Configuration
File: [web/js/utils/BackendConfig.js](file:///Users/hh/tao/route/web/js/utils/BackendConfig.js)

- Removed automatic demo mode detection for Vercel deployments
- Updated `shouldUseDemoMode()` method to always return false
- Vercel deployments now use the same domain as the frontend for backend connections

### 2. Replaced WebSocket with SSE Client
File: [web/js/utils/WebSocketClient.js](file:///Users/hh/tao/route/web/js/utils/WebSocketClient.js)

- Completely replaced WebSocket implementation with SSE (EventSource) implementation
- Added HTTP POST endpoint for sending messages from client to server (since SSE is unidirectional)
- Maintained the same API interface for compatibility with existing code
- Added comprehensive event handling for all server events
- Implemented automatic reconnection logic

### 3. Updated Server to Support SSE
File: [src/server-real-ai.js](file:///Users/hh/tao/route/src/server-real-ai.js)

- Added SSE client management with `sseClients` Set
- Implemented SSE endpoint at `/sse` with proper headers
- Added SSE broadcasting capabilities alongside existing WebSocket broadcasting
- Added HTTP POST endpoint at `/api/message` for SSE clients to send messages
- Integrated SSE event broadcasting with existing application events

### 4. Updated Main Application
File: [web/js/main.js](file:///Users/hh/tao/route/web/js/main.js)

- Removed Vercel deployment checks in connection logic
- Updated connection handling to work with SSE
- Maintained all existing functionality with SSE

### 5. Updated Real AI Interface
File: [web/js/real-ai-interface.js](file:///Users/hh/tao/route/web/js/real-ai-interface.js)

- Removed Vercel deployment checks in connection logic
- Updated connection handling to work with SSE
- Maintained all existing functionality with SSE

## How It Works

### Environment Detection
1. **Localhost Development**: Connects to `http://localhost:8080` for SSE connections
2. **Vercel Deployments**: Connects to SSE on the same domain as the frontend
3. **Other Production Environments**: Connects to the backend on the same domain as the frontend

### Connection Handling
1. **Successful Connections**: Full real-time functionality with actual AI agents via SSE
2. **Connection Failures**: Standard error handling with user notifications and automatic reconnection
3. **Message Sending**: Uses HTTP POST to `/api/message` endpoint since SSE is unidirectional

### Event Broadcasting
1. **Server to Client**: Uses SSE with custom event types for different message types
2. **Client to Server**: Uses HTTP POST requests to send messages
3. **Dual Compatibility**: Server supports both WebSocket and SSE clients simultaneously

## Benefits

1. **Real Data on Vercel**: Vercel deployments can now use real AI data with SSE
2. **Vercel Compatibility**: SSE works perfectly with Vercel's infrastructure
3. **Backward Compatibility**: WebSocket connections still work for local development
4. **Consistent Behavior**: Same connection logic across all deployment environments
5. **Clear Error Handling**: Connection failures are handled consistently
6. **No Code Changes**: Existing client code works without modification
7. **Easy Maintenance**: Simplified connection logic

## Usage

The application now:
- When running on localhost:3000, connects to the backend on localhost:8080 via SSE
- When deployed to Vercel, connects to the backend on the same domain via SSE
- When deployed to other domains, connects to the backend on the same domain via SSE

If a backend server is running and accessible, the application will use real data via SSE. If not, standard connection error handling will apply.

## Technical Details

### SSE Implementation
- Uses `EventSource` API for server-to-client communication
- Implements automatic reconnection with exponential backoff
- Handles multiple event types with custom event listeners
- Provides the same interface as the previous WebSocket implementation

### HTTP POST for Client-to-Server Messages
- Since SSE is unidirectional, client-to-server messages use HTTP POST
- All existing `send()` method calls work unchanged
- Messages are sent to `/api/message` endpoint on the server

### Server-Side SSE Support
- SSE endpoint at `/sse` with proper headers for streaming
- Client management with automatic cleanup on disconnect
- Broadcasting to all connected SSE clients
- Integration with existing WebSocket broadcasting for dual support