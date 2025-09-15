import { AIAgent } from './AIAgent.js';

/**
 * Prof. George Smoot - Cosmic Structure Expert Agent
 * Specialized agent responsible for task allocation and optimization
 * leveraging expertise in cosmic background radiation and gravitational analysis
 */
export class ProfSmootAgent extends AIAgent {
  constructor(config = {}) {
    const smootConfig = {
      name: 'Prof. Smoot',
      type: 'cosmic_structure_expert',
      mass: 2.5, // High influence due to expertise
      capabilities: [
        'cosmic_structure_analysis',
        'gravitational_field_modeling',
        'task_allocation_optimization',
        'collaboration_network_analysis',
        'semantic_perturbation_mapping'
      ],
      expertise: [
        'cosmic_background_radiation',
        'gravitational_anisotropy',
        'cosmic_structure_theory',
        'perturbation_field_analysis',
        'network_optimization'
      ],
      personality: [
        'analytical',
        'methodical',
        'precise',
        'knowledgeable',
        'collaborative'
      ],
      systemPrompt: `You are Prof. George Smoot III, Nobel laureate in Physics (2006) for work on the Cosmic Background Explorer. 
You are the world's leading expert on cosmic background radiation and gravitational anisotropy.

Role: Cosmic Structure Expert Agent
Specialization: Task allocation optimization using cosmic structure theory
Capabilities: 
- Analyzing collaboration networks as gravitational fields
- Optimizing agent assignments based on semantic perturbation maps
- Preventing collaboration islands through anisotropy analysis
- Leveraging domain expertise in cosmic structure for network analysis

You are responsible for:
1. Analyzing the semantic perturbation map to identify optimal task-agent assignments
2. Optimizing collaboration networks to prevent islands and maximize efficiency
3. Applying principles of cosmic structure theory to agent collaboration
4. Ensuring diverse and effective agent selection for complex tasks

Your approach:
- Think systematically about network optimization
- Apply gravitational field analogies to collaboration strength
- Consider both local and global optimization
- Balance specialization with collaboration diversity`,
      ...config
    };
    
    super(smootConfig);
    
    // Specialized properties for Prof. Smoot
    this.specialization = 'cosmic_structure_analysis';
    this.nobelPrize = {
      year: 2006,
      field: 'Physics',
      work: 'discovery of the black body form and anisotropy of the cosmic microwave background radiation'
    };
    
    // Initialize specialized methods
    this._initializeSmootAgent();
  }
  
  /**
   * Initialize Prof. Smoot specific capabilities
   */
  _initializeSmootAgent() {
    // Specialized event listeners for task allocation
    this.on('task-allocation-request', this._handleTaskAllocationRequest.bind(this));
    this.on('network-optimization-request', this._handleNetworkOptimizationRequest.bind(this));
  }
  
  /**
   * Handle task allocation requests using cosmic structure analysis
   */
  async _handleTaskAllocationRequest(event) {
    const { taskId, task, availableAgents } = event;
    
    try {
      const optimalAllocation = await this._analyzeTaskAllocation(task, availableAgents);
      
      this.emit('task-allocation-decision', {
        taskId,
        allocation: optimalAllocation,
        agentId: this.id
      });
      
      return optimalAllocation;
    } catch (error) {
      console.error(`Prof. Smoot allocation analysis failed:`, error);
      return null;
    }
  }
  
  /**
   * Direct method for task allocation analysis
   * This method can be called directly and returns the allocation decision
   */
  async allocateTask(task, availableAgents) {
    try {
      const optimalAllocation = await this._analyzeTaskAllocation(task, availableAgents);
      return optimalAllocation;
    } catch (error) {
      console.error(`Prof. Smoot direct allocation analysis failed:`, error);
      return null;
    }
  }
  
  /**
   * Handle network optimization requests
   */
  async _handleNetworkOptimizationRequest(event) {
    const { networkState, optimizationGoal } = event;
    
    try {
      const optimizationPlan = await this._analyzeNetworkOptimization(networkState, optimizationGoal);
      
      this.emit('network-optimization-plan', {
        plan: optimizationPlan,
        agentId: this.id
      });
      
      return optimizationPlan;
    } catch (error) {
      console.error(`Prof. Smoot network optimization failed:`, error);
      return null;
    }
  }
  
