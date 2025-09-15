// Real-time Metrics Dashboard
class MetricsDashboard {
    constructor() {
        this.websocket = null;
        this.metrics = {
            agents: [],
            collaborations: 0,
            tasks: 0,
            performance: {
                convergenceRate: 0,
                avgResponseTime: 0,
                tokenUsage: 0,
                successRate: 100
            },
            system: {
                memory: 0,
                connections: 0,
                uptime: 0
            }
        };
        
        this.charts = new Map();
        this.activityLog = [];
        
        this.initializeDashboard();
        this.connectWebSocket();
        this.startMetricsUpdate();
        
        // Start real-time data simulation for demo purposes
        this.simulateRealtimeUpdates();
    }
    
    initializeDashboard() {
        this.setupEventListeners();
        this.initializeCharts();
        
        // Ensure the first tab is properly activated
        setTimeout(() => {
            const firstTab = document.querySelector('.nav-btn[data-view="ai-overview"]');
            if (firstTab && !firstTab.classList.contains('active')) {
                firstTab.classList.add('active');
            }
            
            const firstView = document.getElementById('ai-overview');
            if (firstView && !firstView.classList.contains('active')) {
                firstView.classList.add('active');
            }
        }, 100);
        
        this.updateDisplay();
    }
    
    setupEventListeners() {
        // Navigation with improved click handling
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const view = e.target.dataset.view;
                if (view) {
                    this.switchView(view);
                }
            });
        });
    }
    
    switchView(viewId) {
        console.log(`Switching to view: ${viewId}`);
        
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show selected view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
            console.log(`Activated view: ${viewId}`);
        } else {
            console.warn(`View not found: ${viewId}`);
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const navBtn = document.querySelector(`[data-view="${viewId}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
            console.log(`Activated nav button for: ${viewId}`);
        } else {
            console.warn(`Nav button not found for: ${viewId}`);
        }
        
        // Add smooth transition effect
        if (targetView) {
            targetView.style.animation = 'fadeIn 0.3s ease';
        }
    }
    
    connectWebSocket() {
        console.log('🔄 Connecting to Real AI Server...');
        
        // Try to reuse the main app's WebSocket connection if available
        if (window.app && window.app.ws && window.app.ws.socket) {
            console.log('🔗 Reusing main app WebSocket connection in metrics dashboard');
            this.websocket = window.app.ws;
            this.setupWebSocketHandlers();
        } else {
            console.log('🔗 Creating new WebSocket connection for metrics dashboard');
            // Use Socket.IO instead of native WebSocket for compatibility with the backend
            this.websocket = io(BackendConfig.getBackendUrl());
            
            this.websocket.on('connect', () => {
                console.log('📡 Connected to Real AI WebSocket');
                this.addActivity('Connected to AI system', 'success');
                this.requestSystemStatus();
            });
            
            this.websocket.on('ai-system-status', (data) => {
                this.updateSystemMetrics(data);
            });
            
            this.websocket.on('ai-collaboration-update', (data) => {
                this.updateCollaborationMetrics(data);
            });
            
            this.websocket.on('ai-agent-update', (data) => {
                this.updateAgentMetrics(data);
            });
            
            this.websocket.on('demo-collaboration-completed', (data) => {
                this.handleCollaborationComplete(data);
            });
            
            this.websocket.on('network-topology-update', (data) => {
                this.updateNetworkTopology(data);
            });
            
            this.websocket.on('performance-metrics', (data) => {
                this.updatePerformanceMetrics(data);
            });
            
            this.websocket.on('collaboration-view-update', (data) => {
                this.updateCollaborationViewMetrics(data);
            });
            
            this.websocket.on('disconnect', () => {
                console.log('❌ Disconnected from AI WebSocket');
                this.addActivity('Disconnected from AI system', 'error');
            });
            
            this.websocket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                this.addActivity('WebSocket connection error', 'error');
            });
        }
    }
    
    setupWebSocketHandlers() {
        // Only setup handlers if we're using the main app's connection
        if (window.app && window.app.ws) {
            // Listen for events through the main WebSocketClient wrapper
            window.app.ws.on('ai-system-status', (data) => {
                this.updateSystemMetrics(data);
            });
            
            window.app.ws.on('ai-collaboration-update', (data) => {
                this.updateCollaborationMetrics(data);
            });
            
            window.app.ws.on('ai-agent-update', (data) => {
                this.updateAgentMetrics(data);
            });
            
            window.app.ws.on('demo-collaboration-completed', (data) => {
                this.handleCollaborationComplete(data);
            });
            
            window.app.ws.on('network-topology-update', (data) => {
                this.updateNetworkTopology(data);
            });
            
            window.app.ws.on('performance-metrics', (data) => {
                this.updatePerformanceMetrics(data);
            });
            
            window.app.ws.on('collaboration-view-update', (data) => {
                this.updateCollaborationViewMetrics(data);
            });
            
            // Request initial system status
            window.app.ws.send('get-ai-status');
        }
    }
    
    requestSystemStatus() {
        if (this.websocket && this.websocket.connected) {
            this.websocket.emit('get-ai-status');
        }
    }
    
    updateSystemMetrics(status) {
        // Update basic metrics
        this.metrics.agents = status.aiAgents || [];
        this.metrics.collaborations = status.activeCollaborations || 0;
        this.metrics.tasks = status.totalCollaborations || 0;
        
        // Update system metrics
        if (status.system) {
            this.metrics.system.memory = status.system.memory?.heapUsed || 0;
            this.metrics.system.uptime = status.system.uptime || 0;
        }
        this.metrics.system.connections = status.connectedClients || 0;
        
        // Update API status
        this.updateAPIStatus(status.openaiApiKey);
        
        // Update displays
        this.updateStatusCards();
        this.updateAgentMetricsDisplay();
        this.updateResourceMeters();
        
        this.addActivity(`System status updated: ${this.metrics.agents.length} agents active`, 'info');
    }
    
    updateStatusCards() {
        const totalAgentsEl = document.getElementById('total-agents');
        const activeCollabEl = document.getElementById('active-collaborations');
        const totalTasksEl = document.getElementById('total-tasks');
        
        if (totalAgentsEl) totalAgentsEl.textContent = this.metrics.agents.length;
        if (activeCollabEl) activeCollabEl.textContent = this.metrics.collaborations;
        if (totalTasksEl) totalTasksEl.textContent = this.metrics.tasks;
        
        // Update status indicators
        const agentsStatus = document.getElementById('agents-status');
        const collabStatus = document.getElementById('collab-status');
        
        if (agentsStatus) {
            agentsStatus.className = `status-indicator ${this.metrics.agents.length > 0 ? 'online' : 'offline'}`;
        }
        if (collabStatus) {
            collabStatus.className = `status-indicator ${this.metrics.collaborations > 0 ? 'online' : 'offline'}`;
        }
    }
    
    updateAPIStatus(hasApiKey) {
        const apiStatus = document.getElementById('api-status');
        const apiIndicator = document.getElementById('api-indicator');
        
        if (apiStatus && apiIndicator) {
            if (hasApiKey) {
                apiStatus.textContent = 'Active';
                apiIndicator.className = 'status-indicator success';
            } else {
                apiStatus.textContent = 'No Key';
                apiIndicator.className = 'status-indicator warning';
            }
        }
    }
    
    updateAgentMetricsDisplay() {
        const container = document.getElementById('agent-metrics-container');
        if (!container) return;
        
        container.innerHTML = this.metrics.agents.map(agent => `
            <div class="agent-metric-card">
                <div class="agent-header">
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-type">${agent.type}</div>
                </div>
                
                <div class="agent-metrics">
                    <div class="metric-item">
                        <div class="label">Energy</div>
                        <div class="value">${agent.energy}/${agent.maxEnergy}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Focus</div>
                        <div class="value">${(agent.ai?.focusLevel * 100 || 0).toFixed(0)}%</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Memory</div>
                        <div class="value">${agent.ai?.memoryLoad?.shortTerm || 0}/${agent.ai?.memoryLoad?.longTerm || 0}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Status</div>
                        <div class="value ${agent.status}">${agent.status}</div>
                    </div>
                </div>
                
                ${agent.ai?.currentThought ? `
                    <div class="agent-thinking">
                        "${agent.ai.currentThought}"
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    updateResourceMeters() {
        // Memory usage
        const memoryMB = Math.round(this.metrics.system.memory / 1024 / 1024);
        const memoryPercent = Math.min((memoryMB / 100) * 100, 100);
        
        const memoryBar = document.getElementById('memory-bar');
        const memoryValue = document.getElementById('memory-value');
        
        if (memoryBar) memoryBar.style.width = `${memoryPercent}%`;
        if (memoryValue) memoryValue.textContent = `${memoryMB} MB`;
        
        // Connections
        const connectionsPercent = Math.min((this.metrics.system.connections / 10) * 100, 100);
        const connectionsBar = document.getElementById('connections-bar');
        const connectionsValue = document.getElementById('connections-value');
        
        if (connectionsBar) connectionsBar.style.width = `${connectionsPercent}%`;
        if (connectionsValue) connectionsValue.textContent = this.metrics.system.connections;
        
        // Uptime
        const uptime = this.formatUptime(this.metrics.system.uptime);
        const uptimeValue = document.getElementById('uptime-value');
        if (uptimeValue) uptimeValue.textContent = uptime;
    }
    
    updateCollaborationMetrics(collaboration) {
        this.addActivity(`Collaboration session: ${collaboration.sessionId}`, 'info');
        
        // Update performance metrics if available
        if (collaboration.convergenceMetrics) {
            this.metrics.performance.convergenceRate = (collaboration.convergenceMetrics.finalConsensus * 100) || 0;
            const convergenceEl = document.getElementById('convergence-rate');
            if (convergenceEl) convergenceEl.textContent = `${this.metrics.performance.convergenceRate.toFixed(0)}%`;
        }
        
        if (collaboration.metadata) {
            this.metrics.performance.tokenUsage += collaboration.metadata.tokensUsed || 0;
            const tokenEl = document.getElementById('token-usage');
            if (tokenEl) tokenEl.textContent = this.metrics.performance.tokenUsage;
        }
    }
    
    handleCollaborationComplete(result) {
        this.addActivity(`Collaboration completed: ${result.task.type}`, 'success');
        
        // Update metrics
        this.metrics.tasks++;
        const totalTasksEl = document.getElementById('total-tasks');
        if (totalTasksEl) totalTasksEl.textContent = this.metrics.tasks;
        
        // Update performance data
        if (result.convergenceMetrics?.finalConsensus) {
            this.metrics.performance.convergenceRate = result.convergenceMetrics.finalConsensus * 100;
            const convergenceEl = document.getElementById('convergence-rate');
            if (convergenceEl) convergenceEl.textContent = `${this.metrics.performance.convergenceRate.toFixed(0)}%`;
        }
        
        if (result.metadata?.tokensUsed) {
            this.metrics.performance.tokenUsage += result.metadata.tokensUsed;
            const tokenEl = document.getElementById('token-usage');
            if (tokenEl) tokenEl.textContent = this.metrics.performance.tokenUsage;
        }
        
        // Calculate response time
        if (result.metadata?.totalAgents && result.sessionId) {
            const responseTime = Date.now() - parseInt(result.sessionId.split('_')[0]);
            this.metrics.performance.avgResponseTime = responseTime;
            const responseEl = document.getElementById('avg-response-time');
            if (responseEl) responseEl.textContent = `${responseTime}ms`;
        }
    }
    
    updateNetworkTopology(data) {
        // Update network-specific metrics
        if (data.connections) {
            const networkConnections = document.getElementById('network-connections');
            if (networkConnections) {
                networkConnections.textContent = data.connections;
            }
        }
        
        if (data.stability) {
            const networkStability = document.getElementById('network-stability');
            if (networkStability) {
                networkStability.textContent = `${(data.stability * 100).toFixed(0)}%`;
            }
        }
        
        if (data.throughput) {
            const throughput = document.getElementById('throughput');
            if (throughput) {
                throughput.textContent = `${data.throughput} req/s`;
            }
        }
        
        if (data.clusteringCoefficient) {
            const clusteringCoefficient = document.getElementById('clustering-coefficient');
            if (clusteringCoefficient) {
                clusteringCoefficient.textContent = data.clusteringCoefficient.toFixed(2);
            }
        }
        
        // Update agent positions if provided
        if (data.agents) {
            this.updateAgentPositions(data.agents);
        }
        
        this.addActivity('Network topology updated', 'info');
    }
    
    updatePerformanceMetrics(data) {
        // Update monitoring view metrics
        if (data.cpuUsage) {
            const cpuUsage = document.getElementById('cpu-usage');
            if (cpuUsage) {
                cpuUsage.textContent = `${data.cpuUsage.toFixed(0)}%`;
            }
        }
        
        if (data.memoryUsagePercent) {
            const memoryUsagePercent = document.getElementById('memory-usage-percent');
            if (memoryUsagePercent) {
                memoryUsagePercent.textContent = `${data.memoryUsagePercent.toFixed(0)}%`;
            }
        }
        
        if (data.networkLatency) {
            const networkLatency = document.getElementById('network-latency');
            if (networkLatency) {
                networkLatency.textContent = `${data.networkLatency}ms`;
            }
        }
        
        if (data.processingSpeed) {
            const processingSpeed = document.getElementById('processing-speed');
            if (processingSpeed) {
                processingSpeed.textContent = `${data.processingSpeed} ops/s`;
            }
        }
        
        // Update live response time
        if (data.liveResponseTime) {
            const liveResponseTime = document.getElementById('live-response-time');
            if (liveResponseTime) {
                liveResponseTime.textContent = `${data.liveResponseTime}ms`;
            }
        }
        
        // Update token consumption rate
        if (data.liveTokenRate) {
            const liveTokenRate = document.getElementById('live-token-rate');
            if (liveTokenRate) {
                liveTokenRate.textContent = `${data.liveTokenRate}/min`;
            }
        }
        
        // Update collaboration events
        if (data.collabEvents) {
            const collabEvents = document.getElementById('collab-events');
            if (collabEvents) {
                collabEvents.textContent = data.collabEvents;
            }
        }
        
        // Update agent activity
        if (data.agentActivity) {
            const agentActivity = document.getElementById('agent-activity');
            if (agentActivity) {
                agentActivity.textContent = `${(data.agentActivity * 100).toFixed(0)}%`;
            }
        }
        
        this.addActivity('Performance metrics updated', 'info');
    }
    
    updateCollaborationViewMetrics(data) {
        // Update collaboration-specific view metrics
        if (data.discussionRounds) {
            const discussionRounds = document.getElementById('discussion-rounds');
            if (discussionRounds) {
                discussionRounds.textContent = data.discussionRounds;
            }
        }
        
        if (data.consensusLevel) {
            const consensusLevel = document.getElementById('consensus-level');
            if (consensusLevel) {
                consensusLevel.textContent = `${(data.consensusLevel * 100).toFixed(0)}%`;
            }
        }
        
        if (data.synthesisSpeed) {
            const synthesisSpeed = document.getElementById('synthesis-speed');
            if (synthesisSpeed) {
                synthesisSpeed.textContent = `${data.synthesisSpeed}ms`;
            }
        }
        
        if (data.collaborationStrength) {
            const collaborationStrength = document.getElementById('collaboration-strength');
            if (collaborationStrength) {
                collaborationStrength.textContent = data.collaborationStrength.toFixed(1);
            }
        }
        
        // Update convergence analytics
        if (data.iterationCount) {
            const iterationCount = document.getElementById('iteration-count');
            if (iterationCount) {
                iterationCount.textContent = `${data.iterationCount}/5`;
            }
        }
        
        if (data.confidenceAlignment) {
            const confidenceAlignment = document.getElementById('confidence-alignment');
            if (confidenceAlignment) {
                confidenceAlignment.textContent = `${(data.confidenceAlignment * 100).toFixed(0)}%`;
            }
        }
        
        if (data.ideaDiversity) {
            const ideaDiversity = document.getElementById('idea-diversity');
            if (ideaDiversity) {
                ideaDiversity.textContent = data.ideaDiversity.toFixed(1);
            }
        }
        
        if (data.synthesisQuality) {
            const synthesisQuality = document.getElementById('synthesis-quality');
            if (synthesisQuality) {
                synthesisQuality.textContent = `${(data.synthesisQuality * 100).toFixed(0)}%`;
            }
        }
        
        // Update live sessions
        if (data.liveSessions) {
            this.updateLiveCollaborationSessions(data.liveSessions);
        }
        
        // Update collaboration flow
        if (data.collaborationFlow) {
            this.updateCollaborationFlow(data.collaborationFlow);
        }
    }
    
    updateLiveCollaborationSessions(sessions) {
        const container = document.getElementById('live-collaboration-sessions');
        if (!container) return;
        
        container.innerHTML = sessions.map(session => `
            <div class="agent-metric-card">
                <div class="agent-header">
                    <div class="agent-name">Session ${session.id.substring(0, 8)}</div>
                    <div class="agent-type">${session.status}</div>
                </div>
                
                <div class="agent-metrics">
                    <div class="metric-item">
                        <div class="label">Participants</div>
                        <div class="value">${session.participants}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Progress</div>
                        <div class="value">${session.progress}%</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Duration</div>
                        <div class="value">${session.duration}s</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Consensus</div>
                        <div class="value">${(session.consensus * 100).toFixed(0)}%</div>
                    </div>
                </div>
                
                <div class="agent-thinking">
                    ${session.currentPhase}
                </div>
            </div>
        `).join('');
    }
    
    updateCollaborationFlow(flowItems) {
        const container = document.getElementById('collaboration-flow');
        if (!container) return;
        
        container.innerHTML = flowItems.slice(0, 20).map(item => `
            <div class="activity-item slide-in">
                <div class="activity-icon ${item.type}"></div>
                <div class="activity-content">
                    <div class="activity-message">${item.message}</div>
                    <div class="activity-time">${this.formatTime(new Date(item.timestamp))}</div>
                </div>
            </div>
        `).join('');
    }
    
    updateAgentPositions(agents) {
        const container = document.getElementById('agent-positions-list');
        if (!container) return;
        
        container.innerHTML = agents.map(agent => `
            <div class="agent-metric-card">
                <div class="agent-header">
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-type">${agent.type}</div>
                </div>
                
                <div class="agent-metrics">
                    <div class="metric-item">
                        <div class="label">X</div>
                        <div class="value">${agent.position.x.toFixed(1)}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Y</div>
                        <div class="value">${agent.position.y.toFixed(1)}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Z</div>
                        <div class="value">${agent.position.z.toFixed(1)}</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="label">Connections</div>
                        <div class="value">${agent.connections || 0}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    addActivity(message, type = 'info') {
        const activity = {
            message,
            type,
            timestamp: new Date()
        };
        
        this.activityLog.unshift(activity);
        if (this.activityLog.length > 50) {
            this.activityLog.pop();
        }
        
        this.updateActivityFeed();
    }
    
    updateActivityFeed() {
        const feed = document.getElementById('activity-feed');
        if (!feed) return;
        
        feed.innerHTML = this.activityLog.slice(0, 20).map(activity => `
            <div class="activity-item slide-in">
                <div class="activity-icon ${activity.type}"></div>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }
    
    initializeCharts() {
        // Simple chart placeholders - could be enhanced with D3.js
        const chartElements = document.querySelectorAll('.metric-chart');
        chartElements.forEach(chart => {
            chart.innerHTML = '<div style="width: 100%; height: 100%; background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.3) 50%, transparent 100%); border-radius: 4px;"></div>';
        });
    }
    
    startMetricsUpdate() {
        // Update metrics every 5 seconds
        setInterval(() => {
            this.requestSystemStatus();
        }, 5000);
        
        // Update time-based metrics every second
        setInterval(() => {
            this.updateTimeBasedMetrics();
        }, 1000);
    }
    
    updateTimeBasedMetrics() {
        // Update uptime
        if (this.metrics.system.uptime > 0) {
            this.metrics.system.uptime += 1;
            const uptime = this.formatUptime(this.metrics.system.uptime);
            const uptimeValue = document.getElementById('uptime-value');
            if (uptimeValue) uptimeValue.textContent = uptime;
        }
    }
    
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    formatTime(date) {
        return date.toLocaleTimeString();
    }
    
    updateDisplay() {
        this.updateStatusCards();
        this.updateAgentMetricsDisplay();
        this.updateResourceMeters();
        this.updateActivityFeed();
    }
    
    // Simulate real-time data updates for demonstration
    simulateRealtimeUpdates() {
        // Simulate network metrics
        setInterval(() => {
            this.updateNetworkTopology({
                connections: Math.floor(Math.random() * 20) + 5,
                stability: 0.85 + Math.random() * 0.15,
                throughput: Math.floor(Math.random() * 100) + 20,
                clusteringCoefficient: Math.random() * 0.8 + 0.2,
                agents: this.generateMockAgentPositions()
            });
        }, 3000);
        
        // Simulate performance metrics
        setInterval(() => {
            this.updatePerformanceMetrics({
                cpuUsage: Math.random() * 40 + 10,
                memoryUsagePercent: Math.random() * 60 + 20,
                networkLatency: Math.floor(Math.random() * 50) + 10,
                processingSpeed: Math.floor(Math.random() * 200) + 50,
                liveResponseTime: Math.floor(Math.random() * 1000) + 200,
                liveTokenRate: Math.floor(Math.random() * 50) + 10,
                collabEvents: Math.floor(Math.random() * 10),
                agentActivity: Math.random() * 0.8 + 0.2
            });
        }, 2000);
        
        // Simulate collaboration metrics
        setInterval(() => {
            this.updateCollaborationViewMetrics({
                discussionRounds: Math.floor(Math.random() * 5) + 1,
                consensusLevel: Math.random() * 0.8 + 0.2,
                synthesisSpeed: Math.floor(Math.random() * 500) + 100,
                collaborationStrength: Math.random() * 4 + 1,
                iterationCount: Math.floor(Math.random() * 5) + 1,
                confidenceAlignment: Math.random() * 0.8 + 0.2,
                ideaDiversity: Math.random() * 3 + 1,
                synthesisQuality: Math.random() * 0.8 + 0.2,
                liveSessions: this.generateMockCollaborationSessions(),
                collaborationFlow: this.generateMockCollaborationFlow()
            });
        }, 4000);
    }
    
    generateMockAgentPositions() {
        const agentNames = ['Dr. Analyzer', 'Prof. Reasoner', 'Ms. Synthesizer', 'Dr. Validator', 'Mx. Innovator'];
        const agentTypes = ['analyzer', 'reasoner', 'synthesizer', 'validator', 'innovator'];
        
        return agentNames.map((name, index) => ({
            name: name,
            type: agentTypes[index],
            position: {
                x: (Math.random() - 0.5) * 1000,
                y: (Math.random() - 0.5) * 1000,
                z: (Math.random() - 0.5) * 500
            },
            connections: Math.floor(Math.random() * 8) + 2
        }));
    }
    
    generateMockCollaborationSessions() {
        const sessionCount = Math.floor(Math.random() * 3) + 1;
        const sessions = [];
        
        for (let i = 0; i < sessionCount; i++) {
            sessions.push({
                id: `session_${Date.now()}_${i}`,
                status: ['active', 'converging', 'synthesizing'][Math.floor(Math.random() * 3)],
                participants: Math.floor(Math.random() * 4) + 2,
                progress: Math.floor(Math.random() * 80) + 20,
                duration: Math.floor(Math.random() * 120) + 30,
                consensus: Math.random() * 0.6 + 0.4,
                currentPhase: ['Individual Analysis', 'Discussion Round 2', 'Synthesis Phase'][Math.floor(Math.random() * 3)]
            });
        }
        
        return sessions;
    }
    
    generateMockCollaborationFlow() {
        const flowTypes = ['success', 'info', 'warning'];
        const messages = [
            'Agent collaboration initiated',
            'Consensus level increased to 85%',
            'New insight generated by Synthesizer',
            'Validation phase completed',
            'Discussion round 3 started',
            'Token usage optimized',
            'Network topology updated',
            'Agent energy levels restored'
        ];
        
        const flowItems = [];
        const itemCount = Math.floor(Math.random() * 5) + 3;
        
        for (let i = 0; i < itemCount; i++) {
            flowItems.push({
                type: flowTypes[Math.floor(Math.random() * flowTypes.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                timestamp: Date.now() - (Math.random() * 300000) // Last 5 minutes
            });
        }
        
        return flowItems.sort((a, b) => b.timestamp - a.timestamp);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.metricsDashboard = new MetricsDashboard();
});

export default MetricsDashboard;