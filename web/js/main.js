// 主应用程序
import { NetworkVisualizer } from './components/NetworkVisualizer.js';
import { TCFVisualizer } from './components/TCFVisualizer.js';
import { TaskChainVisualizer } from './components/TaskChainVisualizer.js';
import { CollaborationMonitor, TaskManager, SystemMonitor } from './components/MonitoringComponents.js';
import { WebSocketClient } from './utils/WebSocketClient.js';
import { BackendConfig } from './utils/BackendConfig.js';

class CosmicAgentApp {
    constructor() {
        this.ws = new WebSocketClient();
        this.currentView = 'ai-overview';
        this.isConnected = false; // Track connection state
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.connectionRetryCount = 0;
        this.maxConnectionRetries = 3;
        
        // 可视化组件
        try {
            // Don't initialize NetworkVisualizer immediately, wait until network view is active
            this.networkViz = null;
        } catch (error) {
            this.networkViz = null;
        }
        
        try {
            this.tcfViz = new TCFVisualizer('#tcf-visualization');
        } catch (error) {
            this.tcfViz = null;
        }
        
        try {
            this.taskChainViz = new TaskChainVisualizer('#task-chain-graph');
        } catch (error) {
            this.taskChainViz = null;
        }
        
        try {
            this.collaborationMonitor = new CollaborationMonitor();
        } catch (error) {
            this.collaborationMonitor = null;
        }
        
        try {
            this.taskManager = new TaskManager();
        } catch (error) {
            this.taskManager = null;
        }
        
        try {
            this.systemMonitor = new SystemMonitor();
        } catch (error) {
            this.systemMonitor = null;
        }
        
        // 系统状态
        this.systemState = {
            agents: new Map(),
            tasks: new Map(),
            taskChains: new Map(),
            collaborationSessions: new Map(),
            metrics: {}
        };
        
        // Initialize immediately instead of calling this.init() which might have timing issues
        this.initializeApp();
    }
    
