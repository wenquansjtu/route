// 网络拓扑可视化组件
export class NetworkVisualizer {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.layout = 'force';
        this.nodeSize = 10;
        this.linkStrength = 1;
        
        this.width = 0;
        this.height = 0;
        
        // Special styling for Prof. Smoot
        this.profSmootId = null;
    }
    
    init() {
        console.log('NetworkVisualizer init() called');
        
        if (!this.container) {
            console.error('Container not found for NetworkVisualizer');
            return;
        }
        
        // Check if D3 is available
        if (typeof d3 === 'undefined') {
            console.error('D3.js is not loaded!');
            return;
        }
        
        console.log('Container found:', this.container);
        
        // 清空容器
        this.container.innerHTML = '';
        
        // 获取容器尺寸
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width || 800;
        this.height = rect.height || 400;
        
        // 如果容器不可见，使用默认尺寸
        if (this.width === 0 || this.height === 0) {
            this.width = 800;
            this.height = 400;
            console.log('Container has zero dimensions, using default size:', this.width, 'x', this.height);
        }
        
        console.log('Container dimensions:', this.width, 'x', this.height);
        
        // Create controls for saved topologies
        this.createTopologyControls();
        
        // 创建SVG
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${this.width} ${this.height}`);
        
        // 添加背景
        this.svg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', 'rgba(0,0,0,0.2)');
        
        // 创建组
        this.svg.append('g').attr('class', 'links');
        this.svg.append('g').attr('class', 'nodes');
        
        // 初始化力导向模拟
        this.initSimulation();
        
        // Generate sample data
        this.generateSampleData();
        this.render();
        
        console.log('✅ NetworkVisualizer initialized successfully with', this.nodes.length, 'nodes and', this.links.length, 'links');
    }
    
    createTopologyControls() {
        // Create a div for topology controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'topology-controls';
        controlsDiv.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center; gap: 10px;';
        
        // Create saved topologies dropdown
        const dropdown = document.createElement('select');
        dropdown.id = 'saved-topologies-dropdown';
        dropdown.innerHTML = '<option value="">Select a saved topology</option>';
        dropdown.style.cssText = 'padding: 5px; border-radius: 4px; border: 1px solid #ccc;';
        
        // Add refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Refresh List';
        refreshBtn.className = 'btn';
        refreshBtn.style.cssText = 'padding: 5px 10px; border-radius: 4px;';
        
        // Add live view button
        const liveViewBtn = document.createElement('button');
        liveViewBtn.textContent = 'Live Network View';
        liveViewBtn.className = 'btn';
        liveViewBtn.style.cssText = 'padding: 5px 10px; border-radius: 4px; margin-left: 10px;';
        
        // Add event listener for refresh button
        refreshBtn.addEventListener('click', () => {
            this.updateSavedTopologiesDropdown();
        });
        
        // Add event listener for live view button
        liveViewBtn.addEventListener('click', () => {
            this.refreshLiveView();
        });
        
        controlsDiv.appendChild(dropdown);
        controlsDiv.appendChild(refreshBtn);
        controlsDiv.appendChild(liveViewBtn);
        
        // Insert controls before the container
        this.container.parentNode.insertBefore(controlsDiv, this.container);
        
        // Add event listener for dropdown change
        dropdown.addEventListener('change', (e) => {
            const selectedTaskChainId = e.target.value;
            if (selectedTaskChainId && this.savedTopologies) {
                this.displaySavedTopology(selectedTaskChainId);
            } else if (selectedTaskChainId === '') {
                // User selected the empty option, refresh live view
                this.refreshLiveView();
            }
        });
        
        // Store reference to dropdown for later updates
        this.topologyDropdown = dropdown;
    }
    
    updateSavedTopologiesDropdown() {
        if (!this.topologyDropdown || !this.savedTopologies) return;
        
        // Clear existing options except the first one
        while (this.topologyDropdown.children.length > 1) {
            this.topologyDropdown.removeChild(this.topologyDropdown.lastChild);
        }
        
        // Add options for each saved topology
        this.savedTopologies.forEach((data, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `Task ${id.substring(0, 8)}... (${new Date(data.timestamp).toLocaleTimeString()})`;
            this.topologyDropdown.appendChild(option);
        });
    }
    
    initSimulation() {
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).strength(this.linkStrength))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(this.nodeSize + 5));
            
        // Ensure proper tick handling
        this.simulation.on('tick', () => {
            this.tick();
        });
    }
    
    tick() {
        if (!this.svg) return;
        
        // Update link positions
        this.svg.selectAll('.link')
            .attr('x1', d => (d.source.x || 0))
            .attr('y1', d => (d.source.y || 0))
            .attr('x2', d => (d.target.x || 0))
            .attr('y2', d => (d.target.y || 0));
        
        // Update node positions
        this.svg.selectAll('.node')
            .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    }
    
    generateSampleData() {
        // 生成示例节点
        this.nodes = [
            { id: 'agent1', name: 'Agent-1', type: 'analysis', status: 'online', x: this.width * 0.3, y: this.height * 0.3 },
            { id: 'agent2', name: 'Agent-2', type: 'processing', status: 'busy', x: this.width * 0.7, y: this.height * 0.3 },
            { id: 'agent3', name: 'Agent-3', type: 'reasoning', status: 'online', x: this.width * 0.5, y: this.height * 0.7 },
            { id: 'agent4', name: 'Agent-4', type: 'coordination', status: 'offline', x: this.width * 0.2, y: this.height * 0.6 },
            { id: 'agent5', name: 'Agent-5', type: 'visualization', status: 'online', x: this.width * 0.8, y: this.height * 0.6 }
        ];
        
        // 生成示例连接
        this.links = [
            { source: 'agent1', target: 'agent2', strength: 0.8, type: 'collaboration' },
            { source: 'agent2', target: 'agent3', strength: 0.6, type: 'data_flow' },
            { source: 'agent1', target: 'agent3', strength: 0.4, type: 'coordination' },
            { source: 'agent3', target: 'agent5', strength: 0.7, type: 'collaboration' },
            { source: 'agent4', target: 'agent1', strength: 0.3, type: 'coordination' }
        ];
        
        // Convert string references to object references for D3
        this.convertLinkReferences();
    }
    
    // Convert link source/target string IDs to node object references
    convertLinkReferences() {
        if (!this.nodes || !this.links) return;
        
        this.links = this.links.map(link => {
            let sourceNode = link.source;
            let targetNode = link.target;
            
            // If source is a string, find the corresponding node object
            if (typeof link.source === 'string') {
                sourceNode = this.nodes.find(node => node.id === link.source);
            }
            
            // If target is a string, find the corresponding node object
            if (typeof link.target === 'string') {
                targetNode = this.nodes.find(node => node.id === link.target);
            }
            
            // Only return the link if both source and target nodes exist
            if (sourceNode && targetNode) {
                return {
                    ...link,
                    source: sourceNode,
                    target: targetNode
                };
            } else {
                console.warn('Could not find source or target node for link:', link);
                return null;
            }
        }).filter(link => link !== null); // Remove any null links
    }
    
    setLayout(layoutType) {
        this.layout = layoutType;
        this.updateLayout();
    }
    
    setNodeSize(size) {
        this.nodeSize = parseInt(size);
        this.updateNodeSize();
    }
    
    setLinkStrength(strength) {
        this.linkStrength = parseFloat(strength);
        if (this.simulation) {
            this.simulation.force('link').strength(this.linkStrength);
            this.simulation.alpha(0.3).restart();
        }
    }
    
    updateLayout() {
        switch (this.layout) {
            case 'force':
                this.applyForceLayout();
                break;
            case 'circular':
                this.applyCircularLayout();
                break;
            case 'hierarchical':
                this.applyHierarchicalLayout();
                break;
        }
    }
    
    applyForceLayout() {
        if (this.simulation) {
            this.simulation
                .force('center', d3.forceCenter(this.width / 2, this.height / 2))
                .force('charge', d3.forceManyBody().strength(-300))
                .alpha(0.5).restart();
        }
    }
    
    applyCircularLayout() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) * 0.3;
        
        this.nodes.forEach((node, i) => {
            const angle = (i / this.nodes.length) * 2 * Math.PI;
            node.fx = centerX + radius * Math.cos(angle);
            node.fy = centerY + radius * Math.sin(angle);
        });
        
        if (this.simulation) {
            this.simulation.alpha(0.3).restart();
        }
    }
    
    applyHierarchicalLayout() {
        const levels = 3;
        const nodesPerLevel = Math.ceil(this.nodes.length / levels);
        
        this.nodes.forEach((node, i) => {
            const level = Math.floor(i / nodesPerLevel);
            const posInLevel = i % nodesPerLevel;
            const levelWidth = this.width * 0.8;
            const levelSpacing = this.height / (levels + 1);
            
            node.fx = (this.width - levelWidth) / 2 + (levelWidth / (nodesPerLevel + 1)) * (posInLevel + 1);
            node.fy = levelSpacing * (level + 1);
        });
        
        if (this.simulation) {
            this.simulation.alpha(0.3).restart();
        }
    }
    
    updateNodeSize() {
        this.svg.selectAll('.node circle')
            .attr('r', this.nodeSize);
        
        if (this.simulation) {
            this.simulation.force('collision').radius(this.nodeSize + 5);
            this.simulation.alpha(0.1).restart();
        }
    }
    
    render() {
        // Only render if we have nodes and links
        if (!this.nodes || !this.links) return;
        
        this.renderLinks();
        this.renderNodes();
        
        if (this.simulation) {
            // Only restart simulation if there are significant changes
            const shouldRestart = this.nodes.length > 0 && this.links.length > 0;
            
            if (shouldRestart) {
                // Convert link references before updating simulation
                this.convertLinkReferences();
                
                // Update the simulation with current nodes and links
                this.simulation.nodes(this.nodes);
                this.simulation.force('link').links(this.links);
                
                // Only restart if we're not displaying a saved topology
                if (!this.hasSavedTopologyDisplayed()) {
                    this.simulation.alpha(0.3).restart();
                }
            }
        }
    }
    
    renderNodes() {
        const nodeSelection = this.svg.select('.nodes')
            .selectAll('.node')
            .data(this.nodes, d => d.id);
        
        // Exit
        nodeSelection.exit().remove();
        
        // Enter
        const nodeEnter = nodeSelection.enter()
            .append('g')
            .attr('class', 'node')
            .call(this.drag(this.simulation));
        
        // Add circles
        nodeEnter.append('circle')
            .attr('r', this.nodeSize)
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', d => this.getNodeStroke(d))
            .attr('stroke-width', d => d.isProfSmoot ? 3 : 1.5)
            .attr('class', d => d.isProfSmoot ? 'prof-smoot-node' : '');
        
        // Add labels
        nodeEnter.append('text')
            .attr('x', 0)
            .attr('y', d => this.nodeSize + 15)
            .attr('text-anchor', 'middle')
            .attr('class', 'node-label')
            .text(d => this.getNodeLabel(d));
        
        // Add icons for special nodes
        nodeEnter.filter(d => d.isProfSmoot)
            .append('text')
            .attr('x', 0)
            .attr('y', 5)
            .attr('text-anchor', 'middle')
            .attr('class', 'node-icon')
            .text('🌌'); // Special icon for Prof. Smoot
        
        // Update
        const nodeUpdate = nodeEnter.merge(nodeSelection);
        
        nodeUpdate.select('circle')
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', d => this.getNodeStroke(d))
            .attr('stroke-width', d => d.isProfSmoot ? 3 : 1.5);
        
        nodeUpdate.select('.node-label')
            .text(d => this.getNodeLabel(d));
    }
    
    renderLinks() {
        const linkSelection = this.svg.select('.links')
            .selectAll('.link')
            .data(this.links, d => `${d.source.id || d.source}-${d.target.id || d.target}`);
        
        linkSelection.exit().remove();
        
        const linkEnter = linkSelection.enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', d => this.getLinkColor(d))
            .attr('stroke-width', d => this.getLinkWidth(d))
            .attr('stroke-opacity', 0.6);
        
        const linkUpdate = linkEnter.merge(linkSelection);
        
        linkUpdate
            .attr('stroke', d => this.getLinkColor(d))
            .attr('stroke-width', d => this.getLinkWidth(d));
    }
    
    getNodeColor(node) {
        if (node.isProfSmoot) return '#9333ea'; // Purple for Prof. Smoot
        if (node.group === 'agent') {
            const typeColors = {
                'analyzer': '#3b82f6',
                'reasoner': '#10b981',
                'synthesizer': '#f59e0b',
                'validator': '#ef4444',
                'innovator': '#8b5cf6',
                'cosmic_structure_expert': '#9333ea'
            };
            return typeColors[node.type] || '#60a5fa';
        }
        return '#94a3b8'; // Default color for tasks
    }
    
    getNodeStroke(node) {
        if (node.isProfSmoot) return '#ffffff';
        if (node.status === 'completed') return '#10b981';
        if (node.status === 'busy') return '#f59e0b';
        if (node.status === 'offline') return '#ef4444';
        return '#ffffff';
    }
    
    getNodeLabel(node) {
        if (node.name) {
            return node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name;
        }
        return node.id.substring(0, 8);
    }
    
    getLinkColor(link) {
        const typeColors = {
            'execution': '#60a5fa',
            'sequence': '#10b981',
            'collaboration': '#8b5cf6',
            'data_flow': '#f59e0b'
        };
        return typeColors[link.type] || '#94a3b8';
    }
    
    getLinkWidth(link) {
        if (link.type === 'sequence') return 2;
        if (link.type === 'execution') return 3;
        return 1.5;
    }
    
    // Add drag functionality for nodes
    drag(simulation) {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
    
    updateNodesFromAgents(agentsMap) {
        // Convert agent map to nodes array
        this.nodes = Array.from(agentsMap.values()).map(agent => ({
            id: agent.id,
            name: agent.name || agent.id,
            type: agent.type || 'unknown',
            status: agent.status || 'online',
            x: agent.position ? agent.position.x * this.width : Math.random() * this.width,
            y: agent.position ? agent.position.y * this.height : Math.random() * this.height
        }));
        
        console.log('Updated nodes:', this.nodes.length);
    }
    
    updateLinksFromTopology(topology) {
        if (topology.connections) {
            this.links = topology.connections.map(conn => ({
                source: conn.source,
                target: conn.target,
                strength: conn.strength || 0.5,
                type: conn.type || 'collaboration'
            }));
            
            console.log('Updated links:', this.links.length);
        }
    }
    
    update(systemState) {
        console.log('NetworkVisualizer update called with:', systemState);
        
        // Don't update if we have a saved topology displayed
        if (this.hasSavedTopologyDisplayed()) {
            console.log('Skipping update - saved topology is displayed');
            return;
        }
        
        if (!this.svg) {
            console.log('SVG not initialized, calling init()...');
            this.init();
            return;
        }
        
        // Update nodes and connections data
        if (systemState && systemState.agents && systemState.agents.size > 0) {
            console.log('Updating nodes from agents:', systemState.agents.size);
            this.updateNodesFromAgents(systemState.agents);
        } else {
            console.log('No agents in system state, using sample data');
        }
        
        if (systemState && systemState.topology && systemState.topology.connections) {
            console.log('Updating links from topology:', systemState.topology.connections.length);
            this.updateLinksFromTopology(systemState.topology);
        } else {
            console.log('No topology data, using sample connections');
        }
        
        // Convert link references to ensure proper connections
        this.convertLinkReferences();
        
        // Update the simulation with new data
        if (this.simulation) {
            this.simulation.nodes(this.nodes);
            this.simulation.force('link').links(this.links);
            this.simulation.alpha(0.3).restart();
        }
        
        this.render();
    }
    
    updateWithTaskChain(taskChainData) {
        console.log('Updating network visualization with task chain:', taskChainData);
        
        if (!taskChainData || !taskChainData.executionPath) {
            console.warn('No task chain data or execution path provided');
            return;
        }
        
        // Convert execution path to nodes and links for network visualization
        this.convertTaskChainToNetwork(taskChainData.executionPath);
        
        // Render the visualization
        this.render();
        
        // Store the topology data for later retrieval
        if (!this.savedTopologies) {
            this.savedTopologies = new Map();
        }
        this.savedTopologies.set(taskChainData.id, {
            nodes: [...this.nodes],
            links: [...this.links],
            timestamp: Date.now(),
            taskInfo: {
                id: taskChainData.id,
                metrics: taskChainData.metrics || {}
            }
        });
        
        // Update the dropdown with saved topologies
        this.updateSavedTopologiesDropdown();
    }
    
    convertTaskChainToNetwork(executionPath) {
        // Create nodes for each unique agent and task
        const agentNodes = new Map();
        const taskNodes = new Map();
        
        // Process execution path to create nodes
        executionPath.forEach((step, index) => {
            // Add agent node if not exists
            if (!agentNodes.has(step.agentId)) {
                const agentDetails = step.agentDetails && step.agentDetails.length > 0 ? 
                    step.agentDetails.find(detail => detail.id === step.agentId) : null;
                
                agentNodes.set(step.agentId, {
                    id: step.agentId,
                    name: agentDetails ? agentDetails.name : `Agent-${step.agentId.substring(0, 8)}`,
                    type: agentDetails ? agentDetails.type : 'agent',
                    status: 'completed',
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    group: 'agent',
                    isProfSmoot: agentDetails ? agentDetails.name === 'Prof. Smoot' : false
                });
            }
            
            // Add task node
            const taskId = step.taskId || `task_${index}`;
            if (!taskNodes.has(taskId)) {
                taskNodes.set(taskId, {
                    id: taskId,
                    name: step.taskName || `Task-${taskId.substring(0, 8)}`,
                    type: 'task',
                    status: 'completed',
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    group: 'task'
                });
            }
        });
        
        // Create nodes array
        this.nodes = [...agentNodes.values(), ...taskNodes.values()];
        
        // Create links between agents and tasks
        this.links = executionPath.map(step => {
            const taskId = step.taskId || `task_${executionPath.indexOf(step)}`;
            return {
                source: step.agentId,
                target: taskId,
                type: 'execution',
                timestamp: step.timestamp,
                heatLevel: step.heatLevel || 0.5
            };
        });
        
        // Add sequential links between tasks based on execution order
        for (let i = 0; i < executionPath.length - 1; i++) {
            const sourceTaskId = executionPath[i].taskId || `task_${i}`;
            const targetTaskId = executionPath[i + 1].taskId || `task_${i + 1}`;
            
            this.links.push({
                source: sourceTaskId,
                target: targetTaskId,
                type: 'sequence',
                timestamp: executionPath[i].timestamp
            });
        }
        
        // Convert string references to object references for D3
        this.convertLinkReferences();
        
        console.log('Converted task chain to network:', {
            nodes: this.nodes.length,
            links: this.links.length
        });
    }
    
    // Method to display a saved topology
    displaySavedTopology(taskChainId) {
        if (!this.savedTopologies) {
            console.warn('No saved topologies available');
            return false;
        }
        
        const savedTopology = this.savedTopologies.get(taskChainId);
        if (!savedTopology) {
            console.warn('Saved topology not found for task chain:', taskChainId);
            return false;
        }
        
        // Restore the topology data
        this.nodes = savedTopology.nodes.map(node => ({...node})); // Create copies
        this.links = savedTopology.links.map(link => ({...link})); // Create copies
        
        // Convert string references to object references for D3
        this.convertLinkReferences();
        
        // Render the visualization
        this.render();
        
        // Update the dropdown to show the selected topology
        if (this.topologyDropdown) {
            this.topologyDropdown.value = taskChainId;
        }
        
        console.log('Displayed saved topology for task chain:', taskChainId);
        return true;
    }
    
    // Method to get list of saved topologies
    getSavedTopologies() {
        if (!this.savedTopologies) {
            return [];
        }
        
        return Array.from(this.savedTopologies.entries()).map(([id, data]) => ({
            id,
            timestamp: data.timestamp,
            taskInfo: data.taskInfo
        }));
    }
    
    // Method to clear saved topologies
    clearSavedTopologies() {
        if (this.savedTopologies) {
            this.savedTopologies.clear();
        }
        this.updateSavedTopologiesDropdown();
    }
    
    // Method to check if a saved topology is currently displayed
    hasSavedTopologyDisplayed() {
        // Check if we have saved topologies and one is currently displayed
        if (!this.savedTopologies || this.savedTopologies.size === 0) {
            return false;
        }
        
        // Check if we have a selected value in the dropdown that corresponds to a saved topology
        if (this.topologyDropdown && this.topologyDropdown.value) {
            return this.savedTopologies.has(this.topologyDropdown.value);
        }
        
        // Fallback check: see if we have nodes that look like task chain nodes
        // (nodes with both agent and task groups)
        if (this.nodes && this.nodes.length > 0) {
            const hasTaskNodes = this.nodes.some(node => node.group === 'task');
            const hasAgentNodes = this.nodes.some(node => node.group === 'agent');
            return hasTaskNodes && hasAgentNodes;
        }
        
        return false;
    }
    
    // Method to clear the current visualization and reset to sample data
    clearCurrentVisualization() {
        // Clear the saved topology selection
        if (this.topologyDropdown) {
            this.topologyDropdown.value = '';
        }
        
        // Stop the simulation
        if (this.simulation) {
            this.simulation.stop();
        }
        
        // Clear the SVG
        if (this.svg) {
            this.svg.selectAll('*').remove();
        }
        
        // Reset to sample data
        this.generateSampleData();
        this.render();
        
        // Restart the simulation
        if (this.simulation) {
            this.simulation.alpha(0.3).restart();
        }
    }
    
    // Method to refresh the live network view
    refreshLiveView() {
        // Clear any saved topology display
        this.clearCurrentVisualization();
        
        // If we have access to the app, fetch real agent data
        if (window.cosmicApp) {
            window.cosmicApp.fetchRealAIAgents();
        }
    }
    
    updateNodesFromAgents(agents) {
        this.nodes = Array.from(agents.values()).map(agent => {
            // Check if this is Prof. Smoot
            const isProfSmoot = agent.name && agent.name.includes('Prof. Smoot');
            if (isProfSmoot) {
                this.profSmootId = agent.id;
            }
            
            return {
                id: agent.id,
                name: agent.name || `Agent-${agent.id.slice(0, 8)}`,
                type: agent.type || 'general',
                status: agent.status || 'online',
                isProfSmoot: isProfSmoot,
                // Ensure proper positioning within the SVG viewBox
                x: agent.position?.x ? agent.position.x * this.width : Math.random() * this.width,
                y: agent.position?.y ? agent.position.y * this.height : Math.random() * this.height
            };
        });
    }
    
    updateLinksFromTopology(topology) {
        if (topology.connections) {
            this.links = topology.connections.map(conn => ({
                source: conn.source,
                target: conn.target,
                strength: conn.strength || 0.5,
                type: conn.type || 'collaboration'
            }));
            
            console.log('Updated links:', this.links.length);
        }
    }
    
    updateTopology(data) {
        if (data.nodes) {
            this.updateNodesFromAgents(new Map(data.nodes.map(node => [node.id, node])));
        }
        
        if (data.edges) {
            this.links = data.edges.map(edge => ({
                source: edge.source,
                target: edge.target,
                strength: edge.weight || 0.5,
                type: edge.type || 'collaboration'
            }));
        }
        
        // Convert link references to ensure proper connections
        this.convertLinkReferences();
        
        this.render();
    }
    
    // Method to highlight the current execution step in the visualization
    highlightExecutionStep(stepData) {
        if (!this.svg) return;
        
        // Highlight the agent node
        this.svg.selectAll('.node')
            .filter(d => d.id === stepData.agentId)
            .select('circle')
            .attr('stroke', '#ffeb3b')
            .attr('stroke-width', 4);
        
        // Highlight the task node
        this.svg.selectAll('.node')
            .filter(d => d.id === stepData.taskId)
            .select('circle')
            .attr('stroke', '#ffeb3b')
            .attr('stroke-width', 4);
        
        // Highlight the link between agent and task
        this.svg.selectAll('.link')
            .filter(d => d.source.id === stepData.agentId && d.target.id === stepData.taskId)
            .attr('stroke', '#ffeb3b')
            .attr('stroke-width', 3);
    }
}