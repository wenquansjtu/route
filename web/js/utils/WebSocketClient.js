// SSE (Server-Sent Events) Client
import { BackendConfig } from './BackendConfig.js';

export class WebSocketClient {
    constructor() {
        this.eventSource = null;
        this.eventHandlers = new Map();
        this.connectionId = Math.random().toString(36).substring(2, 9); // Add unique ID for debugging
        this.isConnected = false;
        this.isConnecting = false; // Track connection state
        this.manualDisconnect = false; // Track if disconnect was intentional
        this.reconnectInterval = 3000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
        this.demoMode = false; // Track if we're in demo mode
        this.connectionFailed = false; // Track if connection has failed
    }
    
    async connect(url = BackendConfig.getWebSocketUrl()) {
        // If already connected, return early
        if (this.isConnected && this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
            console.log(`[SSEClient-${this.connectionId}] Already connected`);
            return Promise.resolve();
        }
        
        // If already connecting, return early
        if (this.isConnecting) {
            console.log(`[SSEClient-${this.connectionId}] Already connecting`);
            return Promise.resolve();
        }
        
        this.isConnecting = true;
        this.manualDisconnect = false;
        this.demoMode = false;
        this.connectionFailed = false;
        
        try {
            // Convert WebSocket URL to SSE URL
            const sseUrl = this.convertToSSEUrl(url);
            console.log(`[SSEClient-${this.connectionId}] Attempting to connect to ${sseUrl}`);
            
            // If we have an existing connection, close it first
            if (this.eventSource) {
                this.eventSource.close();
                this.eventSource = null;
            }
            
            // Create new EventSource connection
            this.eventSource = new EventSource(sseUrl);
            
            // Set up event handlers
            this.setupEventHandlers();
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.isConnecting = false;
                    if (this.eventSource.readyState !== EventSource.OPEN) {
                        reject(new Error('Connection timeout'));
                    }
                }, 15000);
                
                this.eventSource.onopen = () => {
                    clearTimeout(timeout);
                    console.log(`✅ [SSEClient-${this.connectionId}] SSE connection established`);
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.connectionFailed = false;
                    this.emit('connected');
                    resolve();
                };
                
                this.eventSource.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error(`[SSEClient-${this.connectionId}] SSE connection error:`, error);
                    this.isConnected = false;
                    this.isConnecting = false;
                    this.connectionFailed = true;
                    this.emit('error', error);
                    