  /**
   * Analyze optimal task allocation using cosmic structure theory
   */
  async _analyzeTaskAllocation(task, availableAgents) {
    // Prepare context for cosmic structure analysis
    const analysisContext = {
      task: {
        id: task.id,
        description: task.description,
        complexity: task.complexity,
        priority: task.priority,
        requiredCapabilities: task.requiredCapabilities
      },
      agents: availableAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
        position: agent.position,
        mass: agent.mass,
        energy: agent.energy,
        performance: agent.performanceMetrics
      })),
      cosmicPrinciples: {
        gravitationalAnalogy: 'Agent mass and proximity determine collaboration strength',
        anisotropyPrevention: 'Ensure diverse agent selection to prevent collaboration islands',
        perturbationMapping: 'Semantic distance affects collaboration effectiveness',
        taskAllocationOptimization: 'Balance specialization with collaboration diversity for optimal results'
      }
    };
    
    // Use LLM to analyze optimal allocation
    const allocationPrompt = this._createAllocationPrompt(analysisContext);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.aiConfig.model,
        messages: [
          { role: 'system', content: this.aiConfig.systemPrompt },
          { role: 'user', content: allocationPrompt }
        ],
        temperature: 0.3, // Lower temperature for more precise analysis
        max_tokens: 800,
      });
      
      const response = completion.choices[0].message.content;
      const allocationDecision = this._parseAllocationResponse(response);
      
      // Store analysis in memory
      this._storeInMemory('allocation_analysis', {
        taskId: task.id,
        context: analysisContext,
        decision: allocationDecision,
        timestamp: Date.now()
      });
      
      return allocationDecision;
      
    } catch (error) {
      console.error('Allocation analysis error:', error);
      
      // Fallback to simple allocation
      return this._fallbackAllocation(task, availableAgents);
    }
  }
  
  /**
   * Analyze network optimization using cosmic structure principles
   */
  async _analyzeNetworkOptimization(networkState, optimizationGoal) {
    // Prepare context for network optimization
    const optimizationContext = {
      network: {
        agents: networkState.agents,
        connections: networkState.connections,
        perturbationMap: networkState.perturbationMap
      },
      goal: optimizationGoal,
      cosmicPrinciples: {
        gravitationalCenterIdentification: 'Identify high-mass agents as gravitational centers',
        anisotropyAnalysis: 'Detect and prevent collaboration islands',
        fieldOptimization: 'Balance network connectivity and specialization'
      }
    };
    
    // Use LLM to analyze optimization
    const optimizationPrompt = this._createOptimizationPrompt(optimizationContext);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use gpt-3.5-turbo for efficiency
        messages: [
          { role: 'system', content: this.aiConfig.systemPrompt },
          { role: 'user', content: optimizationPrompt }
        ],
        temperature: 0.4,
        max_tokens: 600,
      });
      
      const response = completion.choices[0].message.content;
      const optimizationPlan = this._parseOptimizationResponse(response);
      
      return optimizationPlan;
      
    } catch (error) {
      console.error('Network optimization error:', error);
      return this._fallbackOptimization(networkState, optimizationGoal);
    }
  }
  
  /**
   * Create allocation analysis prompt
   */
  _createAllocationPrompt(context) {
    return `As Prof. George Smoot, apply your expertise in cosmic structure theory to optimize task allocation:

TASK ANALYSIS:
ID: ${context.task.id}
Description: ${context.task.description}
Complexity: ${context.task.complexity}
Priority: ${context.task.priority}
Required Capabilities: ${context.task.requiredCapabilities?.join(', ') || 'None specified'}

AVAILABLE AGENTS:
${context.agents.map(agent => 
  `- ${agent.name} (${agent.type}): 
    Mass=${agent.mass}, 
    Energy=${agent.energy}, 
    Capabilities=[${agent.capabilities.slice(0, 5).join(', ')}],
    SuccessRate=${agent.performance?.successRate || 'N/A'}`
).join('\n')}

COSMIC STRUCTURE PRINCIPLES:
${Object.entries(context.cosmicPrinciples).map(([key, value]) => 
  `${key}: ${value}`
).join('\n')}

ANALYSIS INSTRUCTIONS:
1. Treat agent mass as gravitational influence in the collaboration network
2. Consider energy levels as agent availability
3. Match required capabilities with agent specializations
4. Apply anisotropy principles to ensure diverse agent selection
5. Prevent collaboration islands by balancing specialization with general capability
6. Consider performance metrics for reliability
7. Optimize for task complexity and priority

Provide your allocation decision in the following JSON format:
{
  "selectedAgents": ["agentId1", "agentId2"],
  "rationale": "Your detailed explanation (max 200 chars)",
  "confidence": 0.95,
  "optimizationFactors": ["gravitational_balance", "capability_match", "diversity_ensured", "performance_considered"]
}

ANALYSIS:`;
  }
  
  /**
   * Create network optimization prompt
   */
  _createOptimizationPrompt(context) {
    return `As Prof. George Smoot, apply cosmic structure theory to optimize the collaboration network:

NETWORK STATE:
Agents: ${context.network.agents.length}
Connections: ${context.network.connections.length}
Perturbation Map: ${context.network.perturbationMap ? 'Available' : 'Not available'}

OPTIMIZATION GOAL:
${context.goal}

COSMIC STRUCTURE PRINCIPLES:
${Object.entries(context.cosmicPrinciples).map(([key, value]) => 
  `${key}: ${value}`
).join('\n')}

Provide optimization recommendations in the following JSON format:
{
  "gravitationalCenters": ["agentId1", "agentId2"],
  "collaborationIslands": ["agentId3", "agentId4"],
  "optimizationActions": [
    "Action 1 to improve network connectivity",
    "Action 2 to balance specialization"
  ],
  "rationale": "Your detailed explanation (max 150 chars)"
}

ANALYSIS:`;
  }
  
  /**
   * Parse allocation response
   */
  _parseAllocationResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          selectedAgents: parsed.selectedAgents || [],
          rationale: parsed.rationale || 'Analysis completed',
          confidence: parsed.confidence || 0.8,
          optimizationFactors: parsed.optimizationFactors || []
        };
      }
    } catch (error) {
      console.warn('Failed to parse allocation JSON response');
    }
    
    // Fallback parsing
    return {
      selectedAgents: [],
      rationale: response.substring(0, 200),
      confidence: 0.7,
      optimizationFactors: ['fallback_analysis']
    };
  }
  
  /**
   * Parse optimization response
   */
  _parseOptimizationResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          gravitationalCenters: parsed.gravitationalCenters || [],
          collaborationIslands: parsed.collaborationIslands || [],
          optimizationActions: parsed.optimizationActions || [],
          rationale: parsed.rationale || 'Optimization analysis completed'
        };
      }
    } catch (error) {
      console.warn('Failed to parse optimization JSON response');
    }
    
    // Fallback parsing
    return {
      gravitationalCenters: [],
      collaborationIslands: [],
      optimizationActions: ['General network optimization'],
      rationale: response.substring(0, 150)
    };
  }
  
  /**
   * Fallback allocation method
   */
  _fallbackAllocation(task, availableAgents) {
    // Simple capability matching
    const requiredCaps = new Set(task.requiredCapabilities || []);
    
    const scoredAgents = availableAgents.map(agent => {
      const capabilityMatch = agent.capabilities.filter(cap => 
        requiredCaps.has(cap)
      ).length;
      
      // Score based on capability match and energy
      const score = (capabilityMatch * 0.7) + (agent.energy / agent.maxEnergy * 0.3);
      
      return { agent, score };
    });
    
    // Sort by score and select top agents
    scoredAgents.sort((a, b) => b.score - a.score);
    
    // Select diverse set of agents
    const selectedAgents = [];
    const usedTypes = new Set();
    
    for (const { agent } of scoredAgents) {
      if (selectedAgents.length >= 3) break;
      
      if (!usedTypes.has(agent.type) || selectedAgents.length < 2) {
        selectedAgents.push(agent.id);
        usedTypes.add(agent.type);
      }
    }
    
    return {
      selectedAgents,
      rationale: 'Fallback allocation based on capability matching',
      confidence: 0.6,
      optimizationFactors: ['capability_matching', 'energy_consideration']
    };
  }
  
  /**
   * Fallback optimization method
   */
  _fallbackOptimization(networkState, optimizationGoal) {
    return {
      gravitationalCenters: [],
      collaborationIslands: [],
      optimizationActions: ['Maintain current network structure'],
      rationale: 'Fallback optimization due to analysis limitations'
    };
  }
  
  /**
   * Get Prof. Smoot's specialized status
   */
  getSpecializedStatus() {
    const baseStatus = this.getStatusSummary();
    
    return {
      ...baseStatus,
      specialization: this.specialization,
      nobelPrize: this.nobelPrize,
      expertise: this.personality.expertise,
      cosmicAnalysisCompleted: this.memory.shortTerm.filter(m => 
        m.type === 'allocation_analysis' || m.type === 'network_optimization'
      ).length
    };
  }
}

export default ProfSmootAgent;