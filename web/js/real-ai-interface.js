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
            console.log('🔗 Creating new connection');
            // Create new connection
            this.websocket = new WebSocketClient();
            this.websocket.connect(BackendConfig.getBackendUrl()).catch((error) => {
                console.error('❌ Failed to connect:', error);
                this.updateAIStatus('offline', 'Connection Failed');
            });
            
            // Setup event handlers
            this.setupWebSocketHandlers();
        }
        
        // Add periodic connection check
        setInterval(() => {
            if (this.websocket) {
                const isConnected = this.websocket.connected || false;
                console.log(`[RealAIInterface] Connection status check: ${isConnected}`);
            }
        }, 5000);
    }
    
    setupWebSocketHandlers() {
        this.websocket.on('connected', () => {
            console.log('✅ Connected to Real AI Server');
            this.updateAIStatus('online', 'Connected to Real AI Server');
            
            // Request initial status
            setTimeout(() => {
                this.requestAIStatus();
            }, 1000);
        });
        
        this.websocket.on('disconnected', (reason) => {
            console.log('❌ Disconnected from Real AI Server:', reason);
            this.updateAIStatus('offline', 'Disconnected');
        });
        
        this.websocket.on('error', (error) => {
            console.error('❌ Connection error:', error);
            this.updateAIStatus('error', 'Connection Error');
        });
        
        this.websocket.on('ai-system-status', (data) => {
            this.updateSystemStatus(data);
        });
        
        this.websocket.on('ai-agent-update', (data) => {
            this.updateAgentList(data);
        });
        
        this.websocket.on('ai-agent-created', (data) => {
            if (data.success) {
                console.log('✅ AI Agent created successfully:', data.agent);
                this.addAgentToList(data.agent);
                this.hideCreateAgentDialog();
            } else {
                console.error('❌ Failed to create AI Agent:', data.error);
                this.showAgentCreationError(data.error);
            }
        });
        
        this.websocket.on('ai-task-acknowledged', (data) => {
            console.log('📨 Task acknowledged:', data);
            this.showTaskInProgress(data.taskId);
        });
        
        this.websocket.on('ai-task-completed', (data) => {
            console.log('✅ Task completed:', data);
            if (data.success) {
                this.showTaskResult(data.result);
                this.addToTaskHistory(data.result);
            } else {
                this.showTaskError(data.error);
            }
        });
        
        this.websocket.on('ai-collaboration-update', (data) => {
            console.log('🔄 Collaboration update:', data);
            this.updateCollaborationProgress(data);
        });
        
        this.websocket.on('collaboration-completed', (data) => {
            console.log('🎉 Collaboration completed:', data);
            this.showCollaborationResult(data);
            this.addToTaskHistory(data);
        });
    }
    
    requestAIStatus() {
        if (this.websocket && this.websocket.connected) {
            console.log('📡 Requesting AI system status');
            this.websocket.send('get-ai-status');
        }
    }
    
    updateAIStatus(status, message) {
        const statusIndicator = document.getElementById('ai-status-indicator');
        const statusText = document.getElementById('ai-status-text');
        
        if (statusIndicator) {
            statusIndicator.className = `status-dot ${status}`;
        }
        
        if (statusText) {
            statusText.textContent = message;
        }
    }
    
    updateSystemStatus(data) {
        console.log('📊 System status update:', data);
        
        // Update agent count
        const agentCount = data.totalAIAgents || 0;
        const statusText = document.getElementById('ai-status-text');
        if (statusText) {
            statusText.textContent = `Connected (${agentCount} agents)`;
        }
        
        // Update agent list
        if (data.aiAgents) {
            this.updateAgentList(data.aiAgents);
        }
    }
    
    updateAgentList(agents) {
        const agentsList = document.getElementById('ai-agents-list');
        if (!agentsList) return;
        
        // Convert agents object to array if needed
        const agentsArray = Array.isArray(agents) ? agents : Object.values(agents);
        
        agentsList.innerHTML = agentsArray.map(agent => `
            <div class="agent-item" data-agent-id="${agent.id}">
                <div class="agent-info">
                    <h5>${agent.name}</h5>
                    <p class="agent-type">${agent.type}</p>
                </div>
                <div class="agent-status">
                    <span class="status-dot ${agent.status || 'active'}"></span>
                    <span>${agent.status || 'active'}</span>
                </div>
            </div>
        `).join('');
    }
    
    addAgentToList(agent) {
        const agentsList = document.getElementById('ai-agents-list');
        if (!agentsList) return;
        
        const agentElement = document.createElement('div');
        agentElement.className = 'agent-item';
        agentElement.dataset.agentId = agent.id;
        agentElement.innerHTML = `
            <div class="agent-info">
                <h5>${agent.name}</h5>
                <p class="agent-type">${agent.type}</p>
            </div>
            <div class="agent-status">
                <span class="status-dot ${agent.status || 'active'}"></span>
                <span>${agent.status || 'active'}</span>
            </div>
        `;
        
        agentsList.appendChild(agentElement);
    }
    
    submitAITask() {
        console.log('Submitting AI task');
        
        // Get form values
        const description = document.getElementById('ai-task-description').value;
        const taskType = document.getElementById('task-type').value;
        const priority = parseInt(document.getElementById('task-priority').value);
        const complexity = parseInt(document.getElementById('task-complexity').value);
        
        // Get selected capabilities
        const capabilityCheckboxes = document.querySelectorAll('.capabilities-checkboxes input[type="checkbox"]:checked');
        const requiredCapabilities = Array.from(capabilityCheckboxes).map(cb => cb.value);
        
        // Validate form
        if (!description.trim()) {
            alert('Please enter a task description');
            return;
        }
        
        // Create task data
        const taskData = {
            type: taskType,
            description: description,
            priority: priority,
            complexity: complexity,
            requiredCapabilities: requiredCapabilities
        };
        
        console.log('Task data:', taskData);
        
        // Send task to server
        if (this.websocket && this.websocket.connected) {
            this.websocket.send('submit-ai-task', taskData);
            console.log('📤 Task submitted to server');
            
            // Clear form
            document.getElementById('ai-task-form').reset();
            document.getElementById('complexity-value').textContent = '50';
        } else {
            console.error('❌ Not connected to server, cannot submit task');
            alert('Not connected to AI server. Please check your connection.');
        }
    }
    
    showTaskInProgress(taskId) {
        const activeTaskDisplay = document.getElementById('active-task-display');
        const progressText = document.getElementById('progress-text');
        
        if (activeTaskDisplay && progressText) {
            activeTaskDisplay.style.display = 'block';
            progressText.textContent = `Task ${taskId.substring(0, 8)}... is being processed`;
        }
    }
    
    showTaskResult(result) {
        const activeTaskDisplay = document.getElementById('active-task-display');
        const taskResults = document.getElementById('task-results');
        
        if (activeTaskDisplay) {
            activeTaskDisplay.style.display = 'none';
        }
        
        if (taskResults && result) {
            const resultElement = document.createElement('div');
            resultElement.className = 'task-result';
            resultElement.innerHTML = `
                <h4>Task Result</h4>
                <div class="result-content">
                    <p><strong>Task ID:</strong> ${result.taskId || 'N/A'}</p>
                    <p><strong>Result:</strong></p>
                    <div class="result-text">${result.finalResult || result.result || 'No result available'}</div>
                </div>
            `;
            taskResults.prepend(resultElement);
        }
    }
    
    showTaskError(error) {
        const activeTaskDisplay = document.getElementById('active-task-display');
        const taskResults = document.getElementById('task-results');
        
        if (activeTaskDisplay) {
            activeTaskDisplay.style.display = 'none';
        }
        
        if (taskResults) {
            const errorElement = document.createElement('div');
            errorElement.className = 'task-error';
            errorElement.innerHTML = `
                <h4>Task Error</h4>
                <div class="error-content">
                    <p>${error}</p>
                </div>
            `;
            taskResults.prepend(errorElement);
        }
    }
    
    updateCollaborationProgress(data) {
        const progressText = document.getElementById('progress-text');
        const phasesDisplay = document.getElementById('collaboration-phases');
        
        if (progressText) {
            progressText.textContent = data.message || 'Processing collaboration...';
        }
        
        if (phasesDisplay && data.phase) {
            const phaseElement = document.createElement('div');
            phaseElement.className = 'phase-item';
            phaseElement.textContent = `${data.phase}: ${data.details || ''}`;
            phasesDisplay.appendChild(phaseElement);
        }
    }
    
    showCollaborationResult(data) {
        const activeTaskDisplay = document.getElementById('active-task-display');
        const taskResults = document.getElementById('task-results');
        
        if (activeTaskDisplay) {
            activeTaskDisplay.style.display = 'none';
        }
        
        if (taskResults && data) {
            const resultElement = document.createElement('div');
            resultElement.className = 'task-result collaboration-result';
            resultElement.innerHTML = `
                <h4>Collaboration Result</h4>
                <div class="result-content">
                    <p><strong>Collaboration ID:</strong> ${data.sessionId || data.id || 'N/A'}</p>
                    <p><strong>Final Result:</strong></p>
                    <div class="result-text">${data.finalResult || 'No result available'}</div>
                    ${data.executionSteps ? `
                    <p><strong>Execution Steps:</strong></p>
                    <ul>
                        ${data.executionSteps.map(step => `<li>${step.agentName}: ${step.taskName}</li>`).join('')}
                    </ul>
                    ` : ''}
                </div>
            `;
            taskResults.prepend(resultElement);
        }
    }
    
    addToTaskHistory(task) {
        this.taskHistory.unshift(task);
        this.taskHistory = this.taskHistory.slice(0, 10); // Keep only last 10 items
        this.updateTaskHistoryDisplay();
    }
    
    updateTaskHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        historyList.innerHTML = this.taskHistory.map(task => `
            <div class="history-item">
                <h5>${task.description || task.taskDescription || 'Unnamed Task'}</h5>
                <p class="task-meta">
                    <span>ID: ${task.taskId ? task.taskId.substring(0, 8) : 'N/A'}</span>
                    <span>Date: ${new Date().toLocaleDateString()}</span>
                </p>
                <div class="task-preview">
                    ${task.finalResult ? task.finalResult.substring(0, 100) + '...' : 'No preview available'}
                </div>
            </div>
        `).join('');
    }
    
    showCreateAgentDialog() {
        // Create modal dialog for agent creation
        const modal = document.createElement('div');
        modal.className = 'agent-creation-modal';
        modal.id = 'agent-creation-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Create New AI Agent</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="create-agent-form">
                        <div class="form-group">
                            <label>Agent Name:</label>
                            <input type="text" id="agent-name" required placeholder="e.g., Dr. Analyzer">
                        </div>
                        <div class="form-group">
                            <label>Agent Type:</label>
                            <select id="agent-type">
                                <option value="analyzer">Analyzer</option>
                                <option value="synthesizer">Synthesizer</option>
                                <option value="reasoner">Reasoner</option>
                                <option value="validator">Validator</option>
                                <option value="innovator">Innovator</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Capabilities (comma separated):</label>
                            <input type="text" id="agent-capabilities" placeholder="e.g., deep_analysis, pattern_recognition">
                        </div>
                        <div class="form-group">
                            <label>Personality Traits (comma separated):</label>
                            <input type="text" id="agent-personality" placeholder="e.g., analytical, detail-oriented">
                        </div>
                        <button type="submit" class="btn btn-primary">Create Agent</button>
                    </form>
                    <div id="agent-creation-error" class="error-message" style="display: none;"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            this.hideCreateAgentDialog();
        });
        
        const form = document.getElementById('create-agent-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAIAGent();
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideCreateAgentDialog();
            }
        });
    }
    
    hideCreateAgentDialog() {
        const modal = document.getElementById('agent-creation-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    createAIAGent() {
        const name = document.getElementById('agent-name').value;
        const type = document.getElementById('agent-type').value;
        const capabilities = document.getElementById('agent-capabilities').value.split(',').map(c => c.trim()).filter(c => c);
        const personality = document.getElementById('agent-personality').value.split(',').map(p => p.trim()).filter(p => p);
        
        if (!name) {
            this.showAgentCreationError('Agent name is required');
            return;
        }
        
        const agentConfig = {
            name: name,
            type: type,
            capabilities: capabilities,
            personality: personality
        };
        
        console.log('Creating AI agent:', agentConfig);
        
        if (this.websocket && this.websocket.connected) {
            this.websocket.send('create-ai-agent', agentConfig);
        } else {
            this.showAgentCreationError('Not connected to server');
        }
    }
    
    showAgentCreationError(error) {
        const errorElement = document.getElementById('agent-creation-error');
        if (errorElement) {
            errorElement.textContent = error;
            errorElement.style.display = 'block';
        }
    }
    
    setupAIControlPanelToggle() {
        const toggle = document.getElementById('ai-control-toggle');
        const panel = toggle?.closest('.ai-control-panel');
        const content = panel?.querySelector('.panel-content');
        const arrow = toggle?.querySelector('span');
        
        if (toggle && content && arrow) {
            toggle.addEventListener('click', () => {
                const isCollapsed = content.style.display === 'none';
                content.style.display = isCollapsed ? 'block' : 'none';
                arrow.textContent = isCollapsed ? '▶' : '◀';
            });
        }
    }
    
    setupCollaborationPanelToggle() {
        const toggle = document.getElementById('collaboration-toggle');
        const panel = toggle?.closest('.collaboration-panel');
        const content = panel?.querySelector('.panel-content');
        const arrow = toggle?.querySelector('span');
        
        if (toggle && content && arrow) {
            toggle.addEventListener('click', () => {
                const isCollapsed = content.style.display === 'none';
                content.style.display = isCollapsed ? 'block' : 'none';
                arrow.textContent = isCollapsed ? '◀' : '▶';
            });
        }
    }
    
    debugFormState() {
        console.log('=== Form Debug Info ===');
        const descriptionElement = document.getElementById('ai-task-description');
        const formElement = document.getElementById('ai-task-form');
        
        console.log({
            taskDescription: descriptionElement,
            aiTaskForm: formElement,
            descriptionValue: descriptionElement ? descriptionElement.value : 'N/A',
            descriptionPlaceholder: descriptionElement ? descriptionElement.placeholder : 'N/A'
        });
        
        // Also log all form elements
        if (formElement) {
            const formElements = formElement.querySelectorAll('input, select, textarea');
            console.log('Form elements:', Array.from(formElements).map(el => ({
                tagName: el.tagName,
                id: el.id,
                type: el.type,
                name: el.name,
                value: el.value
            })));
        }
    }
}

// Initialize the Real AI Interface when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.realAIInterface = new RealAIInterface();
});

export default RealAIInterface;
