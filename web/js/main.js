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
        
        // Comment out automatic fetching of real AI agents
        // this.fetchRealAIAgents();
        
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
                console.error('❌ WebSocket error:', error);
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
        
        // 任务管理
        document.getElementById('create-task')?.addEventListener('click', () => {
            this.showTaskModal();
        });
        
        // 模态框
        document.getElementById('cancel-task')?.addEventListener('click', () => {
            this.hideTaskModal();
        });
        
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.hideTaskModal();
        });
        
        // 任务表单
        document.getElementById('task-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTask();
        });
        
        // 优先级滑块
        document.getElementById('task-priority')?.addEventListener('input', (e) => {
            const priorityValue = document.getElementById('priority-value');
            if (priorityValue) {
                priorityValue.textContent = e.target.value;
            }
        });

    }
    
    setupWebSocketHandlers() {
        this.ws.on('connected', () => {
            console.log('✅ WebSocket connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
            // Request initial data when connected
            this.ws.send('get-ai-status');
        });
        
        this.ws.on('ai-system-status', (data) => {
            console.log('Received AI system status:', data);
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
        
        // Clear the visualizer
        if (this.taskChainViz) {
            this.taskChainViz.clear();
        }
        
        // Clear details
        const detailsContainer = document.getElementById('task-chain-info');
        if (detailsContainer) {
            detailsContainer.innerHTML = '';
        }
    }
    
    initializeComponents() {
        console.log('Initializing components...');
        
        // 初始化可视化组件
        console.log('Initializing NetworkVisualizer...');
        this.networkViz.init();
        
        console.log('Initializing TCFVisualizer...');
        this.tcfViz.init();
        
        console.log('Initializing MonitoringComponents...');
        this.collaborationMonitor.init();
        this.taskManager.init();
        this.systemMonitor.init();
        
        // 初始化拓扑可视化
        this.initTopologyVisualization();
        
        console.log('All components initialized');
    }

    initTopologyVisualization() {
        const container = document.getElementById('topology-visualization');
        if (!container) return;
        
        // 创建简单的拓扑图
        const svg = d3.select(container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%');
        
        // 添加背景
        svg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'rgba(0,0,0,0.2)');
        
        // 添加标题
        svg.append('text')
            .attr('x', '50%')
            .attr('y', '50%')
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(255,255,255,0.5)')
            .text('拓扑结构视图');
    }
    
    switchView(viewName) {
        console.log('Switching to view:', viewName);
        
        // 隐藏所有视图
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // 移除所有导航按钮的活跃状态
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 显示目标视图
        const targetView = document.getElementById(viewName);
        if (targetView) {
            targetView.classList.add('active');
            console.log('View activated:', viewName);
        } else {
            console.error('Target view not found:', viewName);
        }
        
        // 激活对应的导航按钮
        const targetBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
            console.log('Button activated:', viewName);
        } else {
            console.error('Target button not found:', viewName);
        }
        
        this.currentView = viewName;
        
        // 根据视图类型更新组件
        setTimeout(() => {
            this.updateCurrentView();
        }, 100); // Small delay to ensure DOM is updated
    }

    updateCurrentView() {
        console.log('Updating current view:', this.currentView);
        
        switch (this.currentView) {
            case 'ai-overview':
            case 'overview':
                this.updateOverview();
                break;
            case 'network':
                console.log('Updating network view...');
                // Only reinitialize if we don't have a saved topology displayed
                if (this.networkViz && this.networkViz.container) {
                    console.log('Network container found, updating...');
                    // Check if we have a saved topology displayed
                    if (!this.networkViz.hasSavedTopologyDisplayed()) {
                        this.networkViz.update(this.systemState);
                    } else {
                        console.log('Skipping network update - saved topology is displayed');
                    }
                } else {
                    console.log('Re-initializing NetworkVisualizer...');
                    this.networkViz = new NetworkVisualizer('#network-graph');
                    this.networkViz.init();
                }
                break;
            case 'collaboration':
                this.collaborationMonitor.update(this.systemState);
                break;
            case 'tasks':
                this.taskManager.update(this.systemState);
                // Show latest task chain visualization if available
                const taskChainIds = Array.from(this.systemState.taskChains.keys());
                if (taskChainIds.length > 0) {
                    const latestChainId = taskChainIds[taskChainIds.length - 1];
                    this.updateTaskChainVisualization(latestChainId);
                }
                break;
            case 'monitoring':
                this.systemMonitor.update(this.systemState);
                break;
        }
    }
    
    updateOverview() {
        // 更新系统指标
        const agentCount = this.systemState.agents.size;
        const activeTasks = Array.from(this.systemState.tasks.values())
            .filter(task => task.status === 'executing').length;
        
        // Add null checks for all DOM elements
        const agentCountElement = document.getElementById('agent-count');
        if (agentCountElement) {
            agentCountElement.textContent = agentCount;
        }
        
        const activeTasksElement = document.getElementById('active-tasks');
        if (activeTasksElement) {
            activeTasksElement.textContent = activeTasks;
        }
        
        const networkStability = (this.systemState.metrics.networkStability || 0) * 100;
        const collaborationEfficiency = (this.systemState.metrics.collaborationEfficiency || 0) * 100;
        
        const networkStabilityElement = document.getElementById('network-stability');
        if (networkStabilityElement) {
            networkStabilityElement.textContent = `${networkStability.toFixed(1)}%`;
        }
        
        const collaborationEfficiencyElement = document.getElementById('collaboration-efficiency');
        if (collaborationEfficiencyElement) {
            collaborationEfficiencyElement.textContent = `${collaborationEfficiency.toFixed(1)}%`;
        }
        
        // 更新小型可视化
        this.tcfViz.update(this.systemState);
        
        // 更新日志
        this.addLog('info', `系统状态更新: ${agentCount}个Agent在线, ${activeTasks}个活跃任务`);
    }
    
    showTaskModal() {
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    hideTaskModal() {
        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        // 清空表单 - add null checks
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.reset();
        }
        
        const priorityValue = document.getElementById('priority-value');
        if (priorityValue) {
            priorityValue.textContent = '5';
        }
    }

    createTask() {
        const taskForm = document.getElementById('task-form');
        if (!taskForm) return;
        
        // 获取选中的能力
        const capabilities = Array.from(document.querySelectorAll('.capabilities input:checked'))
            .map(input => input.value);
        
        const taskData = {
            name: document.getElementById('task-name')?.value || '',
            type: document.getElementById('task-type')?.value || 'analysis',
            collaborationType: document.getElementById('collaboration-type')?.value || 'sequential',
            priority: parseInt(document.getElementById('task-priority')?.value || '5'),
            description: document.getElementById('task-description')?.value || '',
            requiredCapabilities: capabilities
        };
        
        // 发送到后端
        this.ws.send('create-task', taskData);
        
        this.addLog('info', `创建新任务: ${taskData.name}`);
        this.hideTaskModal();
    }
    
    addLog(level, message) {
        const logContainer = document.getElementById('system-logs');
        if (!logContainer) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${level}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // 限制日志条数
        while (logContainer.children.length > 100) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }
    
    startDataPolling() {
        // 定期请求系统状态 - reduced frequency to prevent excessive updates
        setInterval(() => {
            if (this.ws.connected) {
                this.ws.send('get-system-status');
            }
        }, 10000); // Changed from 2000ms to 10000ms
        
        // 定期更新当前视图，但避免频繁更新网络视图
        setInterval(() => {
            // Only update network view if we're actually on the network view
            if (this.currentView === 'network') {
                // For network view, only update if we don't have a saved topology displayed
                if (this.networkViz && !this.networkViz.hasSavedTopologyDisplayed()) {
                    this.updateCurrentView();
                }
            } else {
                // For other views, update normally but less frequently
                if (this.currentView !== 'network') {
                    this.updateCurrentView();
                }
            }
        }, 5000); // Changed from 1000ms to 5000ms
    }
    
    updateSystemStatus(data) {
        this.systemState.metrics = data.metrics || {};
        
        if (this.currentView === 'ai-overview' || this.currentView === 'overview') {
            this.updateOverview();
        }
    }
    
    updateAgent(data) {
        this.systemState.agents.set(data.agentId, data);
    }
    
    updateTask(data) {
        this.systemState.tasks.set(data.taskId, data);
    }
    
    updateCollaboration(data) {
        this.systemState.collaborationSessions.set(data.sessionId, data);
    }
    
    updateTopology(data) {
        if (this.currentView === 'network') {
            this.networkViz.updateTopology(data);
        }
    }
    
    updateTCF(data) {
        this.tcfViz.updateField(data);
    }
    
    generateSampleSystemState() {
        // Generate sample agents for network topology
        const sampleAgents = new Map([
            ['agent1', { 
                id: 'agent1', 
                name: 'Dr. Analyzer', 
                type: 'analyzer', 
                status: 'online',
                position: { x: 0.3, y: 0.3 },
                capabilities: ['deep_analysis', 'pattern_recognition']
            }],
            ['agent2', { 
                id: 'agent2', 
                name: 'Prof. Reasoner', 
                type: 'reasoner', 
                status: 'busy',
                position: { x: 0.7, y: 0.3 },
                capabilities: ['logical_reasoning', 'inference']
            }],
            ['agent3', { 
                id: 'agent3', 
                name: 'Ms. Synthesizer', 
                type: 'synthesizer', 
                status: 'online',
                position: { x: 0.5, y: 0.7 },
                capabilities: ['information_synthesis', 'knowledge_integration']
            }],
            ['agent4', { 
                id: 'agent4', 
                name: 'Dr. Validator', 
                type: 'validator', 
                status: 'offline',
                position: { x: 0.2, y: 0.6 },
                capabilities: ['result_validation', 'quality_assessment']
            }],
            ['agent5', { 
                id: 'agent5', 
                name: 'Mx. Innovator', 
                type: 'innovator', 
                status: 'online',
                position: { x: 0.8, y: 0.6 },
                capabilities: ['creative_thinking', 'solution_generation']
            }]
        ]);
        
        // Update system state
        this.systemState.agents = sampleAgents;
        
        // Generate sample topology connections
        this.systemState.topology = {
            connections: [
                { source: 'agent1', target: 'agent2', strength: 0.8, type: 'collaboration' },
                { source: 'agent2', target: 'agent3', strength: 0.6, type: 'data_flow' },
                { source: 'agent1', target: 'agent3', strength: 0.4, type: 'coordination' },
                { source: 'agent3', target: 'agent5', strength: 0.7, type: 'collaboration' },
                { source: 'agent4', target: 'agent1', strength: 0.3, type: 'coordination' }
            ]
        };
        
        console.log('📊 Generated sample system state with', sampleAgents.size, 'agents');
        
        // Update visualizations with sample data
        this.updateCurrentView();
    }
    
    async fetchRealAIAgents() {
        try {
            // Use BackendConfig to determine the correct URL
            const backendUrl = BackendConfig.getBackendUrl();
            const response = await fetch(`${backendUrl}/api/ai-status`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 Fetched Real AI agent data:', data);
            
            // Update system state
            this.systemState.agents = data.aiAgents || [];
            this.systemState.collaborations = data.activeCollaborations || 0;
            this.systemState.totalTasks = data.totalCollaborations || 0;
            
            // Update UI
            this.updateAgentList();
            this.updateSystemMetrics();
            
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch Real AI agents:', error);
            
            // Try to connect to WebSocket if we haven't already
            if (!this.ws || !this.ws.connected) {
                this.connectToServer();
            }
            
            // Return demo data if real data fetch fails
            return this.getDemoData();
        }
    }
    
    generateRealTopologyConnections(agentsMap) {
        const agents = Array.from(agentsMap.values());
        const connections = [];
        
        // Create connections based on agent types and capabilities
        for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
                const agent1 = agents[i];
                const agent2 = agents[j];
                
                // Create connections based on complementary capabilities
                let strength = 0.3;
                let type = 'coordination';
                
                if (agent1.type === 'analyzer' && agent2.type === 'synthesizer') {
                    strength = 0.8;
                    type = 'collaboration';
                } else if (agent1.type === 'reasoner' && agent2.type === 'validator') {
                    strength = 0.7;
                    type = 'data_flow';
                } else if (agent1.type === 'innovator') {
                    strength = 0.6;
                    type = 'collaboration';
                }
                
                connections.push({
                    source: agent1.id,
                    target: agent2.id,
                    strength: strength,
                    type: type
                });
            }
        }
        
        this.systemState.topology = { connections };
        console.log('🔗 Generated', connections.length, 'real topology connections');
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CosmicAgentApp();
});