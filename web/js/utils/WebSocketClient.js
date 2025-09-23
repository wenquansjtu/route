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
            return Promise.resolve();
        }
        
        // If already connecting, return early
        if (this.isConnecting) {
            return Promise.resolve();
        }
        
        this.isConnecting = true;
        this.manualDisconnect = false;
        this.demoMode = false;
        this.connectionFailed = false;
        
        try {
            // Convert WebSocket URL to SSE URL
            const sseUrl = this.convertToSSEUrl(url);
            
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
                        // If connection fails, switch to demo mode for Vercel deployments
                        if (BackendConfig.isVercelDeployment()) {
                            this.switchToDemoMode();
                            resolve();
                        } else {
                            reject(new Error('Connection timeout'));
                        }
                    }
                }, 15000);
                
                this.eventSource.onopen = () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.connectionFailed = false;
                    this.emit('connected');
                    resolve();
                };
                
                this.eventSource.onerror = (error) => {
                    clearTimeout(timeout);
                    this.isConnected = false;
                    this.isConnecting = false;
                    this.connectionFailed = true;
                    this.emit('error', error);
                    
                    // If this is a Vercel deployment, switch to demo mode instead of reconnecting
                    if (BackendConfig.isVercelDeployment()) {
                        this.switchToDemoMode();
                        resolve();
                        return;
                    }
                    
                    // Attempt to reconnect for non-Vercel deployments
                    this.attemptReconnect();
                    reject(error);
                };
            });
            
        } catch (error) {
            this.isConnecting = false;
            this.connectionFailed = true;
            
            // If this is a Vercel deployment, switch to demo mode instead of reconnecting
            if (BackendConfig.isVercelDeployment()) {
                this.switchToDemoMode();
                return Promise.resolve();
            }
            
            // Attempt to reconnect for non-Vercel deployments
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
    
    switchToDemoMode() {
        this.demoMode = true;
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionFailed = false;
        
        // Close any existing connection
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        
        // Emit demo mode event
        this.emit('demo-mode-activated');
        
        // Start demo mode simulation
        this.startDemoSimulation();
    }
    
    startDemoSimulation() {
        // Simulate initial AI system status
        setTimeout(() => {
            this.emit('ai-system-status', {
                timestamp: Date.now(),
                openaiApiKey: false,
                totalAIAgents: 6,
                activeCollaborations: 0,
                totalCollaborations: 3,
                connectedClients: 0,
                sseClients: 0,
                aiAgents: [
                    {
                        id: 'demo-agent-1',
                        name: 'Prof. Smoot (Demo)',
                        type: 'specialized',
                        status: 'active',
                        capabilities: ['task_allocation', 'cosmic_structure_modeling'],
                        personality: { traits: ['nobel_prize_winner', 'analytical', 'precise'] },
                        expertise: ['cosmic_structure_theory', 'tensor_field_analysis'],
                        position: { x: 0, y: 0, z: 0 },
                        mass: 3.0
                    },
                    {
                        id: 'demo-agent-2',
                        name: 'Dr. Analyzer (Demo)',
                        type: 'analyzer',
                        status: 'active',
                        capabilities: ['deep_analysis', 'pattern_recognition'],
                        personality: { traits: ['analytical', 'detail-oriented', 'systematic'] },
                        expertise: ['data_science', 'research_methodology'],
                        position: { x: 100, y: 50, z: 50 },
                        mass: 2.0
                    },
                    {
                        id: 'demo-agent-3',
                        name: 'Prof. Reasoner (Demo)',
                        type: 'reasoner',
                        status: 'active',
                        capabilities: ['logical_reasoning', 'inference'],
                        personality: { traits: ['logical', 'methodical', 'rational'] },
                        expertise: ['formal_logic', 'philosophy'],
                        position: { x: -100, y: 100, z: -50 },
                        mass: 1.8
                    }
                ],
                system: {
                    memory: { rss: 85426176, heapTotal: 60135568, heapUsed: 38754336, external: 1878528 },
                    uptime: 120
                }
            });
        }, 1000);
        
        // Simulate periodic updates
        let taskCounter = 1;
        const demoInterval = setInterval(() => {
            if (!this.demoMode) {
                clearInterval(demoInterval);
                return;
            }
            
            // Simulate agent updates
            this.emit('ai-agent-update', {
                id: 'demo-agent-' + (1 + Math.floor(Math.random() * 3)),
                name: 'Demo Agent',
                type: 'demo',
                status: 'active',
                capabilities: ['demo_capability'],
                personality: { traits: ['demo'] },
                expertise: ['demo_expertise'],
                position: { 
                    x: Math.random() * 200 - 100, 
                    y: Math.random() * 200 - 100, 
                    z: Math.random() * 200 - 100 
                },
                mass: 1.0 + Math.random() * 2.0
            });
            
            // Simulate task chain execution steps
            if (Math.random() > 0.7) {
                this.emit('task-chain-execution-step', {
                    taskChainId: 'demo-chain-' + Math.floor(Math.random() * 100),
                    step: Math.floor(Math.random() * 5) + 1,
                    agentId: 'demo-agent-' + (1 + Math.floor(Math.random() * 3)),
                    action: 'analyzing',
                    content: 'Processing demo task data...'
                });
            }
            
            // Simulate task completions
            if (Math.random() > 0.9) {
                this.emit('task-chain-completed', {
                    chainId: 'demo-chain-' + taskCounter++,
                    result: 'Demo task completed successfully',
                    executionTime: Math.floor(Math.random() * 1000) + 500
                });
            }
            
        }, 3000);
    }
    
    setupEventHandlers() {
        // Handle generic message events
        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event) {
                    this.emit(data.event, data.data);
                } else {
                    this.emit('message', data);
                }
            } catch (e) {
                this.emit('message', event.data);
            }
        };
        
        // Handle custom events (if the server sends them as different event types)
        this.eventSource.addEventListener('ai-system-status', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-system-status', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('agent-update', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('agent-update', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('task-update', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('task-update', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('collaboration-update', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('collaboration-update', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('topology-update', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('topology-update', data);
            } catch (e) {
            }
        });