                    // Attempt to reconnect
                    this.attemptReconnect();
                    reject(error);
                };
            });
            
        } catch (error) {
            console.error(`[SSEClient-${this.connectionId}] SSE connection failed:`, error);
            this.isConnecting = false;
            this.connectionFailed = true;
            
            // Attempt to reconnect
            this.attemptReconnect();
            throw error;
        }
    }
    
    convertToSSEUrl(webSocketUrl) {
        // Convert WebSocket URL to SSE URL
        // ws:// -> http:// and wss:// -> https://
        // Add /sse endpoint
        return webSocketUrl.replace('ws://', 'http://').replace('wss://', 'https://') + '/sse';
    }
    
    setupEventHandlers() {
        // Handle generic message events
        this.eventSource.onmessage = (event) => {
            console.log(`📨 [SSEClient-${this.connectionId}] Received message:`, event.data);
            try {
                const data = JSON.parse(event.data);
                if (data.event) {
                    this.emit(data.event, data.data);
                } else {
                    this.emit('message', data);
                }
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse message:`, event.data);
                this.emit('message', event.data);
            }
        };
        
        // Handle custom events (if the server sends them as different event types)
        this.eventSource.addEventListener('ai-system-status', (event) => {
            console.log(`📊 [SSEClient-${this.connectionId}] Received AI system status:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-system-status', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse AI system status:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('agent-update', (event) => {
            console.log(`🤖 [SSEClient-${this.connectionId}] Received agent update:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('agent-update', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse agent update:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('task-update', (event) => {
            console.log(`📝 [SSEClient-${this.connectionId}] Received task update:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('task-update', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse task update:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('collaboration-update', (event) => {
            console.log(`🤝 [SSEClient-${this.connectionId}] Received collaboration update:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('collaboration-update', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse collaboration update:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('topology-update', (event) => {
            console.log(`🌐 [SSEClient-${this.connectionId}] Received topology update:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('topology-update', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse topology update:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('tcf-update', (event) => {
            console.log(`🔬 [SSEClient-${this.connectionId}] Received TCF update:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('tcf-update', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse TCF update:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('task-chain-execution-step', (event) => {
            console.log(`🔗 [SSEClient-${this.connectionId}] Received task chain execution step:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('task-chain-execution-step', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse task chain execution step:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('task-chain-completed', (event) => {
            console.log(`✅ [SSEClient-${this.connectionId}] Received task chain completed:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('task-chain-completed', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse task chain completed:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('prof-smoot-allocation', (event) => {
            console.log(`🎯 [SSEClient-${this.connectionId}] Received Prof. Smoot allocation:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('prof-smoot-allocation', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse Prof. Smoot allocation:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('fallback-allocation', (event) => {
            console.log(`🔄 [SSEClient-${this.connectionId}] Received fallback allocation:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('fallback-allocation', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse fallback allocation:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('ai-collaboration-completed', (event) => {
            console.log(`🎉 [SSEClient-${this.connectionId}] Received AI collaboration completed:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-collaboration-completed', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse AI collaboration completed:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('ai-collaboration-update', (event) => {
            console.log(`🔄 [SSEClient-${this.connectionId}] Received AI collaboration update:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-collaboration-update', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse AI collaboration update:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('ai-task-completed', (event) => {
            console.log(`✅ [SSEClient-${this.connectionId}] Received AI task completed:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-task-completed', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse AI task completed:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('ai-task-acknowledged', (event) => {
            console.log(`📨 [SSEClient-${this.connectionId}] Received AI task acknowledged:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-task-acknowledged', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse AI task acknowledged:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('ai-agent-created', (event) => {
            console.log(`🤖 [SSEClient-${this.connectionId}] Received AI agent created:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-agent-created', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse AI agent created:`, event.data);
            }
        });
        
        this.eventSource.addEventListener('ai-agent-update', (event) => {
            console.log(`🔄 [SSEClient-${this.connectionId}] Received AI agent update:`, event.data);
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-agent-update', data);
            } catch (e) {
                console.warn(`[SSEClient-${this.connectionId}] Failed to parse AI agent update:`, event.data);
            }
        });
    }
    
    attemptReconnect() {
        // Don't attempt to reconnect in demo mode
        if (this.demoMode) {
            return;
        }
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 [SSEClient-${this.connectionId}] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            // Exponential backoff with max delay of 30 seconds
            const delay = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts), 30000);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error(`❌ [SSEClient-${this.connectionId}] Reconnection failed, maximum attempts reached`);
            this.emit('reconnect-failed');
        }
    }
    
    send(type, payload = {}) {
        // In demo mode, don't send messages
        if (this.demoMode) {
            console.log(`[SSEClient-${this.connectionId}] Demo mode: Not sending message ${type}`);
            return false;
        }
        
        // SSE is unidirectional, so we need to send messages via HTTP POST
        if (this.isConnected) {
            try {
                // Convert WebSocket URL to API URL for sending messages
                const apiUrl = this.convertToSSEUrl(BackendConfig.getWebSocketUrl()).replace('/sse', '/api/message');
                
                fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ type, payload })
                }).then(response => {
                    if (!response.ok) {
                        console.warn(`[SSEClient-${this.connectionId}] Failed to send message: ${type}`, response.status);
                    } else {
                        console.log(`📤 [SSEClient-${this.connectionId}] Sent message: ${type}`);
                    }
                }).catch(error => {
                    console.error(`[SSEClient-${this.connectionId}] Error sending message: ${type}`, error);
                });
                
                return true;
            } catch (error) {
                console.error(`[SSEClient-${this.connectionId}] Error sending message: ${type}`, error);
                return false;
            }
        } else {
            console.warn(`[SSEClient-${this.connectionId}] Not connected, cannot send message: ${type}`);
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
        console.log(`[SSEClient-${this.connectionId}] Added handler for event: ${event}`);
    }
    
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
                console.log(`[SSEClient-${this.connectionId}] Removed handler for event: ${event}`);
            }
        }
    }
    
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            console.log(`[SSEClient-${this.connectionId}] Emitting event: ${event} to ${handlers.length} handlers`);
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[SSEClient-${this.connectionId}] Error in event handler (${event}):`, error);
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
        
        if (this.eventSource) {
            console.log(`[SSEClient-${this.connectionId}] Closing SSE connection`);
            this.eventSource.close();
            this.eventSource = null;
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
        return this.eventSource && this.eventSource.readyState === EventSource.OPEN;
    }
    
    // Add a getter for demo mode
    get isDemoMode() {
        return this.demoMode;
    }
    
    // Add a getter for connection failed status
    get hasConnectionFailed() {
        return this.connectionFailed;
    }
}