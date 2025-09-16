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
        this.networkViz = new NetworkVisualizer('#network-graph');
        this.tcfViz = new TCFVisualizer('#tcf-visualization');
        this.taskChainViz = new TaskChainVisualizer('#task-chain-graph');
        this.collaborationMonitor = new CollaborationMonitor();
        this.taskManager = new TaskManager();
        this.systemMonitor = new SystemMonitor();
        
        // 系统状态
        this.systemState = {
            agents: new Map(),
            tasks: new Map(),
            taskChains: new Map(),
            collaborationSessions: new Map(),
            metrics: {}
        };
        
        this.init();
    }
    
    async init() {
        // Make the app instance globally accessible
        window.cosmicApp = this;
        
        this.setupEventListeners();
        this.setupWebSocketHandlers();
        this.initializeComponents();
        
        // Connect to the real AI backend on port 8080
        await this.connectToServer();
        
        // Start data polling
        this.startDataPolling();
        
        // Generate sample data for demonstration initially
        this.generateSampleSystemState();
        
        console.log('🌌 Cosmic Agent Network initialized and connected to Real AI backend');
    }
    
    async connectToServer() {
        try {
            console.log('🔄 Attempting to connect to Real AI Server...');
            await this.ws.connect(BackendConfig.getBackendUrl());
            
            // Set up reconnection logic
            this.ws.on('disconnected', (reason) => {
                this.isConnected = false;
                console.log('❌ Disconnected from server:', reason);
                
                // Only attempt reconnection for unexpected disconnections
                if (reason !== 'io client disconnect') {
                    this.attemptReconnect();
                }
            });
            
            this.ws.on('error', (error) => {
                console.error('❌ Connection error:', error);
                this.attemptReconnect();
            });
        } catch (error) {
            console.error('❌ Failed to connect to server:', error);
            this.attemptReconnect();
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connectToServer();
            }, 3000 * this.reconnectAttempts); // Exponential backoff
        } else {
            console.error('❌ Maximum reconnection attempts reached');
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
        document.getElementById('layout-force')?.addEventListener('click', () => {
            if (this.networkViz && this.networkViz.svg) {
                this.networkViz.setLayout('force');
            }
        });
        
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
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Refresh Topology';
        refreshBtn.className = 'btn';
        refreshBtn.style.marginLeft = '20px';
        refreshBtn.addEventListener('click', () => {
            console.log('🔄 Manual topology refresh triggered');
            this.fetchRealAIAgents();
            this.updateCurrentView();
        });
        
        const topologyControls = document.querySelector('#network .controls');
        if (topologyControls) {
            topologyControls.appendChild(refreshBtn);
        }
        
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
        
        // Task Chain Visualization Controls
        document.getElementById('refresh-task-chain')?.addEventListener('click', () => {
            this.refreshTaskChainVisualization();
        });
        
        document.getElementById('clear-task-chain')?.addEventListener('click', () => {
            this.clearTaskChainVisualization();
        });
    }
    
    setupWebSocketHandlers() {
        this.ws.on('connected', () => {
            console.log('✅ Connected to Real AI Server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('online');
        });
        
        this.ws.on('disconnected', (reason) => {
            console.log('❌ Disconnected from server:', reason);
            this.isConnected = false;
            this.updateConnectionStatus('offline');
        });
        
        this.ws.on('error', (error) => {
            console.error('❌ Connection error:', error);
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
    }
    
    handleProfSmootAllocation(data) {
        console.log('🎯 Prof. Smoot Allocation:', data);
        // Update UI to show Prof. Smoot's task allocation
        if (this.taskManager) {
            this.taskManager.updateTaskAllocation(data, 'prof-smoot');
        }
    }
    
    handleFallbackAllocation(data) {
        console.log('🔄 Fallback Allocation:', data);
        // Update UI to show fallback task allocation
        if (this.taskManager) {
            this.taskManager.updateTaskAllocation(data, 'fallback');
        }
    }
    
    handleTaskChainExecutionStep(data) {
        console.log('Task chain execution step:', data);
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
        console.log('Task chain completed:', data);
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
        console.log('Updating task chain visualization for:', taskChainId);
        
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
        console.log('Refreshing task chain visualization');
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
        console.log('Clearing task chain visualization');
        
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
    }
    
    updateSystemStatus(data) {
        console.log('System status update:', data);
        // Update system metrics
        this.systemState.metrics = data;
        
        // Update UI components
        if (this.systemMonitor) {
            this.systemMonitor.updateMetrics(data);
        }
    }
    
    updateAgent(agentData) {
        console.log('Agent update:', agentData);
        // Update agent in system state
        this.systemState.agents.set(agentData.id, agentData);
        
        // Update UI components
        this.updateAgentList();
        if (this.networkViz) {
            this.networkViz.updateAgent(agentData);
        }
    }
    
    updateTask(taskData) {
        console.log('Task update:', taskData);
        // Update task in system state
        this.systemState.tasks.set(taskData.id, taskData);
        
        // Update UI components
        if (this.taskManager) {
            this.taskManager.updateTask(taskData);
        }
    }
    
    updateCollaboration(collaborationData) {
        console.log('Collaboration update:', collaborationData);
        // Update collaboration in system state
        this.systemState.collaborationSessions.set(collaborationData.id, collaborationData);
        
        // Update UI components
        if (this.collaborationMonitor) {
            this.collaborationMonitor.updateSession(collaborationData);
        }
    }
    
    updateTopology(topologyData) {
        console.log('Topology update:', topologyData);
        // Update network visualization
        if (this.networkViz) {
            this.networkViz.updateTopology(topologyData);
        }
    }
    
    updateTCF(tcfData) {
        console.log('TCF update:', tcfData);
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
        console.log('Generating sample system state');
        
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
        // Initialize all visualization components
        if (this.networkViz) {
            this.networkViz.init();
        }
        
        if (this.tcfViz) {
            this.tcfViz.init();
        }
        
        if (this.taskChainViz) {
            this.taskChainViz.init();
        }
        
        if (this.collaborationMonitor) {
            this.collaborationMonitor.init();
        }
        
        if (this.taskManager) {
            this.taskManager.init();
        }
        
        if (this.systemMonitor) {
            this.systemMonitor.init();
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
        document.querySelectorAll('.view-section').forEach(section => {
            section.style.display = 'none';
        });
        
        const targetSection = document.getElementById(view);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Update visualization for the current view
        this.updateCurrentView();
    }
    
    updateCurrentView() {
        switch (this.currentView) {
            case 'network':
                if (this.networkViz) {
                    this.networkViz.resize();
                }
                break;
            case 'tcf':
                if (this.tcfViz) {
                    this.tcfViz.resize();
                }
                break;
            case 'tasks':
                if (this.taskChainViz) {
                    this.taskChainViz.resize();
                }
                break;
        }
    }
    
    startDataPolling() {
        // Start periodic data updates
        setInterval(() => {
            if (this.isConnected) {
                // Request updated system status
                this.ws.send('get-ai-status');
            }
        }, 30000); // Every 30 seconds
    }
    
    fetchRealAIAgents() {
        // Fetch real AI agents from the server
        if (this.isConnected) {
            this.ws.send('get-ai-agents');
        }
    }
}