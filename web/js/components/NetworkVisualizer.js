// 网络拓扑可视化组件
export class NetworkVisualizer {
    constructor(containerSelector) {
        this.containerSelector = containerSelector;
        this.container = null;
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
        
        // Flag to track if initialization has been attempted
        this.initialized = false;
        this.initAttempts = 0;
        this.maxInitAttempts = 30; // Increased retry attempts
    }
    
    // Add method to dynamically load D3 if not available
    async loadD3() {
        // Check if D3 is already loaded
        if (typeof d3 !== 'undefined') {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            // Check if script is already being loaded
            const existingScript = document.querySelector('script[src*="d3js.org"]');
            if (existingScript) {
                // Wait a bit and resolve
                setTimeout(() => {
                    if (typeof d3 !== 'undefined') {
                        resolve();
                    } else {
                        reject(new Error('D3.js failed to load'));
                    }
                }, 1000);
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://d3js.org/d3.v7.min.js';
            script.onload = () => {
                resolve();
            };
            script.onerror = (error) => {
                reject(error);
            };
            document.head.appendChild(script);
        });
    }
    
    // Enhanced init method with better error handling and visibility checks
    async init() {
        // Mark as initialized attempt
        this.initialized = true;
        this.initAttempts++;
        
        // Add a timeout to prevent infinite hanging
        const initTimeout = setTimeout(() => {
            this.handleInitializationError('Initialization timed out');
        }, 10000); // 10 second timeout
        
        // Find container element
        this.container = document.querySelector(this.containerSelector);
        if (!this.container) {
            clearTimeout(initTimeout); // Clear timeout
            // Try to find the container by ID directly
            this.container = document.getElementById(this.containerSelector.replace('#', ''));
            if (!this.container) {
                // Try again after a delay if we haven't exceeded max attempts
                if (this.initAttempts < this.maxInitAttempts) {
                    setTimeout(() => {
                        this.init();
                    }, 200);
                } else {
                    this.handleInitializationError('Maximum initialization attempts reached');
                }
                return;
            }
        }
        
        // Ensure container is visible
        this.container.style.display = 'block';
        this.container.style.visibility = 'visible';
        
        // Remove loading indicator if it exists
        this.removeLoadingIndicator();
        
        // Check if D3 is available, and load it if not
        if (typeof d3 === 'undefined') {
            try {
                await this.loadD3();
            } catch (error) {
                clearTimeout(initTimeout); // Clear timeout
                this.handleInitializationError('Failed to load D3.js: ' + error.message);
                return;
            }
        }
        
        // Clear container
        this.container.innerHTML = '';
        
        // Get container dimensions
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width || 800;
        this.height = rect.height || 500; // Increased default height
        
        // If container is not visible, use default dimensions
        if (this.width === 0 || this.height === 0) {
            this.width = 800;
            this.height = 500;
        }
        
        try {
            // Create controls for saved topologies
            this.createTopologyControls();
            
            // Create SVG
            this.svg = d3.select(this.container)
                .append('svg')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('viewBox', `0 0 ${this.width} ${this.height}`)
                .attr('preserveAspectRatio', 'xMidYMid meet')
                .style('display', 'block'); // Ensure SVG is displayed
            
            // Add background
            this.svg.append('rect')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('fill', 'rgba(0,0,0,0.2)');
            
            // Create groups
            this.svg.append('g').attr('class', 'links');
            this.svg.append('g').attr('class', 'nodes');
            
            // Initialize force simulation
            this.initSimulation();
            
            // Generate sample data
            this.generateSampleData();
            this.render();
            
            // Clear the timeout since initialization completed successfully
            clearTimeout(initTimeout);
            
            // Dispatch a custom event to notify that initialization is complete
            if (typeof CustomEvent !== 'undefined' && typeof window !== 'undefined') {
                const event = new CustomEvent('networkVisualizerInitialized', { 
                    detail: { 
                        nodes: this.nodes.length, 
                        links: this.links.length 
                    } 
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            clearTimeout(initTimeout); // Clear timeout
            this.handleInitializationError('Error during initialization: ' + error.message);
        }
    }
    
    // Handle initialization errors with proper UI feedback
    handleInitializationError(errorMessage) {
        // Make sure we have a container
        if (!this.container) {
            this.container = document.querySelector(this.containerSelector) || 
                           document.getElementById(this.containerSelector.replace('#', ''));
        }
        
        if (this.container) {
            // Remove loading indicator
            this.removeLoadingIndicator();
            
            // Show error message in the dedicated error container
            const errorContainer = document.getElementById('network-viz-error');
            const errorMessageElement = document.getElementById('network-viz-error-message');
            if (errorContainer && errorMessageElement) {
                errorMessageElement.textContent = errorMessage;
                errorContainer.style.display = 'block';
                
                // Hide the loading indicator
                const loadingIndicator = this.container.querySelector('#network-viz-loading');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            } else {
                // Fallback: Show error in container
                this.container.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #ef4444; font-size: 18px; text-align: center; padding: 20px;">
                        <div>
                            <div>❌ Network visualization failed to initialize</div>
                            <div style="font-size: 14px; margin-top: 10px;">${errorMessage}</div>
                            <button onclick="window.location.reload()" style="background: #0ea5e9; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 15px;">Refresh Page</button>
                        </div>
                    </div>
                `;
            }
        }
        
        // Try to create fallback visualization
        setTimeout(() => {
            this.createFallbackVisualization();
        }, 500);
    }

    // Remove loading indicator properly
    removeLoadingIndicator() {
        if (this.container) {
            const loadingIndicator = this.container.querySelector('#network-viz-loading');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
                // Remove it completely after a short delay to ensure it's not visible
                setTimeout(() => {
                    if (loadingIndicator.parentNode === this.container) {
                        this.container.removeChild(loadingIndicator);
                    }
                }, 100);
            }
        }
    }
    
    // Method to ensure initialization when DOM is ready
    initWhenReady(maxRetries = 30, retryDelay = 200) {
        const attemptInit = (retriesLeft) => {
            // Check if container exists and is visible
            const container = document.querySelector(this.containerSelector) || 
                            document.getElementById(this.containerSelector.replace('#', ''));
            
            if (container) {
                const rect = container.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    this.init();
                    return;
                } else {
                    container.style.display = 'block';
                }
            }
            
            if (retriesLeft > 0) {
                setTimeout(() => attemptInit(retriesLeft - 1), retryDelay);
            } else {
                this.handleInitializationError('Container not found or not visible after all retries');
            }
        };
        
        // Start the initialization attempts
        attemptInit(maxRetries);
    }
    
    // Method to re-initialize the NetworkVisualizer if needed
    reinitialize() {
        // Reset internal state
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.initialized = false;
        this.initAttempts = 0; // Reset attempts counter
        
        // Clear container if it exists
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // Try to find container again
        this.container = document.querySelector(this.containerSelector) || 
                        document.getElementById(this.containerSelector.replace('#', ''));
        
        if (this.container) {
            // Ensure container is visible
            this.container.style.display = 'block';
            this.init();
        } else {
            // Try initWhenReady as fallback
            this.initWhenReady(30, 200);
        }
    }
    
    createTopologyControls() {
        // Check if container exists and has a parent
        if (!this.container) {
            return;
        }
        
        // Create a div for topology controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'topology-controls';
        controlsDiv.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center; gap: 10px;';
        
        // Create saved topologies dropdown
        const topologySelect = document.createElement('select');
        topologySelect.id = 'saved-topologies';
        topologySelect.innerHTML = '<option value="">Live Network</option>';
        
        // Create refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Refresh';
        refreshBtn.className = 'btn';
        refreshBtn.addEventListener('click', () => {
            // Request fresh data from the app if available
            if (window.cosmicApp) {
                window.cosmicApp.fetchRealAIAgents();
            }
        });
        
        // Create clear button
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.className = 'btn';
        clearBtn.addEventListener('click', () => {
            this.clearCurrentVisualization();
        });
        
        // Append elements to controls div
        controlsDiv.appendChild(topologySelect);
        controlsDiv.appendChild(refreshBtn);
        controlsDiv.appendChild(clearBtn);
        
        // Try to insert controls before the container
        try {
            if (this.container.parentNode) {
                this.container.parentNode.insertBefore(controlsDiv, this.container);
                this.topologyDropdown = topologySelect;
            } else {
                this.container.appendChild(controlsDiv);
                this.topologyDropdown = topologySelect;
            }
        } catch (error) {
            // Fallback: append to container
            this.container.appendChild(controlsDiv);
            this.topologyDropdown = topologySelect;
        }
        
        // Add event listener to dropdown
        topologySelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.displaySavedTopology(e.target.value);
            } else {
                this.refreshLiveView();
            }
        });
    }
    
    updateSavedTopologiesDropdown() {
        if (!this.topologyDropdown || !this.savedTopologies) {
            return;
        }
        
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
        if (!this.svg) {
            return;
        }
        
        // Update link positions
        const links = this.svg.selectAll('.link');
        links
            .attr('x1', d => {
                const x = typeof d.source === 'object' ? d.source.x : 0;
                return x || 0;
            })
            .attr('y1', d => {
                const y = typeof d.source === 'object' ? d.source.y : 0;
                return y || 0;
            })
            .attr('x2', d => {
                const x = typeof d.target === 'object' ? d.target.x : 0;
                return x || 0;
            })
            .attr('y2', d => {
                const y = typeof d.target === 'object' ? d.target.y : 0;
                return y || 0;
            });
        
        // Update node positions
        const nodes = this.svg.selectAll('.node');
        nodes
            .attr('transform', d => {
                const x = d.x || 0;
                const y = d.y || 0;
                return `translate(${x},${y})`;
            });
    }
    
    generateSampleData() {
        // Generate sample nodes
        this.nodes = [
            { id: 'agent1', name: 'Prof. Smoot', type: 'cosmic_structure_expert', status: 'active', x: this.width * 0.3, y: this.height * 0.3, isProfSmoot: true },
            { id: 'agent2', name: 'Dr. Analyzer', type: 'analyzer', status: 'processing', x: this.width * 0.7, y: this.height * 0.3 },
            { id: 'agent3', name: 'Ms. Synthesizer', type: 'synthesizer', status: 'active', x: this.width * 0.5, y: this.height * 0.7 },
            { id: 'agent4', name: 'Mr. Connector', type: 'connector', status: 'online', x: this.width * 0.2, y: this.height * 0.5 },
            { id: 'agent5', name: 'Ms. Evaluator', type: 'evaluator', status: 'online', x: this.width * 0.8, y: this.height * 0.5 }
        ];
        
        // Generate sample links
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
        if (!this.nodes || !this.links) {
            return;
        }
        
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
            
            // Return the link with converted references, even if some are missing
            // This allows partial connections to still be rendered
            return {
                ...link,
                source: sourceNode || link.source,
                target: targetNode || link.target
            };
        });
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
            default:
                // Default to force layout
                this.applyForceLayout();
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
        if (this.svg) {
            this.svg.selectAll('.node circle')
                .attr('r', this.nodeSize);
        }
        
        if (this.simulation) {
            this.simulation.force('collision').radius(this.nodeSize + 5);
            this.simulation.alpha(0.1).restart();
        }
    }
    
    // Enhanced render method with better visibility handling
    render() {
        // Only render if we have nodes and links
        if (!this.nodes || !this.links) {
            return;
        }
        
        // Check if SVG is available
        if (!this.svg) {
            this.init();
            return;
        }
        
        // Make sure the SVG is visible
        this.svg.style('display', 'block'); // Explicitly set to block display
        this.svg.style('visibility', 'visible'); // Ensure visibility
        
        // Ensure container is visible
        if (this.container) {
            this.container.style.display = 'block';
            this.container.style.visibility = 'visible';
        }
        
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
        if (!this.svg) {
            return;
        }
        
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
            
        // Log the actual rendered nodes for debugging
    }
    
    renderLinks() {
        if (!this.svg) {
            return;
        }
        
        const linkSelection = this.svg.select('.links')
            .selectAll('.link')
            .data(this.links, d => {
                // Handle both string and object references
                const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
                const targetId = typeof d.target === 'string' ? d.target : d.target.id;
                return `${sourceId}-${targetId}`;
            });
        
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
            
        // Log the actual rendered links for debugging
    }
    
    getNodeColor(node) {
        if (node.isProfSmoot) {
            return '#9333ea'; // Purple for Prof. Smoot
        }
        if (node.group === 'agent') {
            const typeColors = {
                'analyzer': '#3b82f6',
                'reasoner': '#10b981',
                'synthesizer': '#f59e0b',
                'validator': '#ef4444',
                'innovator': '#8b5cf6',
                'cosmic_structure_expert': '#9333ea'
            };
            const color = typeColors[node.type] || '#60a5fa';
            return color;
        }
        return '#94a3b8'; // Default color for tasks
    }
    
    getNodeStroke(node) {
        if (node.isProfSmoot) {
            return '#ffffff';
        }
        if (node.status === 'completed') {
            return '#10b981';
        }
        if (node.status === 'busy') {
            return '#f59e0b';
        }
        if (node.status === 'offline') {
            return '#ef4444';
        }
        return '#ffffff';
    }
    
    getNodeLabel(node) {
        if (node.name) {
            const label = node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name;
            return label;
        }
        const label = node.id.substring(0, 8);
        return label;
    }
    
    getLinkColor(link) {
        const typeColors = {
            'execution': '#60a5fa',
            'sequence': '#10b981',
            'collaboration': '#8b5cf6',
            'data_flow': '#f59e0b'
        };
        const color = typeColors[link.type] || '#94a3b8';
        return color;
    }
    
    getLinkWidth(link) {
        if (link.type === 'sequence') {
            return 2;
        }
        if (link.type === 'execution') {
            return 3;
        }
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
    
    // Enhanced update method with better error handling
    update(systemState) {
        // Don't update if we have a saved topology displayed
        // But allow update if we're explicitly requesting a live view refresh
        if (this.hasSavedTopologyDisplayed() && !this._forceLiveUpdate) {
            return;
        }
        
        // Reset the force live update flag
        this._forceLiveUpdate = false;
        
        // If not initialized, try to initialize first
        if (!this.initialized || !this.svg) {
            this.initWhenReady(20, 200);
            
            // Wait a bit and then try to update
            setTimeout(() => {
                this._performUpdate(systemState);
            }, 800); // Increased delay
            return;
        }
        
        this._performUpdate(systemState);
    }
    
    _performUpdate(systemState) {
        if (!this.svg) {
            this.init();
            return;
        }
        
        // Ensure SVG and container are visible
        this.svg.style('display', 'block');
        this.svg.style('visibility', 'visible');
        if (this.container) {
            this.container.style.display = 'block';
            this.container.style.visibility = 'visible';
        }
        
        // Update nodes and connections data
        if (systemState && systemState.agents && systemState.agents.size > 0) {
            this.updateNodesFromAgents(systemState.agents);
        } else {
            this.generateSampleData();
        }
        
        if (systemState && systemState.topology && systemState.topology.connections) {
            this.updateLinksFromTopology(systemState.topology);
        } else {
            // Make sure we have sample data if no topology data is provided
            if (this.links.length === 0) {
                this.generateSampleData();
            }
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
        
        // Make sure the SVG is visible
        if (this.svg) {
            this.svg.style('display', 'block'); // Ensure SVG is displayed
            this.svg.style('visibility', 'visible'); // Ensure visibility
        }
    }
    
    updateWithTaskChain(taskChainData) {
        // If not initialized, try to initialize first
        if (!this.initialized || !this.svg) {
            this.initWhenReady(10, 100);
            
            // Wait a bit and then try to update
            setTimeout(() => {
                this._performUpdateWithTaskChain(taskChainData);
            }, 500);
            return;
        }
        
        this._performUpdateWithTaskChain(taskChainData);
    }
    
    _performUpdateWithTaskChain(taskChainData) {
        if (!taskChainData || !taskChainData.executionPath) {
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
    }
    
    // Method to display a saved topology
    displaySavedTopology(taskChainId) {
        if (!this.savedTopologies) {
            return false;
        }
        
        const savedTopology = this.savedTopologies.get(taskChainId);
        if (!savedTopology) {
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
            const result = this.savedTopologies.has(this.topologyDropdown.value);
            return result;
        }
        
        // Fallback check: see if we have nodes that look like task chain nodes
        // (nodes with both agent and task groups)
        if (this.nodes && this.nodes.length > 0) {
            const hasTaskNodes = this.nodes.some(node => node.group === 'task');
            const hasAgentNodes = this.nodes.some(node => node.group === 'agent');
            const result = hasTaskNodes && hasAgentNodes;
            return result;
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
        // Set flag to force live update
        this._forceLiveUpdate = true;
        
        // Clear any saved topology display
        this.clearCurrentVisualization();
        
        // If we have access to the app, fetch real agent data
        if (window.cosmicApp) {
            window.cosmicApp.fetchRealAIAgents();
        }
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
    }
    
    updateLinksFromTopology(topology) {
        if (topology.connections) {
            this.links = topology.connections.map(conn => ({
                source: conn.source,
                target: conn.target,
                strength: conn.strength || 0.5,
                type: conn.type || 'collaboration'
            }));
        }
    }
    
    updateTopology(data) {
        // If not initialized, try to initialize first
        if (!this.initialized || !this.svg) {
            this.initWhenReady(10, 100);
            
            // Wait a bit and then try to update
            setTimeout(() => {
                this._performUpdateTopology(data);
            }, 500);
            return;
        }
        
        this._performUpdateTopology(data);
    }
    
    _performUpdateTopology(data) {
        // Check if we have the required data structure
        if (!data) {
            return;
        }
        
        if (data.nodes) {
            this.updateNodesFromAgents(new Map(data.nodes.map(node => [node.id, node])));
        } else if (data.agents) {
            // Handle the case where the data comes with agents instead of nodes
            this.updateNodesFromAgents(new Map(data.agents.map(agent => [agent.id, agent])));
        }
        
        if (data.edges) {
            this.links = data.edges.map(edge => ({
                source: edge.source,
                target: edge.target,
                strength: edge.weight || 0.5,
                type: edge.type || 'collaboration'
            }));
        } else if (data.connections) {
            // Handle the case where the data comes with connections instead of edges
            this.links = data.connections.map(conn => ({
                source: conn.source,
                target: conn.target,
                strength: conn.strength || 0.5,
                type: conn.type || 'collaboration'
            }));
        }
        
        // Convert link references to ensure proper connections
        this.convertLinkReferences();
        
        this.render();
    }
    
    // Method to highlight the current execution step in the visualization
    highlightExecutionStep(stepData) {
        if (!this.svg) {
            return;
        }
        
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
    
    // Method to update visualization with agents data (missing method that was being called)
    updateWithAgents(agents) {
        // If not initialized, try to initialize first
        if (!this.initialized || !this.svg) {
            this.initWhenReady(10, 100);
            
            // Wait a bit and then try to update
            setTimeout(() => {
                this._performUpdateWithAgents(agents);
            }, 500);
            return;
        }
        
        this._performUpdateWithAgents(agents);
    }
    
    _performUpdateWithAgents(agents) {
        // Update nodes from agents data
        this.updateNodesFromAgents(new Map(agents.map(agent => [agent.id, agent])));
        
        // Since we don't have topology data, we'll use sample links
        this.generateSampleLinks(); // Generate sample links specifically
        
        // Render the visualization
        this.render();
    }
    
    // Generate sample links specifically for the current nodes
    generateSampleLinks() {
        if (!this.nodes || this.nodes.length === 0) {
            this.links = [];
            return;
        }
        
        // Create links between nodes in a circular pattern
        this.links = [];
        for (let i = 0; i < this.nodes.length; i++) {
            const sourceNode = this.nodes[i];
            const targetNode = this.nodes[(i + 1) % this.nodes.length];
            
            this.links.push({
                source: sourceNode,
                target: targetNode,
                strength: 0.5 + Math.random() * 0.5,
                type: ['collaboration', 'coordination', 'data_flow'][Math.floor(Math.random() * 3)]
            });
        }
        
        // Add some additional random links
        if (this.nodes.length > 2) {
            for (let i = 0; i < this.nodes.length; i++) {
                if (Math.random() > 0.7) { // 30% chance to add an extra link
                    const sourceIndex = i;
                    let targetIndex;
                    do {
                        targetIndex = Math.floor(Math.random() * this.nodes.length);
                    } while (targetIndex === sourceIndex);
                    
                    this.links.push({
                        source: this.nodes[sourceIndex],
                        target: this.nodes[targetIndex],
                        strength: 0.3 + Math.random() * 0.4,
                        type: ['execution', 'sequence'][Math.floor(Math.random() * 2)]
                    });
                }
            }
        }
    }
    
    // Method to update a single agent (missing method that was being called)
    updateAgent(agentData) {
        // If not initialized, try to initialize first
        if (!this.initialized || !this.svg) {
            this.initWhenReady(10, 100);
            
            // Wait a bit and then try to update
            setTimeout(() => {
                this._performUpdateAgent(agentData);
            }, 500);
            return;
        }
        
        this._performUpdateAgent(agentData);
    }
    
    _performUpdateAgent(agentData) {
        // Update the agent in the system state
        if (window.cosmicApp && window.cosmicApp.systemState && window.cosmicApp.systemState.agents) {
            window.cosmicApp.systemState.agents.set(agentData.id, agentData);
        }
        
        // Update the visualization
        this.update(window.cosmicApp ? window.cosmicApp.systemState : null);
    }
    
    // Method to resize the visualization (missing method that was being called)
    resize() {
        // Re-find container if not already found
        if (!this.container) {
            this.container = document.querySelector(this.containerSelector) || 
                           document.getElementById(this.containerSelector.replace('#', ''));
            
            if (!this.container) {
                return;
            }
        }
        
        try {
            // Get new dimensions
            const rect = this.container.getBoundingClientRect();
            this.width = rect.width || 800;
            this.height = rect.height || 400;
            
            // If container is not visible, use default dimensions
            if (this.width === 0 || this.height === 0) {
                this.width = 800;
                this.height = 400;
            }
            
            // If SVG doesn't exist, initialize the visualization
            if (!this.svg) {
                this.init();
                return;
            }
            
            // Update SVG viewBox
            if (this.svg) {
                this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`);
            }
            
            // Update simulation center force
            if (this.simulation) {
                this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
                this.simulation.alpha(0.3).restart();
            }
        } catch (error) {
            // Try to re-initialize if resize failed
            this.init();
        }
    }
    
    // Method to check if the visualization is properly set up
    isProperlySetUp() {
        const result = !!(this.container && this.svg && this.simulation && this.nodes.length > 0 && this.links.length > 0);
        return result;
    }
    
    // Method to force the visualization to be visible and properly rendered
    forceRender() {
        // Make sure container is visible
        if (this.container) {
            this.container.style.display = 'block';
            
            // Remove any loading indicator
            this.removeLoadingIndicator();
        }
        
        // If not initialized, initialize first
        if (!this.initialized || !this.svg) {
            this.initWhenReady(20, 200);
            return;
        }
        
        // Make sure SVG is visible
        if (this.svg) {
            this.svg.style('display', null); // Remove any display:none
        }
        
        // Force a render
        this.render();
        
        // Restart simulation if it exists
        if (this.simulation) {
            this.simulation.alpha(0.5).restart();
        }
    }
    
    // Method to check if container is available and initialize if it is
    checkAndInitialize() {
        // Check if container exists
        const container = document.querySelector(this.containerSelector) || 
                         document.getElementById(this.containerSelector.replace('#', ''));
        
        if (container && !this.initialized) {
            this.initWhenReady(10, 100);
            return true;
        }
        
        return false;
    }
    
    // Method to manually trigger initialization (for button click)
    manualInit() {
        // Reset initialization attempts
        this.initAttempts = 0;
        // Force reinitialization
        this.reinitialize();
    }
    
    // Fallback method to create a simple visualization if normal initialization fails
    createFallbackVisualization() {
        try {
            // Find container element
            this.container = document.querySelector(this.containerSelector);
            if (!this.container) {
                this.container = document.getElementById(this.containerSelector.replace('#', ''));
            }
            
            if (!this.container) {
                this.handleInitializationError('Container not found for fallback visualization');
                return;
            }
            
            // Remove loading indicator
            this.removeLoadingIndicator();
            
            // Clear container
            this.container.innerHTML = '';
            
            // Get container dimensions
            const rect = this.container.getBoundingClientRect();
            this.width = rect.width || 800;
            this.height = rect.height || 500;
            
            // Create simple SVG with basic nodes and links
            this.svg = d3.select(this.container)
                .append('svg')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('viewBox', `0 0 ${this.width} ${this.height}`)
                .attr('preserveAspectRatio', 'xMidYMid meet')
                .style('display', 'block');
            
            // Add background
            this.svg.append('rect')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('fill', 'rgba(0,0,0,0.2)');
            
            // Create sample nodes
            const nodes = [
                { id: 'agent1', x: this.width * 0.3, y: this.height * 0.3, name: 'Prof. Smoot' },
                { id: 'agent2', x: this.width * 0.7, y: this.height * 0.3, name: 'Dr. Analyzer' },
                { id: 'agent3', x: this.width * 0.5, y: this.height * 0.7, name: 'Ms. Synthesizer' }
            ];
            
            // Create sample links
            const links = [
                { source: nodes[0], target: nodes[1] },
                { source: nodes[1], target: nodes[2] },
                { source: nodes[0], target: nodes[2] }
            ];
            
            // Draw links
            this.svg.append('g')
                .selectAll('line')
                .data(links)
                .enter()
                .append('line')
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y)
                .attr('stroke', '#94a3b8')
                .attr('stroke-width', 2);
            
            // Draw nodes
            const nodeGroup = this.svg.append('g')
                .selectAll('g')
                .data(nodes)
                .enter()
                .append('g')
                .attr('transform', d => `translate(${d.x},${d.y})`);
            
            // Add circles
            nodeGroup.append('circle')
                .attr('r', 20)
                .attr('fill', (d, i) => ['#9333ea', '#3b82f6', '#f59e0b'][i])
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 2);
            
            // Add labels
            nodeGroup.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', 30)
                .attr('fill', '#ffffff')
                .attr('font-size', '12px')
                .text(d => d.name);
        } catch (error) {
            this.handleInitializationError('Error creating fallback visualization: ' + error.message);
        }
    }
}