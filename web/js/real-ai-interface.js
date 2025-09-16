// Real AI Interface Controller
import { WebSocketClient } from './utils/WebSocketClient.js';
import { BackendConfig } from './utils/BackendConfig.js';

class RealAIInterface {
    constructor() {
        this.websocket = null;
        this.aiAgents = new Map();
        this.activeCollaborations = new Map();
        this.taskHistory = [];
        
        this.initializeInterface();
        this.connectWebSocket();
    }
    
    initializeInterface() {
        console.log('🚀 Initializing Real AI Interface...');
        
        this.createAIControlPanel();
        console.log('✅ AI Control Panel created');
        
        this.createCollaborationInterface();
        console.log('✅ Collaboration interface created');
        
        this.createTaskInterface();
        console.log('✅ Task interface created');
        
        this.setupEventListeners();
        console.log('✅ Event listeners setup');
        
        // Verify form elements after creation
        setTimeout(() => {
            const descriptionElement = document.getElementById('ai-task-description');
            const formElement = document.getElementById('ai-task-form');
            
            console.log('Form verification:', {
                taskDescription: !!descriptionElement,
                aiTaskForm: !!formElement,
                descriptionValue: descriptionElement ? descriptionElement.value : 'N/A',
                descriptionPlaceholder: descriptionElement ? descriptionElement.placeholder : 'N/A'
            });
            
            if (!descriptionElement) {
                console.error('❌ Task description element not found after initialization!');
            }
            if (!formElement) {
                console.error('❌ AI task form not found after initialization!');
            }
        }, 100);
        
        console.log('✅ Real AI Interface initialization complete');
    }
    
    createAIControlPanel() {
        const controlPanel = document.createElement('div');
        controlPanel.className = 'ai-control-panel';
        controlPanel.innerHTML = `
            <div class="panel-toggle" id="ai-control-toggle">
                <span>▶</span>
            </div>
            <div class="panel-content">
                <div class="panel-header">
                    <h3>🧠 Real AI Agent Control</h3>
                    <div class="ai-status">
                        <span id="ai-status-indicator" class="status-dot offline"></span>
                        <span id="ai-status-text">Connecting...</span>
                    </div>
                </div>
                
                <div class="ai-agents-section">
                    <h4>Active AI Agents</h4>
                    <div id="ai-agents-list" class="agents-list"></div>
                    <button id="create-ai-agent-btn" class="btn btn-primary">Create AI Agent</button>
                </div>
                
                <div class="collaboration-section">
                    <h4>Live Collaborations</h4>
                    <div id="active-collaborations" class="collaborations-list"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(controlPanel);
        
        // Add toggle functionality
        this.setupAIControlPanelToggle();
    }
    
    createCollaborationInterface() {
        const collaborationPanel = document.createElement('div');
        collaborationPanel.className = 'collaboration-panel';
        collaborationPanel.innerHTML = `
            <div class="panel-toggle" id="collaboration-toggle">
                <span>◀</span>
            </div>
            <div class="panel-content">
                <div class="panel-header">
                    <h3>🤝 AI Collaboration Lab</h3>
                </div>
                
                <div class="task-submission">
                    <h4>Submit Task for AI Collaboration</h4>
                    <form id="ai-task-form">
                        <div class="form-group">
                            <label>Task Description:</label>
                            <textarea id="ai-task-description" rows="4" placeholder="Describe the complex problem you want AI agents to collaborate on..."></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Task Type:</label>
                                <select id="task-type">
                                    <option value="strategic_analysis">Strategic Analysis</option>
                                    <option value="creative_problem_solving">Creative Problem Solving</option>
                                    <option value="technical_evaluation">Technical Evaluation</option>
                                    <option value="ethical_analysis">Ethical Analysis</option>
                                    <option value="research_synthesis">Research Synthesis</option>
                                    <option value="innovation_challenge">Innovation Challenge</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Priority:</label>
                                <select id="task-priority">
                                    <option value="1">Low</option>
                                    <option value="3">Medium</option>
                                    <option value="5">High</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Complexity:</label>
                                <input type="range" id="task-complexity" min="10" max="100" value="50">
                                <span id="complexity-value">50</span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Required Capabilities (select multiple):</label>
                            <div class="capabilities-checkboxes">
                                <label><input type="checkbox" value="deep_analysis"> Deep Analysis</label>
                                <label><input type="checkbox" value="logical_reasoning"> Logical Reasoning</label>
                                <label><input type="checkbox" value="creative_thinking"> Creative Thinking</label>
                                <label><input type="checkbox" value="information_synthesis"> Information Synthesis</label>
                                <label><input type="checkbox" value="result_validation"> Result Validation</label>
                                <label><input type="checkbox" value="ethical_reasoning"> Ethical Reasoning</label>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-success">🚀 Start AI Collaboration</button>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(collaborationPanel);
        
        // Add toggle functionality
        this.setupCollaborationPanelToggle();
    }
    
