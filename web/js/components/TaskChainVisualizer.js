// Task Chain Visualizer Component
export class TaskChainVisualizer {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.taskChainData = null;
        
        this.width = 0;
        this.height = 0;
    }
    
    init() {
        console.log('TaskChainVisualizer init() called');
        
        if (!this.container) {
            console.error('Container not found for TaskChainVisualizer');
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
        
        console.log('✅ TaskChainVisualizer initialized successfully');
    }
    
    initSimulation() {
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).strength(1))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(this.width / 2, this.height / 2))
            .force('collision', d3.forceCollide().radius(20));
            
        // Ensure proper tick handling
        this.simulation.on('tick', () => {
            this.tick();
        });
    }
    
    tick() {
        // Update link positions
        this.svg.selectAll('.link')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        // Update node positions
        this.svg.selectAll('.node')
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }
    
    updateTaskChain(taskChainData) {
        console.log('Updating task chain visualization:', taskChainData);
        
        if (!taskChainData || !taskChainData.executionPath) {
            console.warn('No task chain data or execution path provided');
            return;
        }
        
        this.taskChainData = taskChainData;
        
        // Convert execution path to nodes and links
        this.convertExecutionPathToGraph(taskChainData.executionPath);
        
        // Render the visualization
        this.render();
    }
    
    convertExecutionPathToGraph(executionPath) {
        // Create nodes for each unique agent
        const agentNodes = new Map();
        const taskNodes = new Map();
        
        // Process execution path to create nodes
        executionPath.forEach((step, index) => {
            // Add agent node if not exists
            if (!agentNodes.has(step.agentId)) {
                agentNodes.set(step.agentId, {
                    id: step.agentId,
                    name: `Agent-${step.agentId.substring(0, 8)}`,
                    type: 'agent',
                    status: 'completed',
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    group: 'agent'
                });
            }
            
            // Add task node
            const taskId = step.taskId;
            if (!taskNodes.has(taskId)) {
                taskNodes.set(taskId, {
                    id: taskId,
                    name: `Task-${taskId.substring(0, 8)}`,
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
        this.links = executionPath.map(step => ({
            source: step.agentId,
            target: step.taskId,
            type: 'execution',
            timestamp: step.timestamp,
            heatLevel: step.heatLevel || 0.5
        }));
        
        // Add sequential links between tasks based on execution order
        for (let i = 0; i < executionPath.length - 1; i++) {
            this.links.push({
                source: executionPath[i].taskId,
                target: executionPath[i + 1].taskId,
                type: 'sequence',
                timestamp: executionPath[i].timestamp
            });
        }
        
        console.log('Converted execution path to graph:', {
            nodes: this.nodes.length,
            links: this.links.length
        });
    }
    
    render() {
        if (!this.svg) {
            console.error('SVG not initialized');
            return;
        }
        
        this.renderLinks();
        this.renderNodes();
        
        if (this.simulation) {
            // Update the simulation with current nodes and links
            this.simulation.nodes(this.nodes);
            this.simulation.force('link').links(this.links);
            
            // Restart the simulation to apply changes
            this.simulation.alpha(0.3).restart();
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
        
        // Add circles with different icons based on node type
        nodeEnter.append('circle')
            .attr('r', d => this.getNodeSize(d))
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', d => this.getNodeStroke(d))
            .attr('stroke-width', 2);
        
        // Add icons
        nodeEnter.append('text')
            .attr('x', 0)
            .attr('y', 5)
            .attr('text-anchor', 'middle')
            .attr('class', 'node-icon')
            .text(d => this.getNodeIcon(d));
        
        // Add labels
        nodeEnter.append('text')
            .attr('x', 0)
            .attr('y', d => this.getNodeSize(d) + 15)
            .attr('text-anchor', 'middle')
            .attr('class', 'node-label')
            .text(d => this.getNodeLabel(d));
        
        // Update
        const nodeUpdate = nodeEnter.merge(nodeSelection);
        
        nodeUpdate.select('circle')
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', d => this.getNodeStroke(d));
        
        nodeUpdate.select('.node-icon')
            .text(d => this.getNodeIcon(d));
        
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
            .attr('stroke-opacity', 0.7);
        
        const linkUpdate = linkEnter.merge(linkSelection);
        
        linkUpdate
            .attr('stroke', d => this.getLinkColor(d))
            .attr('stroke-width', d => this.getLinkWidth(d));
    }
    
    getNodeIcon(node) {
        if (node.type === 'agent') {
            if (node.isProfSmoot) return '🌌'; // Special icon for Prof. Smoot
            return '🤖'; // Robot icon for agents
        }
        if (node.type === 'task') return '📋'; // Clipboard icon for tasks
        return '●'; // Default icon
    }
    
    getNodeSize(node) {
        if (node.type === 'agent') return 20;
        if (node.type === 'task') return 15;
        return 10;
    }
    
    getNodeColor(node) {
        if (node.isProfSmoot) return '#9333ea'; // Purple for Prof. Smoot
        if (node.type === 'agent') {
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
        if (node.type === 'task') return '#94a3b8';
        return '#60a5fa';
    }
    
    getNodeStroke(node) {
        if (node.status === 'completed') return '#10b981';
        if (node.status === 'busy') return '#f59e0b';
        if (node.status === 'offline') return '#ef4444';
        return '#ffffff';
    }
    
    getNodeLabel(node) {
        if (node.name) {
            return node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name;
        }
        return node.id.substring(0, 8);
    }
    
    getLinkColor(link) {
        const typeColors = {
            'execution': '#60a5fa',
            'sequence': '#10b981'
        };
        return typeColors[link.type] || '#94a3b8';
    }
    
    getLinkWidth(link) {
        if (link.type === 'sequence') return 3;
        if (link.type === 'execution') return 2;
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
    
    // Enhanced method to convert execution path to graph with better topology
    convertExecutionPathToGraph(executionPath) {
        // Create nodes for each unique agent
        const agentNodes = new Map();
        const taskNodes = new Map();
        
        // Process execution path to create nodes
        executionPath.forEach((step, index) => {
            // Add agent node if not exists
            if (!agentNodes.has(step.agentId)) {
                agentNodes.set(step.agentId, {
                    id: step.agentId,
                    name: `Agent-${step.agentId.substring(0, 8)}`,
                    type: 'agent',
                    status: 'completed',
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    group: 'agent'
                });
            }
            
            // Add task node
            const taskId = step.taskId;
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
        this.links = executionPath.map(step => ({
            source: step.agentId,
            target: step.taskId,
            type: 'execution',
            timestamp: step.timestamp,
            heatLevel: step.heatLevel || 0.5
        }));
        
        // Add sequential links between tasks based on execution order
        for (let i = 0; i < executionPath.length - 1; i++) {
            this.links.push({
                source: executionPath[i].taskId,
                target: executionPath[i + 1].taskId,
                type: 'sequence',
                timestamp: executionPath[i].timestamp
            });
        }
        
        console.log('Converted execution path to graph:', {
            nodes: this.nodes.length,
            links: this.links.length
        });
    }
    
    clear() {
        console.log('Clearing task chain visualization');
        
        // Clear data
        this.nodes = [];
        this.links = [];
        this.taskChainData = null;
        
        // Clear SVG elements
        if (this.svg) {
            this.svg.select('.nodes').selectAll('*').remove();
            this.svg.select('.links').selectAll('*').remove();
        }
        
        // Stop simulation
        if (this.simulation) {
            this.simulation.stop();
        }
    }
    
    // Method to refresh the visualization
    refresh() {
        if (this.taskChainData) {
            this.updateTaskChain(this.taskChainData);
        }
    }
}