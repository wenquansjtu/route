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
   * 为Vercel环境优化任务分配处理
   */
  async allocateTask(task, availableAgents) {
    console.log(`🧠 Prof. Smoot开始直接任务分配`);
    try {
      // 为Vercel环境设置更短的超时时间
      const timeoutPromise = process.env.VERCEL ? 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Task allocation timeout for Prof. Smoot')), 10000)) : 
        null;
      
      let optimalAllocation;
      if (timeoutPromise) {
        // 在Vercel环境中使用超时限制
        console.log(`   ⏱️ Prof. Smoot设置10秒超时限制`);
        optimalAllocation = await Promise.race([
          this._analyzeTaskAllocation(task, availableAgents),
          timeoutPromise
        ]);
      } else {
        optimalAllocation = await this._analyzeTaskAllocation(task, availableAgents);
      }
      
      console.log(`   ✅ Prof. Smoot任务分配完成`);
      return optimalAllocation;
    } catch (error) {
      console.error(`   ❌ Prof. Smoot直接分配分析失败:`, error.message);
      // 使用备用分配方法
      const fallbackAllocation = this._fallbackAllocation(task, availableAgents);
      console.log(`   ⚠️ Prof. Smoot使用备用分配方案`);
      return fallbackAllocation;
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
    console.log(`   🧠 Prof. Smoot开始分析任务分配: ${task.description}`);
    
    try {
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
      
      console.log(`   📊 Prof. Smoot准备上下文，包含${availableAgents.length}个可用代理`);
      
      // 使用快速启发式方法进行任务分配
      const allocationDecision = this._fastAllocationHeuristic(analysisContext);
      
      console.log(`   ✅ Prof. Smoot完成任务分配分析，选择了${allocationDecision.selectedAgents.length}个代理`);
      
      // 存储分析结果到内存
      this._storeInMemory('allocation_analysis', {
        taskId: task.id,
        context: analysisContext,
        decision: allocationDecision,
        timestamp: Date.now()
      });
      
      return allocationDecision;
    } catch (error) {
      console.error(`   ❌ Prof. Smoot任务分配分析失败:`, error);
      // 提供一个默认的分配决策以防出错
      const fallbackAllocation = this._fallbackAllocation(task, availableAgents);
      console.log(`   ⚠️ Prof. Smoot使用备用分配方案，选择了${fallbackAllocation.selectedAgents.length}个代理`);
      return fallbackAllocation;
    }
  }
  
  /**
   * 快速启发式任务分配方法，替代复杂的LLM分析
   * 为Vercel环境进一步优化处理速度
   */
  _fastAllocationHeuristic(context) {
    console.log(`   🚀 Prof. Smoot开始快速启发式分配`);
    
    // 安全检查
    if (!context || !context.task || !context.agents) {
      console.warn(`   ⚠️ Prof. Smoot上下文不完整，使用默认分配`);
      return {
        selectedAgents: [],
        rationale: "上下文不完整",
        confidence: 0.1,
        optimizationFactors: ['安全默认']
      };
    }
    
    const task = context.task;
    const agents = context.agents;
    
    // 如果没有代理，直接返回
    if (!agents || agents.length === 0) {
      console.warn(`   ⚠️ Prof. Smoot没有可用代理`);
      return {
        selectedAgents: [],
        rationale: "没有可用代理",
        confidence: 0.1,
        optimizationFactors: ['无代理']
      };
    }
    
    try {
      // 为Vercel环境进一步简化评分逻辑
      const scoredAgents = agents.map(agent => {
        // 安全检查
        if (!agent) {
          return {
            agentId: null,
            score: 0,
            capabilityMatch: 0
          };
        }
        
        // 简化的能力匹配度评分
        let capabilityScore = 0;
        if (task.requiredCapabilities && task.requiredCapabilities.length > 0) {
          // 安全检查
          const agentCapabilities = Array.isArray(agent.capabilities) ? agent.capabilities : [];
          const matchingCapabilities = agentCapabilities.filter(cap => 
            task.requiredCapabilities.includes(cap)
          ).length;
          capabilityScore = matchingCapabilities / task.requiredCapabilities.length;
        } else {
          capabilityScore = 0.5; // 如果没有指定能力要求，给予中等评分
        }
        
        // 简化的综合评分
        const totalScore = capabilityScore; // 只基于能力匹配度评分
        
        console.log(`     📈 ${agent.name || 'Unknown'} 评分: ${totalScore.toFixed(2)}`);
        
        return {
          agentId: agent.id,
          score: totalScore,
          capabilityMatch: capabilityScore
        };
      }).filter(scoredAgent => scoredAgent.agentId !== null); // 过滤掉无效代理
      
      // 按评分排序
      scoredAgents.sort((a, b) => b.score - a.score);
      
      console.log(`   📊 评分完成，最高分: ${scoredAgents[0]?.score.toFixed(2)}`);
      
      // 选择评分最高的1-2个Agent（减少选择数量以提高速度）
      const selectedAgents = [];
      const maxAgents = process.env.VERCEL ? Math.min(2, scoredAgents.length) : Math.min(3, scoredAgents.length);
      
      for (const scoredAgent of scoredAgents) {
        // 只选择能力匹配度大于0的Agent
        if (scoredAgent.capabilityMatch > 0) {
          selectedAgents.push(scoredAgent.agentId);
        }
        
        // 达到最大数量时停止
        if (selectedAgents.length >= maxAgents) {
          break;
        }
      }
      
      // 如果没有选择任何Agent，至少选择一个
      if (selectedAgents.length === 0 && scoredAgents.length > 0) {
        selectedAgents.push(scoredAgents[0].agentId);
      }
      
      console.log(`   🎯 最终选择 ${selectedAgents.length} 个代理: ${selectedAgents.join(', ')}`);
      
      return {
        selectedAgents: selectedAgents,
        rationale: `快速启发式分配: 基于能力匹配(${(scoredAgents[0]?.capabilityMatch * 100).toFixed(1)}%)`,
        confidence: Math.min(0.9, Math.max(0.7, scoredAgents[0]?.score || 0.7)), // 稍微降低置信度
        optimizationFactors: ['快速启发式分配', '能力匹配']
      };
    } catch (error) {
      console.error(`   ❌ 快速启发式分配失败:`, error);
      // 返回一个安全的默认值
      return {
        selectedAgents: scoredAgents && scoredAgents.length > 0 ? [scoredAgents[0].agentId] : [],
        rationale: "默认分配: 使用评分最高的代理",
        confidence: 0.5,
        optimizationFactors: ['默认分配']
      };
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
      // 为Vercel环境使用更快速的模型和更少的token
      // 为Vercel环境使用更快速的模型和更少的token
      const model = process.env.VERCEL ? 'gpt-3.5-turbo' : 'gpt-4';
      const maxTokens = process.env.VERCEL ? 300 : 600; // Vercel环境下进一步减少token
      
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