    createTaskInterface() {
        const taskPanel = document.createElement('div');
        taskPanel.className = 'task-panel';
        taskPanel.innerHTML = `
            <div class="panel-header">
                <h3>📋 Task Results & History</h3>
            </div>
            
            <div id="active-task-display" class="active-task" style="display: none;">
                <h4>🔄 Collaboration in Progress</h4>
                <div class="task-progress">
                    <div class="progress-bar">
                        <div id="progress-fill" class="progress-fill"></div>
                    </div>
                    <div id="progress-text">Initializing...</div>
                </div>
                <div id="collaboration-phases" class="phases-display"></div>
            </div>
            
            <div id="task-results" class="task-results"></div>
            
            <div id="task-history" class="task-history">
                <h4>Previous Collaborations</h4>
                <div id="history-list" class="history-list"></div>
            </div>
        `;
        
        document.body.appendChild(taskPanel);
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Wait for elements to be in DOM
        const setupListeners = () => {
            // Task complexity slider
            const complexitySlider = document.getElementById('task-complexity');
            const complexityValue = document.getElementById('complexity-value');
            
            if (complexitySlider && complexityValue) {
                // Remove existing event listener to prevent duplicates
                if (this.complexitySliderListener) {
                    complexitySlider.removeEventListener('input', this.complexitySliderListener);
                }
                this.complexitySliderListener = (e) => {
                    complexityValue.textContent = e.target.value;
                };
                complexitySlider.addEventListener('input', this.complexitySliderListener);
                console.log('✅ Complexity slider listener added');
            } else {
                console.warn('⚠️ Complexity slider elements not found');
            }
            
            // Task form submission
            const taskForm = document.getElementById('ai-task-form');
            if (taskForm) {
                // Check if we've already attached the listener
                if (taskForm.hasAttribute('data-listener-attached')) {
                    console.log('⚠️ Task form listener already attached, skipping');
                    return;
                }
                
                // Mark that we've attached the listener
                taskForm.setAttribute('data-listener-attached', 'true');
                
                this.taskFormSubmitListener = (e) => {
                    e.preventDefault();
                    console.log('Form submit event triggered');
                    this.submitAITask();
                };
                taskForm.addEventListener('submit', this.taskFormSubmitListener);
                console.log('✅ Task form listener added');
            } else {
                console.warn('⚠️ AI task form not found');
            }
            
            // Create AI agent button
            const createAgentBtn = document.getElementById('create-ai-agent-btn');
            if (createAgentBtn) {
                // Check if we've already attached the listener
                if (createAgentBtn.hasAttribute('data-listener-attached')) {
                    console.log('⚠️ Create agent button listener already attached, skipping');
                    return;
                }
                
                // Mark that we've attached the listener
                createAgentBtn.setAttribute('data-listener-attached', 'true');
                
                this.createAgentBtnListener = () => {
                    this.showCreateAgentDialog();
                };
                createAgentBtn.addEventListener('click', this.createAgentBtnListener);
                console.log('✅ Create agent button listener added');
            } else {
                console.warn('⚠️ Create agent button not found');
            }
            
            // Debug form button
            const debugBtn = document.getElementById('debug-form-btn');
            if (debugBtn) {
                // Check if we've already attached the listener
                if (debugBtn.hasAttribute('data-listener-attached')) {
                    console.log('⚠️ Debug button listener already attached, skipping');
                    return;
                }
                
                // Mark that we've attached the listener
                debugBtn.setAttribute('data-listener-attached', 'true');
                
                this.debugBtnListener = () => {
                    this.debugFormState();
                };
                debugBtn.addEventListener('click', this.debugBtnListener);
                console.log('✅ Debug button listener added');
            }
        };
        
        // Try immediately
        setupListeners();
        
        // Also try after a short delay in case DOM isn't ready
        setTimeout(setupListeners, 50);
        setTimeout(setupListeners, 200);
    }
    
    connectWebSocket() {
        console.log('🔄 Connecting to Real AI Server...');
        
        // Try to reuse the main app's WebSocket connection if available
        if (window.app && window.app.ws && window.app.ws.socket) {
            console.log('🔗 Reusing main app WebSocket connection');
            this.websocket = window.app.ws;
            
            // Setup event handlers
            this.setupWebSocketHandlers();
            
            // Request initial status
            setTimeout(() => {
                this.requestAIStatus();
            }, 1000);
        } else {
            console.log('🔗 Creating new WebSocket connection');
            // Create new WebSocket connection
            this.websocket = new WebSocketClient();
            this.websocket.connect(BackendConfig.getBackendUrl()).catch((error) => {
                console.error('❌ Failed to connect to WebSocket:', error);
                // Removed Vercel deployment check
                // Check if we should use demo mode
                // if (BackendConfig.shouldUseDemoMode()) {
                //     console.log('📱 Vercel deployment detected, using demo mode');
                //     this.setupDemoMode();
                // } else {
                this.updateAIStatus('offline', 'Connection Failed');
                // }
            });
            
            // Setup event handlers
            this.setupWebSocketHandlers();
        }
        
        // Add periodic connection check
        setInterval(() => {
            if (this.websocket) {
                const isConnected = (this.websocket.socket && this.websocket.socket.connected) || 
                                 (this.websocket.connected) || false;
                console.log(`[RealAIInterface] Connection status check: ${isConnected}`);
                
                // If we're in demo mode, update status accordingly
                if (this.websocket.isDemoMode) {
                    this.updateAIStatus('demo', 'Demo Mode Active');
                }
            }
        }, 5000);
    }
    
