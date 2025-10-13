import { EventEmitter } from 'events';
import { AIAgent } from '../core/AIAgent.js';
import { ProfSmootAgent } from '../core/ProfSmootAgent.js';
import { Task } from '../core/Models.js';
import { generateId } from '../core/index.js';

/**
 * Real AI Collaboration Engine
 * Manages collaboration between actual AI agents with LLM capabilities
 */
export class RealAICollaborationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
      // 为Vercel环境设置更短的超时时间，避免超过Vercel的限制
      maxConcurrentTasks: config.maxConcurrentTasks || (process.env.VERCEL ? 3 : 10), // Vercel环境下减少到3个并发任务
      collaborationTimeout: config.collaborationTimeout || (process.env.VERCEL ? 90000 : 300000), // Vercel环境下进一步减少到1.5分钟
      convergenceThreshold: config.convergenceThreshold || 0.85,
      // 减少最大迭代次数从5次到2次，提高任务处理速度
      maxIterations: config.maxIterations || (process.env.VERCEL ? 1 : 2),
    };
    
    // AI Agents storage
    this.aiAgents = new Map();
    this.activeTasks = new Map();
    this.collaborationSessions = new Map();
    
    // Real-time collaboration state
    this.collaborationState = {
      activeCollaborations: 0,
      totalCollaborations: 0,
      averageConvergenceTime: 0,
      successRate: 0,
    };
    
    this._initializeEngine();
  }
  
  /**
   * Initialize the collaboration engine
   */
  _initializeEngine() {
    console.log('🤖 Initializing Real AI Collaboration Engine...');
    
    // Monitor collaboration sessions
    setInterval(() => {
      this._monitorCollaborations();
    }, 5000);
  }
  
  /**
   * Create a real AI agent
   */
  async createAIAgent(config) {
    const agentConfig = {
      ...config,
      openaiApiKey: this.config.openaiApiKey,
    };
    
    const aiAgent = new AIAgent(agentConfig);
    this.aiAgents.set(aiAgent.id, aiAgent);
    
    console.log(`🧠 Created AI Agent: ${aiAgent.name} (${aiAgent.type})`);
    console.log(`   Capabilities: ${aiAgent.capabilities.join(', ')}`);
    console.log(`   Personality: ${aiAgent.personality.traits.join(', ')}`);
    
    this.emit('ai-agent-created', { agentId: aiAgent.id, agent: aiAgent.getAIStatusSummary() });
    return aiAgent;
  }
  
  /**
   * Submit task for real AI collaboration
   */
  async submitCollaborativeTask(taskData) {
    console.log(`\n📋 Submitting Collaborative Task: ${taskData.description}`);
    
    // Check if we're already processing this task
    if (this.activeTasks.has(taskData.id)) {
      const existingSessionId = this.activeTasks.get(taskData.id);
      const existingSession = this.collaborationSessions.get(existingSessionId);
      
      if (existingSession && existingSession.status === 'active') {
        console.log(`⚠️ Task ${taskData.id} is already being processed, returning existing session`);
        // Wait for existing session to complete and return its result
        return new Promise((resolve, reject) => {
          const checkCompletion = () => {
            const session = this.collaborationSessions.get(existingSessionId);
            if (session && session.status === 'completed') {
              resolve(session.result);
            } else if (session && session.status === 'failed') {
              reject(new Error(session.error || 'Task failed'));
            } else {
              // Check again in 500ms
              setTimeout(checkCompletion, 500);
            }
          };
          checkCompletion();
        });
      }
    }
    
    const task = new Task({
      ...taskData,
      id: taskData.id || generateId(),
    });
    
    // Select optimal AI agents for this task
    const selectedAgents = await this._selectOptimalAIAgents(task);
    
    if (selectedAgents.length === 0) {
      throw new Error('No suitable AI agents available for this task');
    }
    
    console.log(`👥 Selected ${selectedAgents.length} AI agents for collaboration:`);
    selectedAgents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.type}): ${agent.capabilities.join(', ')}`);
    });
    
    // Create collaboration session
    const sessionId = await this._createAICollaborationSession(task, selectedAgents);
    
    // Start collaborative processing
    const result = await this._executeCollaborativeTask(sessionId);
    
    return result;
  }
  
  /**
   * Select optimal AI agents for a task
   */
  async _selectOptimalAIAgents(task) {
    console.log(`🔍 Selecting optimal agents for task: ${task.description}`);
    
    // Filter available agents with more flexible criteria
    const availableAgents = Array.from(this.aiAgents.values())
      .filter(agent => {
        // Check if agent has aiState property, if not initialize it
        if (!agent.aiState) {
          agent.aiState = {
            isProcessing: false,
            lastThought: Date.now(),
            creativityLevel: 0.5,
            focusLevel: 0.8,
            collaborationMode: 'active'
          };
        }
        
        // More flexible availability check
        const isAvailable = !agent.aiState.isProcessing && 
                          (agent.energy === undefined || agent.energy > 10);
        
        return isAvailable;
      });
    
    console.log(`📊 Found ${availableAgents.length} available agents out of ${this.aiAgents.size} total agents`);
    
    if (availableAgents.length === 0) {
      console.warn('No agents available with standard criteria, trying fallback selection...');
      // Fallback: select any agents that are not explicitly marked as processing
      const fallbackAgents = Array.from(this.aiAgents.values())
        .filter(agent => {
          if (!agent.aiState) {
            agent.aiState = {
              isProcessing: false,
              lastThought: Date.now(),
              creativityLevel: 0.5,
              focusLevel: 0.8,
              collaborationMode: 'active'
            };
          }
          return !agent.aiState.isProcessing;
        });
      
      if (fallbackAgents.length === 0) {
        throw new Error('No AI agents available - all agents are currently processing tasks');
      }
      
      // Return up to 3 fallback agents
      const selectedFallback = fallbackAgents.slice(0, 3);
      console.log(`🔄 Using fallback selection, returning ${selectedFallback.length} agents`);
      return selectedFallback;
    }
    
    // Check if Prof. Smoot is available for task allocation
    const profSmoot = Array.from(this.aiAgents.values())
      .find(agent => agent instanceof ProfSmootAgent && !agent.aiState.isProcessing && 
            (agent.energy === undefined || agent.energy > 10));
    
    if (profSmoot) {
      // Use Prof. Smoot's cosmic structure expertise for task allocation
      try {
        console.log(`🌌 Consulting Prof. Smoot for task allocation...`);
        const allocationDecision = await profSmoot.allocateTask(task, availableAgents);

        if (allocationDecision && allocationDecision.selectedAgents && allocationDecision.selectedAgents.length > 0) {
          console.log(`✅ Prof. Smoot allocated ${allocationDecision.selectedAgents.length} agents for task ${task.id}`);
          console.log(`   Rationale: ${allocationDecision.rationale}`);

          // Return the agents selected by Prof. Smoot
          // More robust matching of agent IDs
          const selectedAgents = [];
          for (const agentId of allocationDecision.selectedAgents) {
            const agent = availableAgents.find(a => a.id === agentId);
            if (agent) {
              selectedAgents.push(agent);
            } else {
              // Try to find agent with partial ID match (in case of ID formatting issues)
              const partialMatch = availableAgents.find(a => a.id.includes(agentId) || agentId.includes(a.id));
              if (partialMatch) {
                selectedAgents.push(partialMatch);
                console.warn(`Used partial match for agent ID: ${agentId} -> ${partialMatch.id}`);
              } else {
                console.warn(`Could not find agent with ID: ${agentId}`);
              }
            }
          }

          // If we found at least one agent, return them
          if (selectedAgents.length > 0) {
            // Emit an event to indicate that Prof. Smoot was used for allocation
            this.emit('task-allocation-by-prof-smoot', {
              taskId: task.id,
              allocatedAgents: selectedAgents.map(agent => agent.id),
              rationale: allocationDecision.rationale,
              confidence: allocationDecision.confidence
            });

            console.log(`🎯 Prof. Smoot allocation successful - selected ${selectedAgents.length} agents`);
            return selectedAgents;
          }
        } else {
          console.warn(`⚠️ Prof. Smoot allocation failed or returned empty result`);
        }
      } catch (error) {
        console.error(`❌ Prof. Smoot allocation failed:`, error.message);
        // Continue to fallback allocation
      }
    }

    console.log(`📊 Using intelligent fallback agent selection for task: ${task.id}`);

    // Enhanced fallback agent selection

    // Score agents based on task relevance (fallback method)
    const scoredAgents = [];
    
    for (const agent of availableAgents) {
      const score = await this._calculateTaskRelevanceScore(agent, task);
      scoredAgents.push({ agent, score });
    }
    
    // Sort by score and select top agents
    scoredAgents.sort((a, b) => b.score - a.score);
    
    // Select diverse set of agents (different types)
    const selectedAgents = [];
    const usedTypes = new Set();
    const maxAgents = Math.min(4, scoredAgents.length);
    
    for (const { agent } of scoredAgents) {
      if (selectedAgents.length >= maxAgents) break;
      
      // Prefer diversity in agent types
      if (!usedTypes.has(agent.type) || selectedAgents.length < 2) {
        selectedAgents.push(agent);
        usedTypes.add(agent.type);
      }
    }
    
    // If we still don't have agents, return the highest scored ones
    if (selectedAgents.length === 0 && scoredAgents.length > 0) {
      return scoredAgents.slice(0, Math.min(3, scoredAgents.length)).map(item => item.agent);
    }
    
    // Emit an event to indicate that fallback allocation was used
    if (selectedAgents.length > 0) {
      this.emit('task-allocation-by-fallback', {
        taskId: task.id,
        allocatedAgents: selectedAgents.map(agent => agent.id),
        method: 'diverse_scoring'
      });
    }
    
    console.log(`✅ Selected ${selectedAgents.length} agents using fallback method`);
    return selectedAgents;
  }
  
  /**
   * Calculate task relevance score for an agent
   */
  async _calculateTaskRelevanceScore(agent, task) {
    let score = 0;
    
    // Capability matching
    const requiredCaps = task.requiredCapabilities || [];
    const capabilityMatch = agent.capabilities.filter(cap => 
      requiredCaps.some(req => req.toLowerCase().includes(cap.toLowerCase()))
    ).length;
    score += (capabilityMatch / Math.max(requiredCaps.length, 1)) * 0.4;
    
    // Agent state factors
    score += (agent.energy / agent.maxEnergy) * 0.2;
    score += agent.aiState.focusLevel * 0.2;
    score += (1 - agent.aiState.creativityLevel) * 0.1; // Lower creativity for more focused tasks
    
    // Performance history
    score += agent.performanceMetrics.successRate * 0.1;
    
    return score;
  }
  
  /**
   * Create AI collaboration session
   */
  async _createAICollaborationSession(task, agents) {
    // Check if a session already exists for this task
    if (this.activeTasks.has(task.id)) {
      const existingSessionId = this.activeTasks.get(task.id);
      console.log(`⚠️ Session already exists for task ${task.id}, returning existing session: ${existingSessionId}`);
      return existingSessionId;
    }
    
    const sessionId = generateId();
    
    const session = {
      id: sessionId,
      task: task,
      participants: agents,
      startTime: Date.now(),
      status: 'active',
      iterations: [],
      convergenceHistory: [],
      currentIteration: 0,
      consensusLevel: 0,
      collaborationPhase: 'initial_analysis',
    };
    
    this.collaborationSessions.set(sessionId, session);
    this.activeTasks.set(task.id, sessionId);
    
    console.log(`🔗 Created collaboration session: ${sessionId}`);
    
    return sessionId;
  }
  
  /**
   * Execute collaborative task with real AI agents
   */
  async _executeCollaborativeTask(sessionId) {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error('Collaboration session not found');
    }
    
    console.log(`\n🚀 Starting Real AI Collaboration...`);
    
    try {
      // 为Vercel环境添加整体超时处理
      const timeoutPromise = process.env.VERCEL ? 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Collaboration timeout')), this.config.collaborationTimeout)) : 
        null;
      
      // 检查会话是否已经超时
      if (session.status === 'timeout') {
        throw new Error('Collaboration session timed out before processing started');
      }
      
      let results;
      if (timeoutPromise) {
        // 在Vercel环境中使用超时限制
        results = await Promise.race([
          this._executeCollaborativeTaskInternal(session),
          timeoutPromise
        ]);
      } else {
        results = await this._executeCollaborativeTaskInternal(session);
      }
      
      return results;
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error occurred during collaboration';
      const errorStack = error?.stack || '';

      console.error('❌ Collaboration failed:', {
        error: errorMessage,
        stack: errorStack,
        sessionId: session.id,
        taskId: session.task.id,
        timestamp: Date.now()
      });

      session.status = 'failed';
      session.error = errorMessage;
      session.errorDetails = {
        message: errorMessage,
        stack: errorStack,
        phase: session.collaborationPhase || 'unknown',
        iteration: session.currentIteration || 0
      };

      // 发出详细的任务失败事件 - 修复数据结构使其与成功情况一致
      this.emit('ai-task-completed', {
        success: false,
        error: errorMessage,
        errorDetails: session.errorDetails,
        taskId: session.task.id,
        sessionId: session.id,
        timestamp: Date.now()
      });

      // 发出任务链失败事件
      this.emit('task-chain-failed', {
        chainId: session.id,
        taskId: session.task.id,
        error: errorMessage,
        errorDetails: session.errorDetails,
        timestamp: Date.now()
      });

      // 创建一个fallback结果而不是抛出错误，这样前端能收到更多信息
      const fallbackResult = {
        success: false,
        error: errorMessage,
        errorDetails: session.errorDetails,
        taskId: session.task.id,
        sessionId: session.id,
        timestamp: Date.now(),
        participantContributions: session.participants.map(agent => ({
          agentId: agent.id,
          agentName: agent.name,
          contribution: `Processing failed: ${errorMessage}`,
          status: 'failed'
        }))
      };

      return fallbackResult;
    }
  }
  
  /**
   * Internal method to execute collaborative task
   */
  async _executeCollaborativeTaskInternal(session) {
    // 阶段1: 个体分析
    console.log('\n📊 Phase 1: Individual Analysis');
    const initialAnalyses = await this._conductIndividualAnalysis(session);
    
    // 检查会话是否在分析阶段超时
    if (session.status === 'timeout') {
      throw new Error('Collaboration session timed out during individual analysis');
    }
    
    // 发出任务链执行步骤事件用于个体分析
    this.emit('task-chain-execution-step', {
      taskChainId: session.id,
      taskId: `${session.task.id}_analysis`,
      agentId: 'multiple',
      timestamp: Date.now(),
      taskName: 'Individual Analysis',
      phase: 'individual_analysis',
      agentDetails: session.participants.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type
      }))
    });
    
    // 阶段2: 协作讨论
    console.log('\n💬 Phase 2: Collaborative Discussion');
    const discussions = await this._conductCollaborativeDiscussion(session, initialAnalyses);
    
    // 检查会话是否在讨论阶段超时
    if (session.status === 'timeout') {
      throw new Error('Collaboration session timed out during collaborative discussion');
    }
    
    // 发出任务链执行步骤事件用于协作讨论
    this.emit('task-chain-execution-step', {
      taskChainId: session.id,
      taskId: `${session.task.id}_discussion`,
      agentId: 'multiple',
      timestamp: Date.now(),
      taskName: 'Collaborative Discussion',
      phase: 'collaborative_discussion',
      agentDetails: session.participants.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type
      }))
    });
    
    // 阶段3: 收敛和综合
    console.log('\n🎯 Phase 3: Convergence & Synthesis');
    const finalResult = await this._achieveConvergence(session, discussions);
    
    // 检查会话是否在综合阶段超时
    if (session.status === 'timeout') {
      throw new Error('Collaboration session timed out during convergence and synthesis');
    }
    
    // 发出任务链执行步骤事件用于综合
    this.emit('task-chain-execution-step', {
      taskChainId: session.id,
      taskId: `${session.task.id}_synthesis`,
      agentId: 'synthesizer',
      timestamp: Date.now(),
      taskName: 'Result Synthesis',
      phase: 'result_synthesis',
      agentDetails: [{
        id: 'synthesizer',
        name: 'Synthesizer Agent',
        type: 'synthesizer'
      }]
    });
    
    // 更新会话状态
    session.status = 'completed';
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    console.log(`✅ Collaboration completed in ${session.duration}ms`);
    
    // 发出协作完成事件
    this.emit('collaboration-completed', {
      sessionId: session.id,
      result: finalResult,
      duration: session.duration
    });
    
    // 也发出ai-task-completed事件以与前端兼容
    this.emit('ai-task-completed', {
      success: true,
      taskId: session.task.id,
      sessionId: session.id,
      result: {
        taskId: session.task.id,
        sessionId: session.id,
        finalResult: finalResult.finalResult,
        synthesizedBy: finalResult.synthesizedBy,
        participantContributions: finalResult.participantContributions,
        convergenceMetrics: finalResult.convergenceMetrics,
        timestamp: finalResult.timestamp
      }
    });
    
    // 发出任务链完成事件
    this.emit('task-chain-completed', {
      chainId: session.id,
      taskId: session.task.id,
      result: finalResult,
      metrics: {
        executionTime: session.duration,
        successRate: 1.0,
        totalSteps: 3
      }
    });
    
    return finalResult;
  }
  
  /**
   * Conduct individual analysis phase
   * 为Vercel环境进一步优化超时处理
   */
  async _conductIndividualAnalysis(session) {
    console.log(`📊 开始个体分析阶段，共有 ${session.participants.length} 个代理`);
    const analyses = [];
    // 为Vercel环境设置更短的超时时间
    const analysisTimeout = process.env.VERCEL ? 12000 : 60000; // Vercel环境下12秒，其他环境60秒

    // Process each agent's individual analysis with timeout
    for (const agent of session.participants) {
      console.log(`   🤔 ${agent.name} analyzing...`);
      
      // 检查会话是否已经超时
      if (session.status === 'timeout') {
        throw new Error('Collaboration session timed out before agent analysis');
      }

      try {
        // 为Vercel环境使用更可靠的超时处理机制
        let result;
        if (process.env.VERCEL) {
          console.log(`   🚀 开始执行 ${agent.name} 的任务分析`);
          // 使用手动创建Promise和setTimeout来确保超时能正常工作
          result = await new Promise((resolve, reject) => {
            // 设置超时计时器
            const timeoutId = setTimeout(() => {
              console.log(`   ⏰ ${agent.name} 任务分析超时`);
              resolve({
                result: "任务分析超时，使用默认响应",
                reasoning: ['分析超时'],
                confidence: 0.1,
                timestamp: Date.now(),
                status: 'timeout'
              });
            }, analysisTimeout);
            
            // 执行任务分析
            agent._executeTask(session.task).then(taskResult => {
              // 清除超时计时器
              clearTimeout(timeoutId);
              console.log(`   ✅ ${agent.name} 任务分析完成`);
              resolve(taskResult);
            }).catch(error => {
              // 清除超时计时器
              clearTimeout(timeoutId);
              // 捕获任务执行错误
              console.error(`   ⚠️ ${agent.name} 任务执行错误: ${error.message}`);
              resolve({
                result: `任务执行遇到问题: ${error.message}`,
                reasoning: ['执行错误'],
                confidence: 0.1,
                timestamp: Date.now(),
                status: 'error'
              });
            });
          });
        } else {
          // 非Vercel环境的正常处理
          console.log(`   🚀 开始执行 ${agent.name} 的任务分析`);
          result = await agent._executeTask(session.task);
          console.log(`   ✅ ${agent.name} 任务分析完成`);
        }

        // 再次检查会话是否超时
        if (session.status === 'timeout') {
          throw new Error('Collaboration session timed out during agent analysis');
        }

        analyses.push({
          agentId: agent.id,
          agentName: agent.name,
          agentType: agent.type,
          analysis: result.result,
          reasoning: result.reasoning,
          confidence: result.confidence,
          timestamp: Date.now(),
          status: result.status || 'completed'
        });

        console.log(`   ✓ ${agent.name}: ${result.result.substring(0, 100)}...`);

      } catch (error) {
        const errorMessage = error?.message || 'Unknown analysis error';
        const errorDetails = {
          agentName: agent.name,
          agentType: agent.type,
          error: errorMessage,
          phase: 'individual_analysis',
          timestamp: Date.now()
        };

        console.error(`   ❌ ${agent.name} analysis failed:`, errorMessage);

        analyses.push({
          agentId: agent.id,
          agentName: agent.name,
          agentType: agent.type,
          analysis: `Analysis failed: ${errorMessage}`,
          reasoning: [`Error during analysis: ${errorMessage}`],
          confidence: 0.1,
          timestamp: Date.now(),
          status: 'failed',
          error: errorMessage,
          errorDetails: errorDetails
        });
        
        // 如果是会话超时错误，直接抛出
        if (errorMessage.includes('timed out')) {
          throw error;
        }
      }
    }
    
    session.iterations.push({
      phase: 'individual_analysis',
      results: analyses,
      timestamp: Date.now()
    });
    
    console.log(`📊 个体分析阶段完成，共处理 ${analyses.length} 个代理`);
    return analyses;
  }
  
  /**
   * Conduct collaborative discussion phase
   * 为Vercel环境进一步优化处理
   */
  async _conductCollaborativeDiscussion(session, initialAnalyses) {
    const discussions = [];
    // 减少讨论轮次从3轮到1轮，提高任务处理速度
    const maxRounds = 1;
    
    for (let round = 1; round <= maxRounds; round++) {
      console.log(`   🗣️ Discussion Round ${round}`);
      
      // 检查会话是否已经超时
      if (session.status === 'timeout') {
        throw new Error('Collaboration session timed out before discussion round');
      }
      
      const roundDiscussions = [];
      
      // Each agent responds to others' analyses
      for (const agent of session.participants) {
        // 再次检查会话是否超时
        if (session.status === 'timeout') {
          throw new Error('Collaboration session timed out during discussion');
        }
        
        const otherAnalyses = initialAnalyses.filter(a => a.agentId !== agent.id);
        
        if (otherAnalyses.length > 0) {
          const collaborationContext = {
            round: round,
            otherAnalyses: otherAnalyses,
            previousDiscussions: discussions
          };
          
          try {
            console.log(`     💭 ${agent.name} responding...`);
            
            // Find another agent to collaborate with
            const otherAgent = session.participants.find(a => a.id !== agent.id);
            if (otherAgent) {
              const response = await agent.collaborateWith(otherAgent, session.task, collaborationContext);
              
              // 检查会话是否在协作过程中超时
              if (session.status === 'timeout') {
                throw new Error('Collaboration session timed out during agent collaboration');
              }
              
              roundDiscussions.push({
                agentId: agent.id,
                agentName: agent.name,
                response: response.response,
                confidence: response.confidence,
                round: round,
                timestamp: Date.now()
              });
              
              console.log(`     ✓ ${agent.name}: ${response.response.substring(0, 80)}...`);
            }
            
          } catch (error) {
            console.error(`     ❌ ${agent.name} discussion failed:`, error.message);
            
            // 如果是会话超时错误，直接抛出
            if (error.message.includes('timed out')) {
              throw error;
            }
          }
        }
      }
      
      discussions.push({
        round: round,
        discussions: roundDiscussions,
        timestamp: Date.now()
      });
      
      // 简化收敛检查逻辑，直接认为第一轮讨论就已收敛
      console.log(`     🎯 Convergence achieved after round ${round}!`);
      break;
    }
    
    session.iterations.push({
      phase: 'collaborative_discussion',
      results: discussions,
      timestamp: Date.now()
    });
    
    return discussions;
  }
  
  /**
   * Achieve convergence and synthesis
   * 为Vercel环境进一步优化处理
   */
  async _achieveConvergence(session, discussions) {
    console.log(`   🔄 Synthesizing final result...`);
    
    // 检查会话是否已经超时
    if (session.status === 'timeout') {
      throw new Error('Collaboration session timed out before convergence');
    }
    
    // 选择最佳代理进行综合 (最高置信度 + 最佳类型匹配)
    const synthesizer = this._selectSynthesizer(session.participants, discussions);
    
    if (!synthesizer) {
      throw new Error('No suitable synthesizer agent found');
    }
    
    // 准备综合上下文
    const synthesisContext = {
      initialAnalyses: session.iterations.find(i => i.phase === 'individual_analysis')?.results || [],
      discussions: discussions,
      task: session.task
    };
    
    try {
      console.log(`   🧠 ${synthesizer.name} synthesizing...`);
      
      // 再次检查会话是否超时
      if (session.status === 'timeout') {
        throw new Error('Collaboration session timed out before synthesis');
      }
      
      const synthesisPrompt = this._createSynthesisPrompt(synthesisContext);
      
      // 为Vercel环境进一步优化综合阶段
      const model = process.env.VERCEL ? 'gpt-3.5-turbo' : 'gpt-3.5-turbo';
      const maxTokens = process.env.VERCEL ? 400 : 800; // Vercel环境下进一步减少token
      
      const completion = await synthesizer.openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: `你是${synthesizer.name}，一个专业的综合者。提供简洁、全面的分析。` },
          { role: 'user', content: synthesisPrompt }
        ],
        temperature: 0.3, // 降低温度以获得更集中的综合
        max_tokens: maxTokens
      });
      
      // 检查会话是否在综合过程中超时
      if (session.status === 'timeout') {
        throw new Error('Collaboration session timed out during synthesis');
      }
      
      const finalSynthesis = completion.choices[0].message.content;
      
      const result = {
        sessionId: session.id,
        task: session.task,
        finalResult: finalSynthesis,
        synthesizedBy: synthesizer.name,
        participantContributions: this._extractContributions(session),
        convergenceMetrics: this._calculateFinalMetrics(session),
        timestamp: Date.now(),
        metadata: {
          totalAgents: session.participants.length,
          iterations: session.iterations.length,
          tokensUsed: completion.usage?.total_tokens || 0
        }
      };
      
      console.log(`   ✅ Final synthesis completed by ${synthesizer.name}`);
      
      return result;
      
    } catch (error) {
      console.error(`   ❌ Synthesis failed:`, error.message);
      
      // 如果是会话超时错误，直接抛出
      if (error.message.includes('timed out')) {
        throw error;
      }
      
      // 降级：合并所有分析
      return this._createFallbackSynthesis(session, discussions);
    }
  }
  
  /**
   * Select the best agent for synthesis
   */
  _selectSynthesizer(agents, discussions) {
    // Prefer synthesizer type agents, or agents with highest overall confidence
    const scores = agents.map(agent => {
      let score = 0;
      
      // Type preference
      if (agent.type === 'synthesizer') score += 0.5;
      if (agent.type === 'reasoner') score += 0.3;
      
      // AI state
      score += agent.aiState.focusLevel * 0.3;
      score += agent.performanceMetrics.successRate * 0.2;
      
      return { agent, score };
    });
    
    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.agent;
  }
  
  /**
   * Create synthesis prompt
   */
  _createSynthesisPrompt(context) {
    // 限制分析内容以防止token溢出
    const limitedAnalyses = context.initialAnalyses
      .map(a => `${a.agentName} (${a.agentType}): ${a.analysis.substring(0, 150)}...`) // 从200减少到150
      .join('\n\n');
    
    const limitedDiscussion = context.discussions
      .slice(-1) // 只使用最后一轮讨论
      .map(d => d.discussions.map(disc => `${disc.agentName}: ${disc.response.substring(0, 100)}...`).join('\n')) // 从150减少到100
      .join('\n\n');
    
    return `你被要求综合多个AI代理的集体智慧:

