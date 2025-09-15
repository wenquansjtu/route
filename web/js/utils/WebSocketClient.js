// Socket.IO客户端
import { BackendConfig } from './BackendConfig.js';

export class WebSocketClient {
    constructor() {
        this.socket = null;
        this.eventHandlers = new Map();
        this.reconnectInterval = 3000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
        this.connectionId = Math.random().toString(36).substring(2, 9); // Add unique ID for debugging
        this.connectionTimeout = 15000; // 15 seconds timeout
        this.isConnected = false;
        this.isConnecting = false; // Track connection state to prevent duplicate connections
        this.manualDisconnect = false; // Track if disconnect was intentional
        this.heartbeatInterval = null; // Heartbeat interval
        this.demoMode = false; // Track if we're in demo mode
    }
    
    async connect(url = BackendConfig.getBackendUrl()) {
        // If we're on Vercel, use demo mode instead of trying to connect to WebSocket
        if (BackendConfig.shouldUseDemoMode()) {
            console.log(`[WebSocketClient-${this.connectionId}] Vercel deployment detected, using demo mode`);
            this.demoMode = true;
            this.isConnected = false;
            this.emit('disconnected', 'demo-mode');
            return Promise.resolve();
        }
        
        // If already connected, return early
        if (this.isConnected && this.socket && this.socket.connected) {
            console.log(`[WebSocketClient-${this.connectionId}] Already connected`);
            return Promise.resolve();
        }
        
        // If already connecting, return early
        if (this.isConnecting) {
            console.log(`[WebSocketClient-${this.connectionId}] Already connecting`);
            return Promise.resolve();
        }
        
        this.isConnecting = true;
        this.manualDisconnect = false;
        this.demoMode = false;
        
        try {
            console.log(`[WebSocketClient-${this.connectionId}] Attempting to connect to ${url}`);
            
            // Use Socket.IO client instead of native WebSocket
            if (typeof io === 'undefined') {
                console.error('❌ Socket.IO client not loaded! Make sure socket.io.js is included.');
                this.isConnecting = false;
                throw new Error('Socket.IO client not loaded');
            }
            
            // If we have an existing socket, disconnect it first
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }
            
            this.socket = io(url, {
                transports: ['websocket', 'polling'], // Try websocket first, then polling
                timeout: this.connectionTimeout,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectInterval,
                reconnectionDelayMax: 5000,
                randomizationFactor: 0.5,
                autoConnect: false, // We'll manually connect
                upgrade: true, // Enable upgrade for better connection stability
                rememberUpgrade: false,
                pingInterval: 25000, // Match server ping interval
                pingTimeout: 60000,   // Match server ping timeout
                // Transport stability options
                rejectUnauthorized: false, // Accept self-signed certificates
                withCredentials: false,    // Don't send credentials
                // Force new connection
                forceNew: true,
                // Add transport stability options
                transports: ['websocket', 'polling'],
                upgrade: true, // Enable upgrade to improve transport stability
                // Additional stability improvements
                multiplex: false, // Disable multiplexing to prevent connection conflicts
                // Connection timeout settings
                upgradeTimeout: 30000,
                // Transport specific options
                polling: {
                    upgrade: true
                },
                websocket: {
                    upgrade: true
                }
            });
            
            // Set up heartbeat
            this.setupHeartbeat();
            
            // Manually connect
            this.socket.connect();
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.isConnecting = false;
                    reject(new Error('Connection timeout'));
                }, this.connectionTimeout);
                
                this.socket.on('connect', () => {
                    clearTimeout(timeout);
                    console.log(`✅ [WebSocketClient-${this.connectionId}] Socket.IO连接已建立, socket ID: ${this.socket.id}`);
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.emit('connected');
                    resolve();
                });
                
                this.socket.on('disconnect', (reason) => {
                    clearTimeout(timeout);
                    console.log(`❌ [WebSocketClient-${this.connectionId}] Socket.IO连接已断开: ${reason}`);
                    this.isConnected = false;
                    this.isConnecting = false;
                    
                    // Clear heartbeat
                    this.clearHeartbeat();
                    
                    // Log the disconnection reason for debugging
                    console.log(`[WebSocketClient-${this.connectionId}] Disconnection reason: ${reason}`);
                    
                    // Special handling for transport errors
                    if (reason === 'transport error' || reason === 'transport close') {
                        console.log(`[WebSocketClient-${this.connectionId}] Transport issue detected, will attempt immediate reconnect`);
                        // For transport errors, try to reconnect more aggressively
                        setTimeout(() => {
                            this.connect();
                        }, 1000); // Quick reconnect for transport issues
                        return;
                    }
                    
                    // Only attempt to reconnect if it wasn't a manual disconnect
                    if (!this.manualDisconnect) {
                        this.emit('disconnected', reason);
                        // Always attempt to reconnect for any disconnection reason
                        this.attemptReconnect();
                    } else {
                        console.log(`[WebSocketClient-${this.connectionId}] Manual disconnect, not reconnecting`);
                    }
                });
                
                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.error(`[WebSocketClient-${this.connectionId}] Socket.IO连接错误:`, error);
                    this.isConnected = false;
                    this.isConnecting = false;
                    this.emit('error', error);
                    // Always attempt to reconnect on connection error
                    this.attemptReconnect();
                });
                
                // Listen for custom events
                this.socket.onAny((eventName, ...args) => {
                    console.log(`📨 [WebSocketClient-${this.connectionId}] Received event: ${eventName}`, args);
                    this.emit(eventName, args[0]);
                });
                
                // Listen for pong responses
                this.socket.on('pong', () => {
                    console.log(`🏓 [WebSocketClient-${this.connectionId}] Received pong from server`);
                });
            });
            
        } catch (error) {
            console.error(`[WebSocketClient-${this.connectionId}] Socket.IO连接失败:`, error);
            this.isConnecting = false;
            // Always attempt to reconnect on connection failure
            this.attemptReconnect();
            throw error;
        }
    }
    
    setupHeartbeat() {
        // Clear any existing heartbeat
        this.clearHeartbeat();
        
        // Set up periodic heartbeat
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('ping');
            }
        }, 20000); // Send ping every 20 seconds
    }
    
    clearHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    attemptReconnect() {
        // Don't attempt to reconnect in demo mode
        if (this.demoMode) {
            return;
        }
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 [WebSocketClient-${this.connectionId}] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            // Exponential backoff with max delay of 30 seconds
            const delay = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts), 30000);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error(`❌ [WebSocketClient-${this.connectionId}] Socket.IO重连失败，达到最大重试次数`);
            this.emit('reconnect-failed');
        }
    }
    
    send(type, payload = {}) {
        // In demo mode, don't send messages
        if (this.demoMode) {
            console.log(`[WebSocketClient-${this.connectionId}] Demo mode: Not sending message ${type}`);
            return false;
        }
        
        if (this.socket && this.socket.connected) {
            this.socket.emit(type, payload);
            console.log(`📤 [WebSocketClient-${this.connectionId}] Sent event: ${type}`, payload);
            return true;
        } else {
            console.warn(`[WebSocketClient-${this.connectionId}] Socket.IO未连接，无法发送消息: ${type}`);
            // Try to reconnect if not connected
            if (!this.isConnecting) {
                this.connect();
            }
            return false;
        }
    }
    
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
        console.log(`[WebSocketClient-${this.connectionId}] Added handler for event: ${event}`);
    }
    
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
                console.log(`[WebSocketClient-${this.connectionId}] Removed handler for event: ${event}`);
            }
        }
    }
    
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            console.log(`[WebSocketClient-${this.connectionId}] Emitting event: ${event} to ${handlers.length} handlers`);
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[WebSocketClient-${this.connectionId}] 事件处理器错误 (${event}):`, error);
                }
            });
        }
    }
    
    disconnect() {
        // In demo mode, just set flags
        if (this.demoMode) {
            this.isConnected = false;
            this.isConnecting = false;
            return;
        }
        
        this.manualDisconnect = true;
        this.clearHeartbeat();
        
        if (this.socket) {
            console.log(`[WebSocketClient-${this.connectionId}] Disconnecting socket`);
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.isConnecting = false;
        }
    }
    
    // Add a getter for connection status
    get connected() {
        // In demo mode, we're never actually connected
        if (this.demoMode) {
            return false;
        }
        return this.socket && this.socket.connected;
    }
    
    // Add a getter for demo mode
    get isDemoMode() {
        return this.demoMode;
    }
}