    setupWebSocketHandlers() {
        // Check if we're reusing the main app's connection
        const isReusingConnection = this.websocket === window.app?.ws;
        
        // Only setup connection event handlers if we're not reusing
        if (!isReusingConnection) {
            this.websocket.on('connect', () => {
                console.log('✅ Connected to Real AI Server');
                this.updateAIStatus('online', 'Connected to Real AI Server');
            });
            
            this.websocket.on('disconnected', (reason) => {
                console.log('❌ Disconnected from Real AI Server:', reason);
                // Removed Vercel deployment check
                // Handle demo mode
                // if (reason === 'demo-mode') {
                //     this.setupDemoMode();
                // } else {
                this.updateAIStatus('offline', 'Disconnected from Server');
                // }
            });
            
            this.websocket.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                // Removed Vercel deployment check
                // Check if we should use demo mode
                // if (BackendConfig.shouldUseDemoMode()) {
                //     this.setupDemoMode();
                // } else {
                this.updateAIStatus('offline', 'Connection Error');
                // }
            });
        } else {
            // If reusing connection, check if already connected
            if (this.websocket.socket && this.websocket.socket.connected) {
                console.log('✅ Already connected to Real AI Server via main app');
                this.updateAIStatus('online', 'Connected to Real AI Server');
            } else if (this.websocket.isDemoMode) {
                console.log('📱 Demo mode active via main app');
                this.setupDemoMode();
            }
        }
        
        // Setup message handlers for all cases
        this.websocket.on('ai-system-status', (data) => {
            console.log('📊 AI System Status Update:', data);
            this.updateSystemStatus(data);
        });
        
        this.websocket.on('ai-agent-created', (data) => {
            console.log('🤖 New AI Agent Created:', data);
            if (data.success && data.agent) {
                this.showNotification(`🎉 New AI Agent Created: ${data.agent.name}`, 'success');
            }
        });
        
        this.websocket.on('ai-task-completed', (data) => {
            console.log('🏆 AI Task Completed:', data);
            this.handleTaskCompleted(data);
        });
        
        this.websocket.on('prof-smoot-allocation', (data) => {
            console.log('🎯 Prof. Smoot Allocation Decision:', data);
            this.showNotification(`🌌 Prof. Smoot allocated ${data.allocatedAgents.length} agents for task ${data.taskId.substring(0, 8)}...`, 'info');
            // Add a log entry for the allocation
            this.addLog('info', `Prof. Smoot allocated agents: ${data.allocatedAgents.length} agents selected with confidence ${data.confidence}`);
        });
        
        this.websocket.on('fallback-allocation', (data) => {
            console.log('🔄 Fallback Allocation Used:', data);
            this.showNotification(`🔄 Fallback allocation used for task ${data.taskId.substring(0, 8)}...`, 'warning');
            // Add a log entry for the allocation
            this.addLog('warning', `Fallback allocation used: ${data.allocatedAgents.length} agents selected using ${data.method}`);
        });
        
        this.websocket.on('task-chain-execution-step', (data) => {
            console.log('🔗 Task Chain Execution Step:', data);
            this.handleTaskChainExecutionStep(data);
        });
        
        this.websocket.on('task-chain-completed', (data) => {
            console.log('✅ Task Chain Completed:', data);
            // Handle task chain completion if needed
        });
        
        this.websocket.on('collaboration-completed', (data) => {
            console.log('🎉 Collaboration Completed:', data);
            // Handle collaboration completion if needed
        });
        
        // Request initial status
        setTimeout(() => {
            this.requestAIStatus();
        }, 1000);
    }
    
    setupDemoMode() {
        console.log('📱 Setting up demo mode for Real AI Interface');
        this.updateAIStatus('demo', 'Demo Mode Active');
        
        // Show demo mode notification
        this.showNotification('📱 Demo Mode Active - Real AI agents not available in this deployment', 'info');
        
        // Set up periodic demo updates
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
        }
        
        this.demoInterval = setInterval(() => {
            this.updateWithDemoData();
        }, 15000); // Update every 15 seconds with demo data
        
        // Trigger initial demo data
        setTimeout(() => {
            this.updateWithDemoData();
        }, 1000);
    }
    
    updateWithDemoData() {
        console.log('📱 Updating Real AI Interface with demo data');
        
        // Generate demo system status
        const demoStatus = {
            timestamp: Date.now(),
            openaiApiKey: false, // No API key in demo mode
            totalAIAgents: 5,
            activeCollaborations: Math.floor(Math.random() * 3),
            totalCollaborations: 12 + Math.floor(Math.random() * 5),
            connectedClients: 1,
            aiAgents: [
                {
                    id: 'demo-1',
                    name: 'Prof. Smoot (Demo)',
                    type: 'cosmic_structure_expert',
                    status: 'active',
                    energy: 95,
                    maxEnergy: 100,
                    ai: {
                        focusLevel: 0.9,
                        memoryLoad: { shortTerm: 5, longTerm: 42 },
                        currentThought: 'Analyzing cosmic structure patterns...'
                    }
                },
                {
                    id: 'demo-2',
                    name: 'Dr. Analyzer (Demo)',
                    type: 'analyzer',
                    status: 'processing',
                    energy: 87,
                    maxEnergy: 100,
                    ai: {
                        focusLevel: 0.7,
                        memoryLoad: { shortTerm: 8, longTerm: 36 },
                        currentThought: 'Processing data patterns...'
                    }
                },
                {
                    id: 'demo-3',
                    name: 'Ms. Synthesizer (Demo)',
                    type: 'synthesizer',
                    status: 'active',
                    energy: 92,
                    maxEnergy: 100,
                    ai: {
                        focusLevel: 0.8,
                        memoryLoad: { shortTerm: 3, longTerm: 28 },
                        currentThought: 'Synthesizing knowledge domains...'
                    }
                }
            ],
            recentTasks: [],
            system: {
                memory: { heapUsed: Math.random() * 50 * 1024 * 1024 }, // Random memory usage
                uptime: Math.floor(Math.random() * 3600) // Random uptime
            }
        };
        
        // Update with demo data
        this.updateSystemStatus(demoStatus);
    }
    
    requestAIStatus() {
        // In demo mode, don't try to request status from server
        if (this.websocket && this.websocket.isDemoMode) {
            console.log('📱 Demo mode: Skipping AI status request');
            return;
        }
        
        if (this.websocket && this.websocket.socket && this.websocket.socket.connected) {
            this.websocket.send('get-ai-status');
        } else if (this.websocket && !this.websocket.socket) {
            // If reusing main app connection, it might not have a socket property
            // but still be connected
            try {
                this.websocket.send('get-ai-status');
            } catch (error) {
                console.warn('Could not request AI status:', error);
            }
        } else {
            console.warn('WebSocket not connected, cannot request AI status');
        }
    }

    updateAIStatus(status, text) {
        const indicator = document.getElementById('ai-status-indicator');
        const statusText = document.getElementById('ai-status-text');
        
        if (indicator) {
            // Different styling for demo mode
            if (status === 'demo') {
                indicator.className = 'status-dot demo';
            } else {
                indicator.className = `status-dot ${status}`;
            }
        }
        
        if (statusText) {
            statusText.textContent = text;
        }
    }
    
    updateSystemStatus(status) {
        this.updateAIAgentsList(status.aiAgents || []);
        
        if (status.openaiApiKey) {
            this.updateAIStatus('online', `${status.totalAIAgents} AI Agents Active`);
        } else {
            this.updateAIStatus('warning', 'No OpenAI API Key - Limited Features');
        }
    }
    
    updateAIAgentsList(aiAgents) {
        const agentsList = document.getElementById('ai-agents-list');
        
        agentsList.innerHTML = aiAgents.map(agent => `
            <div class="agent-card">
                <div class="agent-header">
                    <h5>${agent.name}</h5>
                    <span class="agent-type">${agent.type}</span>
                    <span class="agent-status ${agent.status}">${agent.status}</span>
                </div>
                <div class="agent-details">
                    <div class="agent-stats">
                        <span>Energy: ${agent.energy}/${agent.maxEnergy}</span>
                        <span>Focus: ${(agent.ai?.focusLevel * 100 || 0).toFixed(0)}%</span>
                        <span>Memory: ${agent.ai?.memoryLoad?.shortTerm || 0}</span>
                    </div>
                    <div class="agent-capabilities">
                        ${agent.capabilities?.map(cap => `<span class="capability-tag">${cap}</span>`).join('') || ''}
                    </div>
                    ${agent.ai?.currentThought ? `<div class="current-thought">"${agent.ai.currentThought}"</div>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    submitAITask() {
        // Prevent multiple submissions
        if (this.isSubmitting) {
            console.log('⚠️ Task submission already in progress, ignoring duplicate request');
            return;
        }
        
        console.log('Submitting AI task...');
        this.isSubmitting = true;
        
        const descriptionElement = document.getElementById('ai-task-description');
        const typeElement = document.getElementById('task-type');
        const priorityElement = document.getElementById('task-priority');
        const complexityElement = document.getElementById('task-complexity');
        
        console.log('Form elements found:', {
            description: !!descriptionElement,
            type: !!typeElement,
            priority: !!priorityElement,
            complexity: !!complexityElement
        });
        
        if (!descriptionElement) {
            console.error('Task description element not found!');
            alert('Form not properly initialized. Please refresh the page.');
            this.isSubmitting = false;
            return;
        }
        
        const description = descriptionElement.value;
        const type = typeElement ? typeElement.value : 'strategic_analysis';
        const priority = priorityElement ? parseInt(priorityElement.value) : 3;
        const complexity = complexityElement ? parseInt(complexityElement.value) : 50;
        
        console.log('Form values:', { description, type, priority, complexity });
        
        const capabilities = Array.from(document.querySelectorAll('.capabilities-checkboxes input:checked'))
            .map(input => input.value);
        
        console.log('Selected capabilities:', capabilities);
        
        const taskData = {
            type: type,
            description: description.trim(),
            priority: priority,
            complexity: complexity,
            requiredCapabilities: capabilities
        };
        
        console.log('Submitting task data:', taskData);
        
        this.showTaskProgress();
        
        // Check if WebSocket is connected using the proper method
        const isConnected = this.websocket && 
                          ((this.websocket.socket && this.websocket.socket.connected) || 
                           (this.websocket.connected)); // Handle both connection types
        
        if (isConnected) {
            try {
                this.websocket.send('submit-ai-task', taskData);
                
                // Clear the form after successful submission
                descriptionElement.value = '';
                
                // Uncheck all capabilities
                document.querySelectorAll('.capabilities-checkboxes input:checked')
                    .forEach(input => input.checked = false);
                    
                console.log('Task submitted successfully to AI backend');
                
                // Reset submission flag after a delay to prevent rapid successive submissions
                setTimeout(() => {
                    this.isSubmitting = false;
                }, 2000);
            } catch (error) {
                console.error('Error submitting task:', error);
                this.showError('Failed to submit task: ' + error.message);
                this.isSubmitting = false;
                return;
            }
        } else {
            console.warn('WebSocket not connected, using demo mode');
            // Run demo collaboration
            this.runDemoCollaboration(taskData);
            
            // Reset submission flag after a delay to prevent rapid successive submissions
            setTimeout(() => {
                this.isSubmitting = false;
            }, 1000);
        }
    }
    
    showTaskProgress() {
        const taskDisplay = document.getElementById('active-task-display');
        taskDisplay.style.display = 'block';
        
        this.updateProgressPhase('Initializing AI collaboration...', 10);
        
        // Simulate progress updates
        setTimeout(() => this.updateProgressPhase('Selecting optimal AI agents...', 25), 1000);
        setTimeout(() => this.updateProgressPhase('Individual analysis phase...', 40), 3000);
        setTimeout(() => this.updateProgressPhase('Collaborative discussion...', 65), 8000);
        setTimeout(() => this.updateProgressPhase('Convergence and synthesis...', 85), 15000);
    }
    
    updateProgressPhase(text, progress) {
        document.getElementById('progress-text').textContent = text;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }
    
    hideTaskProgress() {
        document.getElementById('active-task-display').style.display = 'none';
    }
    
    handleTaskCompleted(data) {
        console.log('🏆 Handling task completion:', data);
        
        this.hideTaskProgress();
        this.isSubmitting = false; // Reset submission flag when task completes
        
        if (data.success && data.result) {
            console.log('✅ Displaying successful task result');
            this.displayTaskResult(data.result);
            this.addToTaskHistory(data.result);
            this.showNotification('🎉 Task completed successfully!', 'success');
        } else {
            console.log('❌ Task failed:', data.error || 'Unknown error');
            this.showError('Task failed: ' + (data.error || 'Unknown error'));
        }
    }
    
    displayTaskResult(result) {
        console.log('📊 Displaying task result:', result);
        
        const resultsContainer = document.getElementById('task-results');
        if (!resultsContainer) {
            console.error('❌ Task results container not found!');
            return;
        }
        
        // Ensure result has required structure
        const taskResult = {
            task: result.task || { 
                description: 'Unknown task',
                type: 'unknown'
            },
            finalResult: result.finalResult || result.content || 'No result available',
            synthesizedBy: result.synthesizedBy || 'AI Collaboration System',
            timestamp: result.timestamp || Date.now(),
            metadata: result.metadata || {
                totalAgents: 1,
                tokensUsed: 0,
                collaborationType: 'standard'
            },
            convergenceMetrics: result.convergenceMetrics || {
                convergenceAchieved: true,
                finalConsensus: 0.8,
                collaborationEfficiency: 0.7
            },
            insights: result.insights || []
        };
        
        const resultElement = document.createElement('div');
        resultElement.className = 'task-result';
        resultElement.innerHTML = `
            <div class="result-header">
                <h4>🎉 Collaboration Completed</h4>
                <span class="timestamp">${new Date(taskResult.timestamp).toLocaleString()}</span>
            </div>
            
            <div class="result-meta">
                <div class="meta-item">
                    <span class="label">Task:</span>
                    <span class="value">${taskResult.task.description}</span>
                </div>
                <div class="meta-item">
                    <span class="label">Synthesized by:</span>
                    <span class="value">${taskResult.synthesizedBy}</span>
                </div>
                <div class="meta-item">
                    <span class="label">Participants:</span>
                    <span class="value">${taskResult.metadata.totalAgents} AI agents</span>
                </div>
                <div class="meta-item">
                    <span class="label">Tokens Used:</span>
                    <span class="value">${taskResult.metadata.tokensUsed}</span>
                </div>
            </div>
            
            <div class="result-content">
                <h5>Final Collaborative Analysis:</h5>
                <div class="analysis-text">${taskResult.finalResult}</div>
            </div>
            
            <div class="result-metrics">
                <h5>Collaboration Metrics:</h5>
                <div class="metrics-grid">
                    ${taskResult.convergenceMetrics.convergenceAchieved ? 
                        `<div class="metric">
                            <span class="metric-label">Convergence:</span>
                            <span class="metric-value success">✅ Achieved</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Consensus:</span>
                            <span class="metric-value">${(taskResult.convergenceMetrics.finalConsensus * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Efficiency:</span>
                            <span class="metric-value">${(taskResult.convergenceMetrics.collaborationEfficiency * 100).toFixed(1)}%</span>
                        </div>` : 
                        '<div class="metric"><span class="metric-value warning">⚠️ Partial Convergence</span></div>'
                    }
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(resultElement);
        
        console.log('✅ Task result displayed successfully');
    }
    
    addToTaskHistory(result) {
        console.log('📜 Adding to task history:', result);
        
        // Ensure the result has the proper structure for history display
        const historyItem = {
            task: result.task || { 
                description: 'Unknown task',
                type: 'unknown'
            },
            finalResult: result.finalResult || result.content || 'No result available',
            timestamp: result.timestamp || Date.now(),
            synthesizedBy: result.synthesizedBy || 'AI System'
        };
        
        this.taskHistory.unshift(historyItem);
        
        // Keep only last 20 items
        if (this.taskHistory.length > 20) {
            this.taskHistory = this.taskHistory.slice(0, 20);
        }
        
        this.updateHistoryDisplay();
        console.log('✅ Task added to history. Total items:', this.taskHistory.length);
    }
    
    updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        if (!historyList) {
            console.error('❌ History list container not found!');
            return;
        }
        
        console.log('🔄 Updating history display with', this.taskHistory.length, 'items');
        
        if (this.taskHistory.length === 0) {
            historyList.innerHTML = '<div class="no-history">No collaboration history yet. Submit a task to get started!</div>';
            return;
        }
        
        historyList.innerHTML = this.taskHistory.slice(0, 5).map(result => {
            const task = result.task || {};
            const description = task.description || 'Unknown task';
            const finalResult = result.finalResult || 'No result available';
            const timestamp = result.timestamp || Date.now();
            const taskType = task.type || 'unknown';
            
            return `
                <div class="history-item">
                    <div class="history-header">
                        <span class="task-type">${taskType}</span>
                        <span class="timestamp">${new Date(timestamp).toLocaleString()}</span>
                    </div>
                    <div class="task-description">${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</div>
                    <div class="result-preview">${finalResult.substring(0, 150)}${finalResult.length > 150 ? '...' : ''}</div>
                </div>
            `;
        }).join('');
        
        console.log('✅ History display updated successfully');
    }
    
    displayDemoResult(result) {
        this.displayTaskResult(result);
        this.addToTaskHistory(result);
        
        // Show notification
        this.showNotification('🎭 Demo collaboration completed!', 'success');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    showError(message) {
        this.showNotification('❌ ' + message, 'error');
    }
    
    showCreateAgentDialog() {
        // Create custom agent creation modal
        const modal = document.createElement('div');
        modal.className = 'agent-creation-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: linear-gradient(135deg, #1e293b, #334155);
                border-radius: 12px;
                padding: 30px;
                width: 500px;
                max-width: 90vw;
                border: 1px solid rgba(14, 165, 233, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            ">
                <div class="modal-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="color: #0ea5e9; margin: 0;">🤖 Create Custom AI Agent</h3>
                    <button class="close-btn" style="
                        background: none;
                        border: none;
                        color: #94a3b8;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 5px;
                    ">×</button>
                </div>
                
                <form id="agent-creation-form">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; color: #0ea5e9; margin-bottom: 5px; font-weight: 500;">Agent Name:</label>
                        <input type="text" id="agent-name" placeholder="e.g., Data Analyst Agent" style="
                            width: 100%;
                            background: rgba(14, 165, 233, 0.1);
                            border: 1px solid rgba(14, 165, 233, 0.3);
                            border-radius: 6px;
                            padding: 8px 12px;
                            color: #ffffff;
                            font-family: inherit;
                        ">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; color: #0ea5e9; margin-bottom: 5px; font-weight: 500;">Agent Type:</label>
                        <select id="agent-type" style="
                            width: 100%;
                            background: rgba(14, 165, 233, 0.1);
                            border: 1px solid rgba(14, 165, 233, 0.3);
                            border-radius: 6px;
                            padding: 8px 12px;
                            color: #ffffff;
                            font-family: inherit;
                        ">
                            <option value="analyst">Analyst - Data & Research Expert</option>
                            <option value="creative">Creative - Innovation & Ideas</option>
                            <option value="technical">Technical - Engineering & Development</option>
                            <option value="strategic">Strategic - Planning & Decision Making</option>
                            <option value="ethical">Ethical - Values & Guidelines</option>
                            <option value="synthesizer">Synthesizer - Integration & Summary</option>
                        </select>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display: block; color: #0ea5e9; margin-bottom: 5px; font-weight: 500;">Personality Traits:</label>
                        <div class="personality-checkboxes" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 5px;">
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="analytical" style="width: auto; margin: 0;"> Analytical
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="creative" style="width: auto; margin: 0;"> Creative
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="detail_oriented" style="width: auto; margin: 0;"> Detail-Oriented
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="innovative" style="width: auto; margin: 0;"> Innovative
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="collaborative" style="width: auto; margin: 0;"> Collaborative
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; margin: 0; font-weight: normal; cursor: pointer; color: #ffffff;">
                                <input type="checkbox" value="critical_thinking" style="width: auto; margin: 0;"> Critical Thinking
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label style="display: block; color: #0ea5e9; margin-bottom: 5px; font-weight: 500;">Expertise Description:</label>
                        <textarea id="agent-expertise" rows="3" placeholder="Describe this agent's areas of expertise and unique capabilities..." style="
                            width: 100%;
                            background: rgba(14, 165, 233, 0.1);
                            border: 1px solid rgba(14, 165, 233, 0.3);
                            border-radius: 6px;
                            padding: 8px 12px;
                            color: #ffffff;
                            font-family: inherit;
                            resize: vertical;
                        "></textarea>
                    </div>
                    
                    <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button type="button" class="debug-agent-btn" style="
                            background: #6b7280;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-family: inherit;
                            font-weight: 500;
                            margin-right: auto;
                        ">🔍 Debug</button>
                        <button type="button" class="cancel-btn" style="
                            background: #6b7280;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-family: inherit;
                            font-weight: 500;
                        ">Cancel</button>
                        <button type="submit" style="
                            background: linear-gradient(135deg, #10b981, #059669);
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-family: inherit;
                            font-weight: 500;
                        ">🚀 Create Agent</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners for the modal
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const debugBtn = modal.querySelector('.debug-agent-btn');
        const form = modal.querySelector('#agent-creation-form');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Debug button for troubleshooting
        debugBtn.addEventListener('click', () => {
            this.debugAgentForm(modal);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCustomAgent(modal);
        });
    }
    
    debugAgentForm(modal) {
        console.log('🔍 Debugging agent creation form...');
        
        const nameInput = modal.querySelector('#agent-name');
        const typeSelect = modal.querySelector('#agent-type');
        const expertiseTextarea = modal.querySelector('#agent-expertise');
        const personalityCheckboxes = modal.querySelectorAll('.personality-checkboxes input');
        
        const formData = {
            nameInput: {
                exists: !!nameInput,
                value: nameInput ? nameInput.value : 'N/A',
                length: nameInput ? nameInput.value.length : 0,
                trimmed: nameInput ? nameInput.value.trim() : 'N/A',
                trimmedLength: nameInput ? nameInput.value.trim().length : 0
            },
            typeSelect: {
                exists: !!typeSelect,
                value: typeSelect ? typeSelect.value : 'N/A'
            },
            expertiseTextarea: {
                exists: !!expertiseTextarea,
                value: expertiseTextarea ? expertiseTextarea.value : 'N/A',
                length: expertiseTextarea ? expertiseTextarea.value.length : 0
            },
            personalityCheckboxes: {
                total: personalityCheckboxes.length,
                checked: Array.from(personalityCheckboxes).filter(cb => cb.checked).length,
                values: Array.from(personalityCheckboxes).filter(cb => cb.checked).map(cb => cb.value)
            }
        };
        
        console.log('Agent form debug data:', formData);
        
        // Test filling the form
        if (nameInput) {
            nameInput.value = 'Test Debug Agent';
            console.log('📝 Set test name value');
        }
        
        alert(`Form Debug Info:\n\nName Field: ${formData.nameInput.exists ? 'Found' : 'Missing'}\nName Value: "${formData.nameInput.value}"\nName Length: ${formData.nameInput.length}\nType Field: ${formData.typeSelect.exists ? 'Found' : 'Missing'}\nPersonality Options: ${formData.personalityCheckboxes.total} total, ${formData.personalityCheckboxes.checked} selected`);
    }
    
    debugFormState() {
        console.log('🔍 Debugging form state...');
        
        const elements = {
            taskDescription: document.getElementById('ai-task-description'),
            taskType: document.getElementById('task-type'),
            taskPriority: document.getElementById('task-priority'),
            taskComplexity: document.getElementById('task-complexity'),
            aiTaskForm: document.getElementById('ai-task-form'),
            capabilityCheckboxes: document.querySelectorAll('.capabilities-checkboxes input')
        };
        
        console.log('Form elements debug:', {
            taskDescription: {
                exists: !!elements.taskDescription,
                value: elements.taskDescription?.value || 'N/A',
                placeholder: elements.taskDescription?.placeholder || 'N/A'
            },
            taskType: {
                exists: !!elements.taskType,
                value: elements.taskType?.value || 'N/A'
            },
            taskPriority: {
                exists: !!elements.taskPriority,
                value: elements.taskPriority?.value || 'N/A'
            },
            taskComplexity: {
                exists: !!elements.taskComplexity,
                value: elements.taskComplexity?.value || 'N/A'
            },
            aiTaskForm: {
                exists: !!elements.aiTaskForm
            },
            capabilityCheckboxes: {
                count: elements.capabilityCheckboxes.length,
                checked: Array.from(elements.capabilityCheckboxes).filter(cb => cb.checked).length
            }
        });
        
        // Test form submission with dummy data
        if (elements.taskDescription) {
            elements.taskDescription.value = 'Test task description for debugging';
            console.log('📝 Set test description');
            
            // Try submitting
            this.submitAITask();
        } else {
            console.error('❌ Cannot debug: task description element not found');
            alert('Form elements not found! Please check if the interface is properly loaded.');
        }
    }
    
    createCustomAgent(modal) {
        console.log('🔍 Debugging custom agent creation...');
        
        // Search within the modal context instead of entire document
        const nameInput = modal.querySelector('#agent-name');
        const typeSelect = modal.querySelector('#agent-type');
        const expertiseTextarea = modal.querySelector('#agent-expertise');
        
        console.log('Form elements found in modal:', {
            nameInput: !!nameInput,
            typeSelect: !!typeSelect,
            expertiseTextarea: !!expertiseTextarea,
            nameValue: nameInput ? nameInput.value : 'N/A',
            nameLength: nameInput ? nameInput.value.length : 0
        });
        
        if (!nameInput) {
            console.error('❌ Agent name input not found in modal!');
            alert('Form elements not found! Please try again.');
            return;
        }
        
        const name = nameInput.value;
        const type = typeSelect ? typeSelect.value : 'analyst';
        const expertise = expertiseTextarea ? expertiseTextarea.value : '';
        
        const personality = Array.from(modal.querySelectorAll('.personality-checkboxes input:checked'))
            .map(input => input.value);
        
        console.log('Extracted values:', { name, type, expertise, personality });
        
        // Validate inputs
        if (!name || name.trim().length === 0) {
            console.error('❌ Agent name is required!');
            alert('Please enter a name for the AI agent.');
            return;
        }
        
        if (name.trim().length < 3) {
            console.error('❌ Agent name is too short!');
            alert('Agent name must be at least 3 characters long.');
            return;
        }
        
        const agentData = {
            name: name.trim(),
            type: type,
            expertise: expertise.trim(),
            personality: personality
        };
        
        console.log('Creating agent with data:', agentData);
        
        // Try to send to backend
        if (this.websocket && this.websocket.connected) {
            try {
                this.websocket.send('create-custom-agent', agentData);
                console.log('✅ Agent creation request sent to backend');
                
                // Close modal
                document.body.removeChild(modal);
                
                // Show success notification
                this.showNotification(`🚀 Creating custom AI agent: ${agentData.name}`, 'info');
            } catch (error) {
                console.error('❌ Error sending agent creation request:', error);
                alert('Failed to create agent: ' + error.message);
            }
        } else {
            console.warn('⚠️ WebSocket not connected, cannot create agent');
            alert('Cannot create agent: Not connected to AI server. Please check your connection.');
        }
    }
    
    runDemoCollaboration(taskData) {
        console.log('🎭 Running demo collaboration for task:', taskData);
        
        // Show demo mode notification
        this.showNotification('📱 Running demo collaboration - real AI agents not available', 'info');
        
        // Simulate collaboration progress
        this.updateProgressPhase('Initializing demo collaboration...', 10);
        
        setTimeout(() => {
            this.updateProgressPhase('Analyzing task requirements...', 25);
        }, 1000);
        
        setTimeout(() => {
            this.updateProgressPhase('Simulating agent collaboration...', 50);
        }, 3000);
        
        setTimeout(() => {
            this.updateProgressPhase('Generating synthetic results...', 75);
        }, 6000);
        
        setTimeout(() => {
            this.updateProgressPhase('Finalizing demo output...', 90);
        }, 9000);
        
        // Generate demo result after delay
        setTimeout(() => {
            const demoResult = {
                task: taskData,
                finalResult: `This is a demo result for the task: "${taskData.description}". In a real deployment, this would be the synthesized output from multiple AI agents collaborating on your task. The result would include detailed analysis, insights, and recommendations based on the collective intelligence of the AI agent network.`,
                synthesizedBy: 'Demo AI Collaboration System',
                timestamp: Date.now(),
                metadata: {
                    totalAgents: 3,
                    tokensUsed: 0,
                    collaborationType: 'demo'
                },
                convergenceMetrics: {
                    convergenceAchieved: true,
                    finalConsensus: 0.85,
                    collaborationEfficiency: 0.75
                },
                insights: [
                    'This is a simulated insight from the demo collaboration.',
                    'In a real deployment, this would contain actual insights from AI agents.',
                    'The system would analyze multiple perspectives and synthesize them into coherent results.'
                ]
            };
            
            this.displayDemoResult(demoResult);
            this.hideTaskProgress();
        }, 12000);
    }
    
    addLog(level, message) {
        const logContainer = document.getElementById('system-logs');
        if (!logContainer) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${level}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        // Create logs container if it doesn't exist
        let logsContainer = document.getElementById('logs-container');
        if (!logsContainer) {
            logsContainer = document.createElement('div');
            logsContainer.id = 'logs-container';
            logsContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 400px;
                max-height: 300px;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(14, 165, 233, 0.5);
                border-radius: 8px;
                padding: 15px;
                z-index: 9999;
                overflow-y: auto;
                font-family: monospace;
                font-size: 12px;
                color: #ffffff;
            `;
            
            const logsHeader = document.createElement('div');
            logsHeader.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid rgba(14, 165, 233, 0.3);
            `;
            
            const logsTitle = document.createElement('h4');
            logsTitle.textContent = 'System Logs';
            logsTitle.style.margin = '0';
            logsTitle.style.color = '#0ea5e9';
            
            const closeLogsBtn = document.createElement('button');
            closeLogsBtn.textContent = '×';
            closeLogsBtn.style.cssText = `
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            closeLogsBtn.addEventListener('click', () => {
                document.body.removeChild(logsContainer);
            });
            
            logsHeader.appendChild(logsTitle);
            logsHeader.appendChild(closeLogsBtn);
            logsContainer.appendChild(logsHeader);
            
            const logsContent = document.createElement('div');
            logsContent.id = 'system-logs';
            logsContent.style.cssText = `
                max-height: 250px;
                overflow-y: auto;
            `;
            
            logsContainer.appendChild(logsContent);
            document.body.appendChild(logsContainer);
        }
        
        const logsContent = document.getElementById('system-logs');
        if (logsContent) {
            logsContent.appendChild(logEntry);
            logsContent.scrollTop = logsContent.scrollHeight;
            
            // Limit log entries
            while (logsContent.children.length > 50) {
                logsContent.removeChild(logsContent.firstChild);
            }
        }
    }
    
    setupAIControlPanelToggle() {
        const toggleBtn = document.getElementById('ai-control-toggle');
        const aiControlPanel = document.querySelector('.ai-control-panel');
        
        if (!toggleBtn || !aiControlPanel) {
            console.warn('⚠️ Toggle button or AI control panel not found');
            return;
        }
        
        let isCollapsed = false;
        
        toggleBtn.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            
            if (isCollapsed) {
                aiControlPanel.classList.add('collapsed');
                toggleBtn.innerHTML = '<span>◀</span>';
                console.log('🔄 AI Control panel collapsed');
            } else {
                aiControlPanel.classList.remove('collapsed');
                toggleBtn.innerHTML = '<span>▶</span>';
                console.log('🔄 AI Control panel expanded');
            }
        });
        
        // Add hover effects
        toggleBtn.addEventListener('mouseenter', () => {
            if (isCollapsed) {
                toggleBtn.style.transform = 'scale(1.1) rotate(180deg)';
            } else {
                toggleBtn.style.transform = 'scale(1.1)';
            }
        });
        
        toggleBtn.addEventListener('mouseleave', () => {
            if (isCollapsed) {
                toggleBtn.style.transform = 'rotate(180deg)';
            } else {
                toggleBtn.style.transform = '';
            }
        });
        
        console.log('✅ AI Control panel toggle setup complete');
    }
    
    setupCollaborationPanelToggle() {
        const toggleBtn = document.getElementById('collaboration-toggle');
        const collaborationPanel = document.querySelector('.collaboration-panel');
        
        if (!toggleBtn || !collaborationPanel) {
            console.warn('⚠️ Toggle button or collaboration panel not found');
            return;
        }
        
        let isCollapsed = false;
        
        toggleBtn.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            
            if (isCollapsed) {
                collaborationPanel.classList.add('collapsed');
                toggleBtn.innerHTML = '<span>▶</span>';
                console.log('🔄 Collaboration panel collapsed');
            } else {
                collaborationPanel.classList.remove('collapsed');
                toggleBtn.innerHTML = '<span>◀</span>';
                console.log('🔄 Collaboration panel expanded');
            }
        });
        
        // Add hover effects
        toggleBtn.addEventListener('mouseenter', () => {
            if (isCollapsed) {
                toggleBtn.style.transform = 'scale(1.1) rotate(180deg)';
            } else {
                toggleBtn.style.transform = 'scale(1.1)';
            }
        });
        
        toggleBtn.addEventListener('mouseleave', () => {
            if (isCollapsed) {
                toggleBtn.style.transform = 'rotate(180deg)';
            } else {
                toggleBtn.style.transform = '';
            }
        });
        
        console.log('✅ Collaboration panel toggle setup complete');
    }
}

// Initialize the Real AI Interface when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.realAIInterface = new RealAIInterface();
});

export default RealAIInterface;