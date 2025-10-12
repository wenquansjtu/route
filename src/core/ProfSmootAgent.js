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
    // 优化Prof. Smoot的分配决策过程，使用更快速的启发式方法而不是复杂的LLM分析
    
    // 准备简化的上下文用于快速分配
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
        mass: agent.mass,
        energy: agent.energy,
        performance: agent.performanceMetrics
      }))
    };
    
    // 使用快速启发式方法进行任务分配
    const allocationDecision = this._fastAllocationHeuristic(analysisContext);
    
    // 存储分析结果到内存
    this._storeInMemory('allocation_analysis', {
      taskId: task.id,
      context: analysisContext,
      decision: allocationDecision,
      timestamp: Date.now()
    });
    
    return allocationDecision;
  }
  
  /**
   * 快速启发式任务分配方法，替代复杂的LLM分析
   */
  _fastAllocationHeuristic(context) {
    const task = context.task;
    const agents = context.agents;
    
    // 基于能力和能量的快速评分
    const scoredAgents = agents.map(agent => {
      // 能力匹配度评分
      let capabilityScore = 0;
      if (task.requiredCapabilities && task.requiredCapabilities.length > 0) {
        const matchingCapabilities = agent.capabilities.filter(cap => 
          task.requiredCapabilities.includes(cap)
        ).length;
        capabilityScore = matchingCapabilities / task.requiredCapabilities.length;
      } else {
        capabilityScore = 0.5; // 如果没有指定能力要求，给予中等评分
      }
      
      // 能量状态评分 (0-1)
      const energyScore = agent.energy / 100;
      
      // 性能评分 (0-1)
      const performanceScore = agent.performance?.successRate || 0.7;
      
      // 综合评分
      const totalScore = capabilityScore * 0.6 + energyScore * 0.2 + performanceScore * 0.2;
      
      return {
        agentId: agent.id,
        score: totalScore,
        capabilityMatch: capabilityScore
      };
    });
    
    // 按评分排序
    scoredAgents.sort((a, b) => b.score - a.score);
    
    // 选择评分最高的1-3个Agent
    const selectedAgents = [];
    const minAgents = 1;
    const maxAgents = Math.min(3, agents.length);
    
    for (const scoredAgent of scoredAgents) {
      // 只选择能力匹配度大于0的Agent
      if (scoredAgent.capabilityMatch > 0 || selectedAgents.length < minAgents) {
        selectedAgents.push(scoredAgent.agentId);
      }
      
      // 达到最大数量时停止
      if (selectedAgents.length >= maxAgents) {
        break;
      }
    }
    
    // 如果没有选择任何Agent，至少选择一个
    if (selectedAgents.length === 0 && agents.length > 0) {
      selectedAgents.push(agents[0].id);
    }
    
    return {
      selectedAgents: selectedAgents,
      rationale: `快速启发式分配: 基于能力匹配(${(scoredAgents[0]?.capabilityMatch * 100).toFixed(1)}%)和综合评分(${(scoredAgents[0]?.score * 100).toFixed(1)}%)`,
      confidence: Math.min(0.95, Math.max(0.7, scoredAgents[0]?.score || 0.7)),
      optimizationFactors: ['快速启发式分配', '能力匹配', '能量状态', '性能指标']
    };
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
      // 为Vercel环境使用更快速的模型和更少的token
      const model = process.env.VERCEL ? 'gpt-3.5-turbo' : 'gpt-3.5-turbo';
      const maxTokens = process.env.VERCEL ? 400 : 600;
      
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: this.aiConfig.systemPrompt },
          { role: 'user', content: optimizationPrompt }
        ],
        temperature: 0.4,
        max_tokens: maxTokens,
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
    return `作为乔治·斯穆特教授，运用您在宇宙结构理论方面的专业知识来优化任务分配:

任务分析:
ID: ${context.task.id}
描述: ${context.task.description}
复杂度: ${context.task.complexity}
优先级: ${context.task.priority}
所需能力: ${context.task.requiredCapabilities?.join(', ') || '未指定'}

可用代理:
${context.agents.map(agent => 
  `- ${agent.name} (${agent.type}): 
    质量=${agent.mass}, 
    能量=${agent.energy}, 
    能力=[${agent.capabilities.slice(0, 3).join(', ')}],
    成功率=${agent.performance?.successRate || 'N/A'}`
).join('\n')}

宇宙结构原理:
${Object.entries(context.cosmicPrinciples).map(([key, value]) => 
  `${key}: ${value}`
).join('\n')}

分析说明:
1. 将代理质量视为协作网络中的引力影响
2. 考虑能量水平作为代理可用性
3. 匹配所需能力与代理专长
4. 应用各向异性原理确保代理选择的多样性
5. 通过平衡专业化与协作多样性来防止协作孤岛
6. 考虑性能指标以确保可靠性
7. 为任务复杂度和优先级进行优化

请以以下JSON格式提供您的分配决策:
{
  "selectedAgents": ["agentId1", "agentId2"],
  "rationale": "您的详细解释(最多150个字符)",
  "confidence": 0.95,
  "optimizationFactors": ["gravitational_balance", "capability_match", "diversity_ensured", "performance_considered"]
}

分析:`;
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