// Add a new event listener for network-topology-update
        this.eventSource.addEventListener('network-topology-update', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('network-topology-update', data);
            } catch (e) {
            }
        });

        this.eventSource.addEventListener('tcf-update', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('tcf-update', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('task-chain-execution-step', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('task-chain-execution-step', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('task-chain-completed', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('task-chain-completed', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('prof-smoot-allocation', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('prof-smoot-allocation', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('fallback-allocation', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('fallback-allocation', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('ai-collaboration-completed', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-collaboration-completed', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('ai-collaboration-update', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-collaboration-update', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('ai-task-completed', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-task-completed', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('ai-task-acknowledged', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-task-acknowledged', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('ai-agent-created', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-agent-created', data);
            } catch (e) {
            }
        });
        
        this.eventSource.addEventListener('ai-agent-update', (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('ai-agent-update', data);
            } catch (e) {
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
            
            // Exponential backoff with max delay of 30 seconds
            const delay = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts), 30000);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            this.emit('reconnect-failed');
        }
    }
    
    send(type, payload = {}) {
        // In demo mode, simulate responses
        if (this.demoMode) {
            this.simulateDemoResponse(type, payload);
            return true;
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
                    } else {
                    }
                }).catch(error => {
                });
                
                return true;
            } catch (error) {
                return false;
            }
        } else {
            // Try to reconnect if not connected
            if (!this.isConnecting) {
                this.connect();
            }
            return false;
        }
    }
    
    simulateDemoResponse(type, payload) {
        // Simulate responses for demo mode
        switch (type) {
            case 'get-ai-status':
                // This is handled by the periodic simulation
                break;
            case 'get-topology-data':
                // Simulate topology data
                setTimeout(() => {
                    this.emit('topology-update', {
                        nodes: [
                            { id: 'demo-agent-1', name: 'Prof. Smoot (Demo)', type: 'specialized', status: 'active', position: { x: 0, y: 0, z: 0 }, energy: 95 },
                            { id: 'demo-agent-2', name: 'Dr. Analyzer (Demo)', type: 'analyzer', status: 'active', position: { x: 100, y: 50, z: 50 }, energy: 87 },
                            { id: 'demo-agent-3', name: 'Prof. Reasoner (Demo)', type: 'reasoner', status: 'active', position: { x: -100, y: 100, z: -50 }, energy: 92 }
                        ],
                        connections: [
                            { source: 'demo-agent-1', target: 'demo-agent-2', strength: 0.8, type: 'collaboration' },
                            { source: 'demo-agent-2', target: 'demo-agent-3', strength: 0.6, type: 'data_flow' },
                            { source: 'demo-agent-1', target: 'demo-agent-3', strength: 0.4, type: 'coordination' }
                        ]
                    });
                }, 500);
                break;
            case 'submit-ai-task':
                // Simulate task submission
                setTimeout(() => {
                    this.emit('ai-task-acknowledged', { 
                        taskId: payload.id || 'demo-task-' + Date.now(),
                        message: 'Task received and processing started (Demo Mode)'
                    });
                    
                    // Simulate task completion
                    setTimeout(() => {
                        this.emit('ai-task-completed', {
                            success: true,
                            result: {
                                taskId: payload.id || 'demo-task-' + Date.now(),
                                finalResult: 'This is a simulated result from the demo mode. In a real deployment, this would be generated by actual AI agents working together.',
                                executionSteps: [
                                    { agent: 'Prof. Smoot (Demo)', action: 'Task allocation', duration: 150 },
                                    { agent: 'Dr. Analyzer (Demo)', action: 'Data analysis', duration: 320 },
                                    { agent: 'Prof. Reasoner (Demo)', action: 'Logical reasoning', duration: 280 }
                                ]
                            }
                        });
                    }, 2000);
                }, 500);
                break;
            case 'create-ai-agent':
                // Simulate agent creation
                setTimeout(() => {
                    this.emit('ai-agent-created', { 
                        success: true, 
                        agent: {
                            id: 'demo-agent-' + Date.now(),
                            name: payload.name || 'Demo Agent',
                            type: payload.type || 'demo',
                            status: 'active',
                            capabilities: payload.capabilities || ['demo_capability'],
                            personality: payload.personality || { traits: ['demo'] },
                            expertise: payload.expertise || ['demo_expertise'],
                            position: payload.position || { x: 0, y: 0, z: 0 },
                            mass: payload.mass || 1.0
                        }
                    });
                }, 500);
                break;
        }
    }
    
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                }
            });
        }
    }
    
    disconnect() {
        // In demo mode, just set flags
        if (this.demoMode) {
            this.isConnected = false;
            this.isConnecting = false;
            this.demoMode = false;
            return;
        }
        
        this.manualDisconnect = true;
        
        if (this.eventSource) {
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