    async initializeApp() {
        // Make the app instance globally accessible
        window.cosmicApp = this;
        
        // Register service worker for PWA support
        this.registerServiceWorker();
        
        this.setupEventListeners();
        this.setupWebSocketHandlers();
        
        // Connect to the real AI backend on port 8080
        await this.connectToServer();
        
        // Initialize components after a longer delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeComponents();
            
            // Start data polling
            this.startDataPolling();
            
            // Generate sample data for demonstration initially
            this.generateSampleSystemState();
            
            // Ensure network visualization is properly initialized
            if (this.networkViz) {
                setTimeout(() => {
                    if (!this.networkViz.initialized || !this.networkViz.svg) {
                        this.networkViz.reinitialize();
                    }
                }, 1500);
            }
        }, 1000); // Increased delay to ensure everything is ready
        
        // Add a periodic check to ensure NetworkVisualizer is working when on network view
        setInterval(() => {
            if (this.currentView === 'network' && this.networkViz) {
                // If we're on the network view but visualization isn't working, try to fix it
                if (this.networkViz.nodes.length === 0) {
                    this.networkViz.generateSampleData();
                    this.networkViz.render();
                }
                
                // Check if container is properly set up
                if (!this.networkViz.isProperlySetUp()) {
                    this.networkViz.forceRender();
                }
            }
        }, 3000); // Check every 3 seconds
    }
    
    // Register service worker for PWA support
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('Service Worker registered with scope:', registration.scope);
                    })
                    .catch(error => {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        }
    }
    
    async init() {
        // This is kept for backward compatibility but now just calls initializeApp
        await this.initializeApp();
    }
    
    async connectToServer() {
        try {
            await this.ws.connect(BackendConfig.getBackendUrl());
            
            // Set up reconnection logic
            this.ws.on('disconnected', (reason) => {
                this.isConnected = false;
                
                // Only attempt reconnection for unexpected disconnections
                if (reason !== 'io client disconnect') {
                    this.attemptReconnect();
                }
            });
            
            this.ws.on('error', (error) => {
                this.attemptReconnect();
            });
        } catch (error) {
            this.attemptReconnect();
        }
    }
    
    // Method to fetch real AI agents data
    fetchRealAIAgents() {
        // Request topology data from the server
        if (this.ws && this.ws.connected) {
            this.ws.send('get-topology-data');
        } else {
            // In a real implementation, this would fetch data from the backend
            // For now, we'll generate sample data
            this.generateSampleSystemState();
            
            // If we have a network visualizer, update it with the new data
            if (this.networkViz) {
                this.networkViz.update(this.systemState);
            }
        }
    }
    
    // Method to manually initialize or reinitialize the NetworkVisualizer
    initNetworkVisualizer() {
        if (this.networkViz) {
            this.networkViz.reinitialize();
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            setTimeout(() => {
                this.connectToServer();
            }, 3000 * this.reconnectAttempts); // Exponential backoff
        } else {
            this.showConnectionError();
        }
    }
    
    showConnectionError() {
        // Create an error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'connection-error';
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 15px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong>❌ Connection Error</strong>
                <p>Could not connect to the AI server. Please make sure the server is running.</p>
                <button onclick="this.parentElement.remove()" style="background: white; color: #ef4444; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;">Dismiss</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
    
    setupEventListeners() {
        // 导航切换
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
        
        // 布局控制
        document.getElementById('layout-circular')?.addEventListener('click', () => {
            if (this.networkViz && this.networkViz.svg) {
                this.networkViz.setLayout('circular');
            }
        });
        
        document.getElementById('layout-hierarchical')?.addEventListener('click', () => {
            if (this.networkViz && this.networkViz.svg) {
                this.networkViz.setLayout('hierarchical');
            }
        });
        
        // Add refresh button for topology
        document.getElementById('refresh-topology')?.addEventListener('click', () => {
            this.fetchRealAIAgents();
            this.updateCurrentView();
        });
        
        // 控制滑块
        document.getElementById('node-size')?.addEventListener('input', (e) => {
            if (this.networkViz && this.networkViz.svg) {
                this.networkViz.setNodeSize(e.target.value);
            }
        });
        
        document.getElementById('link-strength')?.addEventListener('input', (e) => {
            if (this.networkViz && this.networkViz.svg) {
                this.networkViz.setLinkStrength(e.target.value);
            }
        });
        
        // Add window resize listener to handle network visualization resizing
        window.addEventListener('resize', () => {
            if (this.currentView === 'network' && this.networkViz) {
                // Small delay to ensure DOM has updated
                setTimeout(() => {
                    this.networkViz.resize();
                }, 100);
            }
        });
    }
    
    setupWebSocketHandlers() {
        this.ws.on('connected', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('online');
            
            // Request initial topology data
            this.ws.send('get-topology-data');
        });
        
        this.ws.on('disconnected', (reason) => {
            this.isConnected = false;
            this.updateConnectionStatus('offline');
        });
        
        this.ws.on('error', (error) => {
            this.isConnected = false;
            this.updateConnectionStatus('error');
        });
        
        this.ws.on('ai-system-status', (data) => {
            this.updateSystemStatus(data);
        });
        
        this.ws.on('agent-update', (data) => {
            this.updateAgent(data);
        });
        
        this.ws.on('task-update', (data) => {
            this.updateTask(data);
        });
        
        this.ws.on('collaboration-update', (data) => {
            this.updateCollaboration(data);
        });
        
        this.ws.on('topology-update', (data) => {
            this.updateTopology(data);
        });
        
        // Add missing handler for network-topology-update event
        this.ws.on('network-topology-update', (data) => {
            this.updateTopology(data);
        });
        
        this.ws.on('tcf-update', (data) => {
            this.updateTCF(data);
        });
        
        this.ws.on('task-chain-execution-step', (data) => {
            this.handleTaskChainExecutionStep(data);
        });
        
        this.ws.on('task-chain-completed', (data) => {
            this.handleTaskChainCompleted(data);
        });
        
        this.ws.on('prof-smoot-allocation', (data) => {
            this.handleProfSmootAllocation(data);
        });
        
        this.ws.on('fallback-allocation', (data) => {
            this.handleFallbackAllocation(data);
        });
        
        // Add demo mode handler
        this.ws.on('demo-mode-activated', () => {
            this.updateConnectionStatus('demo');
            // Show demo mode notification
            const demoNotification = document.createElement('div');
            demoNotification.className = 'demo-notification';
            demoNotification.innerHTML = `
                <div style="position: fixed; top: 20px; right: 20px; background: #8b5cf6; color: white; padding: 15px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <strong>🎮 Demo Mode Active</strong>
                    <p>Running in demo mode with simulated data.</p>
                    <button onclick="this.parentElement.remove()" style="background: white; color: #8b5cf6; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px;">Dismiss</button>
                </div>
            `;
            document.body.appendChild(demoNotification);
        });
    }
    
    handleProfSmootAllocation(data) {
        // Update UI to show Prof. Smoot's task allocation
        if (this.taskManager) {
            this.taskManager.updateTaskAllocation(data, 'prof-smoot');
        }
    }
    
    handleFallbackAllocation(data) {
        // Update UI to show fallback task allocation
        if (this.taskManager) {
            this.taskManager.updateTaskAllocation(data, 'fallback');
        }
    }
    
    handleTaskChainExecutionStep(data) {
        // Store the execution step data for visualization
        if (!this.systemState.taskChainSteps) {
            this.systemState.taskChainSteps = new Map();
        }
        
        if (!this.systemState.taskChainSteps.has(data.taskChainId)) {
            this.systemState.taskChainSteps.set(data.taskChainId, []);
        }
        
        this.systemState.taskChainSteps.get(data.taskChainId).push(data);
        
        // Update visualization if we're on the tasks view
        if (this.currentView === 'tasks') {
            this.updateTaskChainVisualization(data.taskChainId);
        }
        
        // Also update the network visualization if we're on the network view
        if (this.currentView === 'network' && this.networkViz) {
            this.networkViz.highlightExecutionStep(data);
        }
    }
    
    handleTaskChainCompleted(data) {
        // Store the completed task chain data
        this.systemState.taskChains.set(data.chainId, data);
        
        // Store execution steps if they're included in the data
        if (data.executionSteps && !this.systemState.taskChainSteps) {
            this.systemState.taskChainSteps = new Map();
        }
        
        if (data.executionSteps) {
            this.systemState.taskChainSteps.set(data.chainId, data.executionSteps);
        }
        
        // Update visualization if we're on the tasks view
        if (this.currentView === 'tasks') {
            this.updateTaskChainVisualization(data.chainId);
        }
        
        // Save the network topology for this completed task
        if (this.networkViz) {
            const executionSteps = data.executionSteps || 
                                  (this.systemState.taskChainSteps?.get(data.chainId) || []);
            
            this.networkViz.updateWithTaskChain({
                id: data.chainId,
                executionPath: executionSteps,
                metrics: data.metrics || {}
            });
        }
    }
    
    updateTaskChainVisualization(taskChainId) {
        // Show the task chain visualization section
        const vizSection = document.getElementById('task-chain-visualization-section');
        if (vizSection) {
            vizSection.style.display = 'block';
        }
        
        // Get task chain data
        const taskChain = this.systemState.taskChains.get(taskChainId);
        const executionSteps = this.systemState.taskChainSteps?.get(taskChainId) || [];
        
        if (taskChain || executionSteps.length > 0) {
            // Prepare data for visualization
            const vizData = {
                id: taskChainId,
                executionPath: executionSteps,
                tasks: taskChain?.results || [],
                metrics: taskChain?.metrics || {}
            };
            
            // Update the task chain visualizer
            if (this.taskChainViz) {
                this.taskChainViz.updateTaskChain(vizData);
            }
            
            // Update task chain details
            this.updateTaskChainDetails(vizData);
            
            // Also update the network visualization if we're on the network view
            if (this.currentView === 'network' && this.networkViz) {
                this.networkViz.updateWithTaskChain(vizData);
            }
        }
    }
    
    updateTaskChainDetails(vizData) {
        const detailsContainer = document.getElementById('task-chain-info');
        if (!detailsContainer) return;
        
        const taskCount = vizData.executionPath.length;
        const agentCount = new Set(vizData.executionPath.map(step => step.agentId)).size;
        
        // Group steps by agent for better visualization
        const agentSteps = new Map();
        vizData.executionPath.forEach(step => {
            if (!agentSteps.has(step.agentId)) {
                agentSteps.set(step.agentId, []);
            }
            agentSteps.get(step.agentId).push(step);
        });
        
        // Add a button to view the network topology for this task
        detailsContainer.innerHTML = `
            <div class="task-chain-summary">
                <p><strong>Task Chain ID:</strong> ${vizData.id.substring(0, 8)}...</p>
                <p><strong>Total Steps:</strong> ${taskCount}</p>
                <p><strong>Unique Agents:</strong> ${agentCount}</p>
                ${vizData.metrics && Object.keys(vizData.metrics).length > 0 ? `
                <p><strong>Success Rate:</strong> ${(vizData.metrics.successRate * 100).toFixed(1)}%</p>
                <p><strong>Execution Time:</strong> ${vizData.metrics.executionTime}ms</p>
                ` : ''}
                <button id="view-topology-btn" class="btn btn-primary" style="margin-top: 10px;">View Network Topology</button>
            </div>
            <div class="execution-steps">
                <h5>Execution Steps by Agent:</h5>
                ${Array.from(agentSteps.entries()).map(([agentId, steps]) => `
                    <div class="agent-step-group">
                        <h6>Agent: ${steps[0].agentDetails ? steps[0].agentDetails[0].name : agentId.substring(0, 8)}...</h6>
                        <ul>
                            ${steps.map(step => `
                                <li>${step.taskName || `Task ${step.taskId.substring(0, 8)}...`} at ${new Date(step.timestamp).toLocaleTimeString()}</li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add event listener to the view topology button
        const viewTopologyBtn = document.getElementById('view-topology-btn');
        if (viewTopologyBtn) {
            viewTopologyBtn.addEventListener('click', () => {
                this.switchView('network');
                // Display the saved topology for this task chain
                setTimeout(() => {
                    if (this.networkViz) {
                        this.networkViz.displaySavedTopology(vizData.id);
                    }
                }, 100);
            });
        }
    }
    
    refreshTaskChainVisualization() {
        // Re-initialize the visualization
        if (this.taskChainViz) {
            this.taskChainViz.init();
        }
        
        // Update with current data
        const taskChainIds = Array.from(this.systemState.taskChains.keys());
        if (taskChainIds.length > 0) {
            const latestChainId = taskChainIds[taskChainIds.length - 1];
            this.updateTaskChainVisualization(latestChainId);
        }
    }
    
    clearTaskChainVisualization() {
        // Hide the visualization section
        const vizSection = document.getElementById('task-chain-visualization-section');
        if (vizSection) {
            vizSection.style.display = 'none';
        }
        
        // Clear the task chain visualizer
        if (this.taskChainViz) {
            this.taskChainViz.clear();
        }
        
        // Clear task chain details
        const detailsContainer = document.getElementById('task-chain-info');
        if (detailsContainer) {
            detailsContainer.innerHTML = '';
        }
    }
    
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.className = `status-${status}`;
            statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }
        
        // Update connection status in header
        const headerStatus = document.querySelector('.header .status-indicator');
        if (headerStatus) {
            headerStatus.className = 'status-indicator ' + status;
        }
    }
    
    updateSystemStatus(data) {
        // Update system metrics
        this.systemState.metrics = data;
        
        // Update UI components
        if (this.systemMonitor) {
            this.systemMonitor.updateMetrics(data);
        }
    }
    
    updateAgent(agentData) {
        // Update agent in system state
        this.systemState.agents.set(agentData.id, agentData);
        
        // Update UI components
        this.updateAgentList();
        if (this.networkViz) {
            this.networkViz.updateAgent(agentData);
        }
    }
    
    updateTask(taskData) {
        // Update task in system state
        this.systemState.tasks.set(taskData.id, taskData);
        
        // Update UI components
        if (this.taskManager) {
            this.taskManager.updateTask(taskData);
        }
    }
    
    updateCollaboration(collaborationData) {
        // Update collaboration in system state
        this.systemState.collaborationSessions.set(collaborationData.id, collaborationData);
        
        // Update UI components
        if (this.collaborationMonitor) {
            this.collaborationMonitor.updateSession(collaborationData);
        }
    }
    
    updateTopology(topologyData) {
        // Update network visualization
        if (this.networkViz) {
            this.networkViz.updateTopology(topologyData);
        }
    }
    
    updateTCF(tcfData) {
        // Update TCF visualization
        if (this.tcfViz) {
            this.tcfViz.update(tcfData);
        }
    }
    
    updateAgentList() {
        // Update the agent list in the UI
        const agentListContainer = document.getElementById('agent-list');
        if (!agentListContainer) return;
        
        const agents = Array.from(this.systemState.agents.values());
        agentListContainer.innerHTML = agents.map(agent => `
            <div class="agent-card" data-agent-id="${agent.id}">
                <div class="agent-header">
                    <h4>${agent.name}</h4>
                    <span class="agent-type">${agent.type}</span>
                </div>
                <div class="agent-status">
                    <span class="status-indicator ${agent.status}"></span>
                    <span>${agent.status}</span>
                </div>
                <div class="agent-energy">
                    <div class="energy-bar">
                        <div class="energy-fill" style="width: ${agent.energy}%"></div>
                    </div>
                    <span>${agent.energy}/${agent.maxEnergy}</span>
                </div>
                <div class="agent-capabilities">
                    ${agent.capabilities.slice(0, 3).map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }
    
    updateSystemMetrics() {
        // Update system metrics display
        const metricsContainer = document.getElementById('system-metrics');
        if (!metricsContainer) return;
        
        const metrics = this.systemState.metrics;
        if (!metrics) return;
        
        metricsContainer.innerHTML = `
            <div class="metric-card">
                <h4>Active Agents</h4>
                <span class="metric-value">${metrics.totalAIAgents || 0}</span>
            </div>
            <div class="metric-card">
                <h4>Active Collaborations</h4>
                <span class="metric-value">${metrics.activeCollaborations || 0}</span>
            </div>
            <div class="metric-card">
                <h4>Total Tasks</h4>
                <span class="metric-value">${metrics.totalTasks || 0}</span>
            </div>
            <div class="metric-card">
                <h4>Connected Clients</h4>
                <span class="metric-value">${metrics.connectedClients || 0}</span>
            </div>
        `;
    }
    
    generateSampleSystemState() {
        // Generate sample data for initial display
        
        // Sample agents
        const sampleAgents = [
            {
                id: 'agent-1',
                name: 'Prof. Smoot',
                type: 'cosmic_structure_expert',
                status: 'active',
                energy: 95,
                maxEnergy: 100,
                position: { x: 0, y: 0, z: 0 },
                connections: ['agent-2', 'agent-3'],
                ai: {
                    focusLevel: 0.9,
                    memoryLoad: { shortTerm: 5, longTerm: 42 },
                    currentThought: 'Analyzing cosmic structure patterns...'
                },
                capabilities: ['cosmic_structure_analysis', 'gravitational_field_modeling'],
                personality: { traits: ['analytical', 'methodical', 'precise'] }
            },
            {
                id: 'agent-2',
                name: 'Dr. Analyzer',
                type: 'analyzer',
                status: 'processing',
                energy: 87,
                maxEnergy: 100,
                position: { x: 100, y: 50, z: 20 },
                connections: ['agent-1', 'agent-4'],
                ai: {
                    focusLevel: 0.7,
                    memoryLoad: { shortTerm: 8, longTerm: 36 },
                    currentThought: 'Processing data patterns...'
                },
                capabilities: ['deep_analysis', 'pattern_recognition'],
                personality: { traits: ['analytical', 'detail-oriented', 'systematic'] }
            },
            {
                id: 'agent-3',
                name: 'Ms. Synthesizer',
                type: 'synthesizer',
                status: 'active',
                energy: 92,
                maxEnergy: 100,
                position: { x: -100, y: 75, z: -30 },
                connections: ['agent-1', 'agent-5'],
                ai: {
                    focusLevel: 0.8,
                    memoryLoad: { shortTerm: 3, longTerm: 28 },
                    currentThought: 'Synthesizing knowledge domains...'
                },
                capabilities: ['information_synthesis', 'knowledge_integration'],
                personality: { traits: ['creative', 'integrative', 'holistic'] }
            }
        ];
        
        // Add sample agents to system state
        sampleAgents.forEach(agent => {
            this.systemState.agents.set(agent.id, agent);
        });
        
        // Update UI
        this.updateAgentList();
        this.updateSystemMetrics();
        
        // Update network visualization
        if (this.networkViz) {
            this.networkViz.updateWithAgents(sampleAgents);
        }
    }
    
    initializeComponents() {
        // Initialize all visualization components except NetworkVisualizer (handled on demand)
        if (this.tcfViz) {
            try {
                this.tcfViz.init();
            } catch (error) {
            }
        }
        
        if (this.taskChainViz) {
            try {
                this.taskChainViz.init();
            } catch (error) {
            }
        }
        
        if (this.collaborationMonitor) {
            try {
                this.collaborationMonitor.init();
            } catch (error) {
            }
        }
        
        if (this.taskManager) {
            try {
                this.taskManager.init();
            } catch (error) {
            }
        }
        
        if (this.systemMonitor) {
            try {
                this.systemMonitor.init();
            } catch (error) {
            }
        }
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });
        
        // Show/hide sections
        document.querySelectorAll('.view').forEach(section => {
            section.style.display = 'none';
        });
        
        const targetSection = document.getElementById(view);
        if (targetSection) {
            targetSection.style.display = 'block';
            
            // Add a small delay before updating the view to ensure DOM is ready
            setTimeout(() => {
                // Update visualization for the current view
                this.updateCurrentView();
                
                // Special handling for network view to ensure visualization appears
                if (view === 'network') {
                    // Create NetworkVisualizer if it doesn't exist
                    if (!this.networkViz) {
                        try {
                            this.networkViz = new NetworkVisualizer('#network-graph');
                        } catch (error) {
                            this.networkViz = null;
                        }
                    }
                    
                    // Ensure container is visible
                    const container = document.getElementById('network-graph');
                    if (container) {
                        container.style.display = 'block';
                        container.style.visibility = 'visible';
                    }
                    
                    // Initialize or update the NetworkVisualizer
                    if (this.networkViz) {
                        // Initialize NetworkVisualizer when DOM is ready
                        setTimeout(() => {
                            if (this.networkViz) {
                                this.networkViz.initWhenReady(30, 300); // More retries with longer delay
                                
                                // Update with current system state after a delay
                                setTimeout(() => {
                                    this.networkViz.update(this.systemState);
                                    
                                    // Generate sample data if no data exists
                                    if (this.networkViz.nodes.length === 0) {
                                        this.networkViz.generateSampleData();
                                        this.networkViz.render();
                                    }
                                }, 1000);
                            }
                        }, 500); // Delay to ensure DOM is ready
                    }
                }
            }, 150); // Increased delay to ensure DOM is ready
        }
    }
    
    updateCurrentView() {
        try {
            switch (this.currentView) {
                case 'network':
                    // Create NetworkVisualizer if it doesn't exist
                    if (!this.networkViz) {
                        try {
                            this.networkViz = new NetworkVisualizer('#network-graph');
                        } catch (error) {
                            this.networkViz = null;
                        }
                    }
                    
                    // Update network visualization
                    if (this.networkViz) {
                        // Ensure the NetworkVisualizer is properly initialized
                        if (!this.networkViz.initialized || !this.networkViz.svg) {
                            this.networkViz.initWhenReady(15, 150);
                            
                            // Wait a bit and then update
                            setTimeout(() => {
                                this.networkViz.update(this.systemState);
                                
                                // Generate sample data if no data exists
                                if (this.networkViz.nodes.length === 0) {
                                    this.networkViz.generateSampleData();
                                    this.networkViz.render();
                                }
                                
                                // Ensure visibility
                                const container = document.getElementById('network-graph');
                                if (container) {
                                    container.style.display = 'block';
                                    container.style.visibility = 'visible';
                                }
                            }, 800);
                        } else {
                            // Update with current system state
                            this.networkViz.update(this.systemState);
                            
                            // Generate sample data if no data exists
                            if (this.networkViz.nodes.length === 0) {
                                this.networkViz.generateSampleData();
                                this.networkViz.render();
                            }
                            
                            // Ensure visibility
                            const container = document.getElementById('network-graph');
                            if (container) {
                                container.style.display = 'block';
                                container.style.visibility = 'visible';
                            }
                            
                            // Ensure SVG is visible
                            if (this.networkViz.svg) {
                                this.networkViz.svg.style('display', 'block');
                                this.networkViz.svg.style('visibility', 'visible');
                            }
                        }
                    }
                    break;
                    
                case 'collaboration':
                    if (this.collaborationMonitor) {
                        this.collaborationMonitor.update();
                    }
                    break;
                    
                case 'monitoring':
                    if (this.systemMonitor) {
                        this.systemMonitor.update();
                    }
                    break;
            }
        } catch (error) {
        }
    }

}

// Create the application instance when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new CosmicAgentApp();
    } catch (error) {
    }
});