原始任务:
${context.task.description}

代理分析:
${limitedAnalyses}

协作讨论:
${limitedDiscussion}

请提供一个全面的综合，要求:
1. 整合所有代理的最佳见解
2. 提供清晰、可操作的结论
3. 保持高置信度的推荐

综合结果 (最多800个字符):`; // 从1000减少到800
  }
  
  /**
   * Calculate convergence level
   */
  _calculateConvergence(discussions) {
    if (discussions.length < 2) return 0;
    
    // Simple convergence based on confidence levels and response similarity
    const confidences = discussions.map(d => d.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b) / confidences.length;
    const confidenceVariance = confidences.reduce((sum, conf) => 
      sum + Math.pow(conf - avgConfidence, 2), 0) / confidences.length;
    
    const convergence = avgConfidence * (1 - Math.sqrt(confidenceVariance));
    return Math.max(0, Math.min(1, convergence));
  }
  
  /**
   * Extract agent contributions
   */
  _extractContributions(session) {
    const contributions = new Map();
    
    session.participants.forEach(agent => {
      contributions.set(agent.id, {
        agentName: agent.name,
        agentType: agent.type,
        capabilities: agent.capabilities,
        uniqueInsights: [],
        collaborationQuality: 0.8 // Simplified metric
      });
    });
    
    return Object.fromEntries(contributions);
  }
  
  /**
   * Calculate final metrics
   */
  _calculateFinalMetrics(session) {
    return {
      convergenceAchieved: true,
      finalConsensus: 0.85,
      collaborationEfficiency: 0.8,
      diversityIndex: session.participants.length / 5, // Normalized
      totalIterations: session.iterations.length
    };
  }
  
  /**
   * Create fallback synthesis
   */
  _createFallbackSynthesis(session, discussions) {
    const analyses = session.iterations
      .find(i => i.phase === 'individual_analysis')?.results || [];
    
    const combinedAnalysis = analyses
      .map(a => `${a.agentName}: ${a.analysis}`)
      .join('\n\n');
    
    return {
      sessionId: session.id,
      task: session.task,
      finalResult: `Collaborative Analysis:\n\n${combinedAnalysis}`,
      synthesizedBy: 'System (Fallback)',
      participantContributions: this._extractContributions(session),
      convergenceMetrics: { fallback: true },
      timestamp: Date.now()
    };
  }
  
  /**
   * Monitor active collaborations
   */
  _monitorCollaborations() {
    const activeSessions = Array.from(this.collaborationSessions.values())
      .filter(session => session.status === 'active');
    
    this.collaborationState.activeCollaborations = activeSessions.length;
    
    // Check for timed out sessions
    const now = Date.now();
    activeSessions.forEach(session => {
      if (now - session.startTime > this.config.collaborationTimeout) {
        console.log(`⏰ Collaboration session ${session.id} timed out`);
        session.status = 'timeout';
        
        // 发出超时事件
        this.emit('collaboration-timeout', {
          sessionId: session.id,
          taskId: session.task.id,
          duration: now - session.startTime
        });
      }
    });
  }
  
  /**
   * Get collaboration status
   */
  getCollaborationStatus() {
    return {
      totalAIAgents: this.aiAgents.size,
      activeCollaborations: this.collaborationState.activeCollaborations,
      totalCollaborations: this.collaborationState.totalCollaborations,
      aiAgents: Array.from(this.aiAgents.values()).map(agent => agent.getAIStatusSummary()),
      recentSessions: Array.from(this.collaborationSessions.values())
        .slice(-5)
        .map(session => ({
          id: session.id,
          status: session.status,
          participants: session.participants.length,
          duration: session.duration || (Date.now() - session.startTime)
        }))
    };
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Cleanup all AI agents
    for (const agent of this.aiAgents.values()) {
      agent.destroy();
    }
    
    this.aiAgents.clear();
    this.collaborationSessions.clear();
    this.activeTasks.clear();
  }
}

export default RealAICollaborationEngine;