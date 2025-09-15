import { EventEmitter } from 'events';
import { Task } from '../core/Models.js';
import { generateId, delay } from '../core/index.js';

/**
 * 协作收敛引擎
 * 管理多Agent协作任务的收敛过程，实现智能任务分发和协作协调
 */
export class CollaborationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // 基础配置
    this.maxConcurrentTasks = config.maxConcurrentTasks || 20;\n    this.convergenceThreshold = config.convergenceThreshold || 0.95;\n    this.maxIterations = config.maxIterations || 100;\n    this.taskTimeout = config.taskTimeout || 30000; // 30秒\n    \n    // 协作策略\n    this.collaborationStrategies = {\n      consensus: config.consensusWeight || 0.4,\n      specialization: config.specializationWeight || 0.3,\n      redundancy: config.redundancyWeight || 0.2,\n      exploration: config.explorationWeight || 0.1\n    };\n    \n    // 数据存储\n    this.agents = new Map(); // agentId -> agent interface\n    this.tasks = new Map(); // taskId -> task state\n    this.taskChains = new Map(); // chainId -> task chain\n    this.collaborationSessions = new Map(); // sessionId -> session data\n    \n    // 系统组件\n    this.spm = null; // Semantic Perturbation Map\n    this.tcf = null; // Tensor Cooperation Field\n    this.topology = null; // Topology Manager\n    \n    // 收敛状态\n    this.convergenceState = {\n      globalConsensus: 0,\n      taskCompletionRate: 0,\n      collaborationEfficiency: 0,\n      networkStability: 0,\n      lastConvergenceCheck: Date.now()\n    };\n    \n    // 性能指标\n    this.performanceMetrics = {\n      totalTasksProcessed: 0,\n      successfulCollaborations: 0,\n      averageConvergenceTime: 0,\n      resourceUtilization: 0,\n      qualityScore: 0\n    };\n    \n    this._initializeEngine();\n  }\n  \n  /**\n   * 初始化协作引擎\n   */\n  _initializeEngine() {\n    // 启动收敛监控\n    this.convergenceTimer = setInterval(() => {\n      this._checkConvergence();\n    }, 1000);\n    \n    // 启动任务链处理\n    this.taskChainTimer = setInterval(() => {\n      this._processTaskChains();\n    }, 500);\n    \n    this.on('task-completed', this._handleTaskCompletion.bind(this));\n    this.on('task-failed', this._handleTaskFailure.bind(this));\n    this.on('collaboration-formed', this._handleCollaborationFormed.bind(this));\n  }\n  \n  /**\n   * 连接系统组件\n   */\n  connectSystems(spm, tcf, topology) {\n    this.spm = spm;\n    this.tcf = tcf;\n    this.topology = topology;\n    \n    // 监听组件事件\n    if (spm) {\n      spm.on('agent-added', (event) => this._handleAgentAdded(event));\n      spm.on('perturbation-created', (event) => this._handlePerturbationDetected(event));\n    }\n    \n    if (tcf) {\n      tcf.on('field-updated', (event) => this._handleFieldUpdate(event));\n      tcf.on('resonance-detected', (event) => this._handleResonanceDetected(event));\n    }\n    \n    if (topology) {\n      topology.on('restructure-completed', (event) => this._handleTopologyChange(event));\n    }\n  }\n  \n  /**\n   * 注册Agent\n   */\n  registerAgent(agent) {\n    this.agents.set(agent.id, {\n      agent: agent,\n      availability: 1.0,\n      currentTasks: new Set(),\n      collaborationHistory: [],\n      performanceScore: 1.0,\n      specializations: agent.capabilities || [],\n      lastActivity: Date.now()\n    });\n    \n    this.emit('agent-registered', { agentId: agent.id });\n    return true;\n  }\n  \n  /**\n   * 注销Agent\n   */\n  unregisterAgent(agentId) {\n    const agentInfo = this.agents.get(agentId);\n    if (!agentInfo) return false;\n    \n    // 取消当前任务\n    for (const taskId of agentInfo.currentTasks) {\n      this._reassignTask(taskId, agentId);\n    }\n    \n    this.agents.delete(agentId);\n    this.emit('agent-unregistered', { agentId });\n    return true;\n  }\n  \n  /**\n   * 提交任务\n   */\n  submitTask(taskData) {\n    const task = taskData instanceof Task ? taskData : new Task(taskData);\n    \n    const taskState = {\n      task: task,\n      status: 'pending',\n      assignedAgents: new Set(),\n      collaborationSession: null,\n      startTime: null,\n      convergenceProgress: 0,\n      iterations: 0,\n      results: [],\n      consensus: null\n    };\n    \n    this.tasks.set(task.id, taskState);\n    \n    // 立即尝试分配任务\n    this._scheduleTask(task.id);\n    \n    this.emit('task-submitted', { taskId: task.id, task });\n    return task.id;\n  }\n  \n  /**\n   * 提交任务链\n   */\n  submitTaskChain(chainData) {\n    const chainId = chainData.id || generateId();\n    const taskChain = {\n      id: chainId,\n      name: chainData.name || `Chain-${chainId.slice(0, 8)}`,\n      tasks: chainData.tasks || [],\n      dependencies: this._buildDependencyGraph(chainData.tasks),\n      strategy: chainData.strategy || 'sequential',\n      priority: chainData.priority || 0,\n      status: 'pending',\n      startTime: null,\n      completedTasks: new Set(),\n      activeTasks: new Set(),\n      failedTasks: new Set(),\n      progress: 0,\n      results: new Map()\n    };\n    \n    this.taskChains.set(chainId, taskChain);\n    \n    // 开始处理任务链\n    this._processTaskChain(chainId);\n    \n    this.emit('task-chain-submitted', { chainId, taskChain });\n    return chainId;\n  }\n  \n  /**\n   * 构建依赖图\n   */\n  _buildDependencyGraph(tasks) {\n    const graph = new Map();\n    \n    for (const task of tasks) {\n      graph.set(task.id, {\n        dependencies: task.dependencies || [],\n        dependents: [],\n        ready: (task.dependencies || []).length === 0\n      });\n    }\n    \n    // 构建反向依赖关系\n    for (const [taskId, taskNode] of graph) {\n      for (const depId of taskNode.dependencies) {\n        const depNode = graph.get(depId);\n        if (depNode) {\n          depNode.dependents.push(taskId);\n        }\n      }\n    }\n    \n    return graph;\n  }\n  \n  /**\n   * 调度单个任务\n   */\n  async _scheduleTask(taskId) {\n    const taskState = this.tasks.get(taskId);\n    if (!taskState || taskState.status !== 'pending') return;\n    \n    const task = taskState.task;\n    \n    // 选择最佳Agent组合\n    const agentCombination = await this._selectOptimalAgents(task);\n    if (agentCombination.length === 0) {\n      // 没有可用Agent，延迟重试\n      setTimeout(() => this._scheduleTask(taskId), 2000);\n      return;\n    }\n    \n    // 创建协作会话\n    const sessionId = await this._createCollaborationSession(taskId, agentCombination);\n    \n    // 开始任务执行\n    taskState.status = 'executing';\n    taskState.startTime = Date.now();\n    taskState.collaborationSession = sessionId;\n    \n    // 分配给选定的Agent\n    for (const agentId of agentCombination) {\n      await this._assignTaskToAgent(taskId, agentId);\n    }\n    \n    this.emit('task-scheduled', { taskId, agentCombination, sessionId });\n  }\n  \n  /**\n   * 选择最优Agent组合\n   */\n  async _selectOptimalAgents(task) {\n    const availableAgents = Array.from(this.agents.values())\n      .filter(agentInfo => {\n        return agentInfo.availability > 0.3 && \n               agentInfo.currentTasks.size < 3 && // 最多同时执行3个任务\n               this._checkCapabilityMatch(agentInfo, task);\n      });\n    \n    if (availableAgents.length === 0) return [];\n    \n    // 根据任务协作类型选择Agent\n    switch (task.collaborationType) {\n      case 'sequential':\n        return this._selectSequentialAgents(task, availableAgents);\n      case 'parallel':\n        return this._selectParallelAgents(task, availableAgents);\n      case 'hierarchical':\n        return this._selectHierarchicalAgents(task, availableAgents);\n      default:\n        return this._selectDefaultAgents(task, availableAgents);\n    }\n  }\n  \n  /**\n   * 检查能力匹配\n   */\n  _checkCapabilityMatch(agentInfo, task) {\n    if (!task.requiredCapabilities || task.requiredCapabilities.length === 0) {\n      return true;\n    }\n    \n    const agentCapabilities = new Set(agentInfo.specializations);\n    return task.requiredCapabilities.some(cap => agentCapabilities.has(cap));\n  }\n  \n  /**\n   * 选择顺序协作Agent\n   */\n  _selectSequentialAgents(task, availableAgents) {\n    // 选择单个最佳Agent\n    const scores = availableAgents.map(agentInfo => {\n      return {\n        agentInfo,\n        score: this._calculateAgentTaskScore(agentInfo, task)\n      };\n    });\n    \n    scores.sort((a, b) => b.score - a.score);\n    return scores.length > 0 ? [scores[0].agentInfo.agent.id] : [];\n  }\n  \n  /**\n   * 选择并行协作Agent\n   */\n  _selectParallelAgents(task, availableAgents) {\n    const targetCount = Math.min(task.maxAgents || 3, availableAgents.length);\n    const scores = availableAgents.map(agentInfo => {\n      return {\n        agentInfo,\n        score: this._calculateAgentTaskScore(agentInfo, task)\n      };\n    });\n    \n    scores.sort((a, b) => b.score - a.score);\n    return scores.slice(0, targetCount).map(item => item.agentInfo.agent.id);\n  }\n  \n  /**\n   * 选择分层协作Agent\n   */\n  _selectHierarchicalAgents(task, availableAgents) {\n    // 选择一个主Agent和若干辅助Agent\n    const primaryAgent = this._selectSequentialAgents(task, availableAgents);\n    if (primaryAgent.length === 0) return [];\n    \n    const remainingAgents = availableAgents.filter(a => a.agent.id !== primaryAgent[0]);\n    const supportAgents = this._selectParallelAgents(task, remainingAgents)\n      .slice(0, Math.min(2, task.maxAgents - 1));\n    \n    return [...primaryAgent, ...supportAgents];\n  }\n  \n  /**\n   * 默认Agent选择\n   */\n  _selectDefaultAgents(task, availableAgents) {\n    return this._selectSequentialAgents(task, availableAgents);\n  }\n  \n  /**\n   * 计算Agent任务匹配分数\n   */\n  _calculateAgentTaskScore(agentInfo, task) {\n    let score = 0;\n    \n    // 可用性权重\n    score += agentInfo.availability * 0.3;\n    \n    // 性能历史权重\n    score += agentInfo.performanceScore * 0.3;\n    \n    // 能力匹配权重\n    const capabilityMatch = this._calculateCapabilityMatchScore(agentInfo, task);\n    score += capabilityMatch * 0.25;\n    \n    // 负载平衡权重\n    const loadFactor = 1 - (agentInfo.currentTasks.size / 3);\n    score += loadFactor * 0.15;\n    \n    return score;\n  }\n  \n  /**\n   * 计算能力匹配分数\n   */\n  _calculateCapabilityMatchScore(agentInfo, task) {\n    if (!task.requiredCapabilities || task.requiredCapabilities.length === 0) {\n      return 0.5; // 中性分数\n    }\n    \n    const agentCapabilities = new Set(agentInfo.specializations);\n    const matchCount = task.requiredCapabilities.filter(cap => \n      agentCapabilities.has(cap)\n    ).length;\n    \n    return matchCount / task.requiredCapabilities.length;\n  }\n  \n  /**\n   * 创建协作会话\n   */\n  async _createCollaborationSession(taskId, agentIds) {\n    const sessionId = generateId();\n    const session = {\n      id: sessionId,\n      taskId: taskId,\n      participants: new Set(agentIds),\n      strategy: this._determineCollaborationStrategy(agentIds),\n      convergenceTracker: {\n        iterations: 0,\n        consensus: 0,\n        participantResults: new Map(),\n        convergenceHistory: []\n      },\n      communicationChannels: new Map(),\n      startTime: Date.now(),\n      status: 'active'\n    };\n    \n    this.collaborationSessions.set(sessionId, session);\n    \n    // 建立Agent间通信通道\n    await this._establishCommunicationChannels(session);\n    \n    this.emit('collaboration-session-created', { sessionId, session });\n    return sessionId;\n  }\n  \n  /**\n   * 确定协作策略\n   */\n  _determineCollaborationStrategy(agentIds) {\n    const agentCount = agentIds.length;\n    \n    if (agentCount === 1) {\n      return 'solo';\n    } else if (agentCount <= 3) {\n      return 'consensus';\n    } else {\n      return 'hierarchical';\n    }\n  }\n  \n  /**\n   * 建立通信通道\n   */\n  async _establishCommunicationChannels(session) {\n    const participants = Array.from(session.participants);\n    \n    // 为每对Agent建立通信通道\n    for (let i = 0; i < participants.length; i++) {\n      for (let j = i + 1; j < participants.length; j++) {\n        const channelId = `${participants[i]}-${participants[j]}`;\n        session.communicationChannels.set(channelId, {\n          participants: [participants[i], participants[j]],\n          messages: [],\n          bandwidth: 1.0,\n          latency: 0,\n          active: true\n        });\n      }\n    }\n  }\n  \n  /**\n   * 分配任务给Agent\n   */\n  async _assignTaskToAgent(taskId, agentId) {\n    const taskState = this.tasks.get(taskId);\n    const agentInfo = this.agents.get(agentId);\n    \n    if (!taskState || !agentInfo) return false;\n    \n    // 更新状态\n    taskState.assignedAgents.add(agentId);\n    agentInfo.currentTasks.add(taskId);\n    agentInfo.lastActivity = Date.now();
    
    // 记录任务链执行路径
    if (taskState.collaborationSession) {
      const session = this.collaborationSessions.get(taskState.collaborationSession);
      if (session && session.taskChainId) {
        // Emit event for task chain visualization
        this.emit('task-chain-execution-step', {
          taskChainId: session.taskChainId,
          taskId: taskId,
          agentId: agentId,
          timestamp: Date.now()
        });
      }
    }
    
    // 通知Agent执行任务
    try {
      const result = await agentInfo.agent.processTask(taskState.task);
      this._handleAgentTaskResult(taskId, agentId, result);
    } catch (error) {
      this._handleAgentTaskError(taskId, agentId, error);
    }
    
    return true;
  }
  
  /**
   * 处理Agent任务结果
   */
  _handleAgentTaskResult(taskId, agentId, result) {
    const taskState = this.tasks.get(taskId);
    const session = taskState?.collaborationSession ? 
      this.collaborationSessions.get(taskState.collaborationSession) : null;
    
    if (!taskState || !session) return;
    
    // 记录结果
    session.convergenceTracker.participantResults.set(agentId, {
      result,
      timestamp: Date.now(),
      confidence: result.confidence || 0.8
    });
    
    // 检查是否所有Agent都已完成
    if (session.convergenceTracker.participantResults.size === session.participants.size) {
      this._processCollaborationResults(taskId, session);
    }
  }
  
  /**
   * 处理Agent任务错误
   */
  _handleAgentTaskError(taskId, agentId, error) {
    const taskState = this.tasks.get(taskId);
    const agentInfo = this.agents.get(agentId);
    
    if (!taskState || !agentInfo) return;
    
    // 从任务中移除失败的Agent
    taskState.assignedAgents.delete(agentId);
    agentInfo.currentTasks.delete(taskId);
    
    // 更新Agent性能分数
    agentInfo.performanceScore = Math.max(0.1, agentInfo.performanceScore * 0.9);
    
    // 如果还有其他Agent在工作，等待它们完成
    if (taskState.assignedAgents.size > 0) {
      this.emit('agent-task-failed', { taskId, agentId, error: error.message });
      return;
    }
    
    // 所有Agent都失败了，重新分配任务
    this._reassignTask(taskId, agentId);
  }
  
  /**
   * 处理协作结果
   */
  async _processCollaborationResults(taskId, session) {
    const taskState = this.tasks.get(taskId);
    if (!taskState) return;
    
    const results = Array.from(session.convergenceTracker.participantResults.values());
    
    // 简化的结果合并
    let finalResult;
    if (results.length === 1) {
      finalResult = results[0].result;
    } else {
      // 选择置信度最高的结果
      const bestResult = results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      finalResult = bestResult.result;
    }
    
    // 更新任务状态
    taskState.status = 'completed';
    taskState.results = results;
    taskState.consensus = finalResult;
    taskState.convergenceProgress = 1.0;
    
    // 清理Agent分配
    for (const agentId of taskState.assignedAgents) {
      const agentInfo = this.agents.get(agentId);
      if (agentInfo) {
        agentInfo.currentTasks.delete(taskId);
        agentInfo.performanceScore = Math.min(1.0, agentInfo.performanceScore * 1.1);
      }
    }
    
    // 关闭协作会话
    session.status = 'completed';
    
    this.emit('task-completed', { taskId, result: finalResult, session });
    this.performanceMetrics.totalTasksProcessed++;
    this.performanceMetrics.successfulCollaborations++;
  }
  
  /**
   * 重新分配任务
   */
  async _reassignTask(taskId, failedAgentId) {
    const taskState = this.tasks.get(taskId);
    if (!taskState) return;
    
    taskState.status = 'pending';
    taskState.assignedAgents.clear();
    taskState.iterations = (taskState.iterations || 0) + 1;
    
    if (taskState.iterations > 3) {
      // 超过重试次数，标记为失败
      taskState.status = 'failed';
      this.emit('task-failed', { 
        taskId, 
        reason: 'max_reassignment_attempts_reached' 
      });
      return;
    }
    
    // 延迟重新调度
    setTimeout(() => this._scheduleTask(taskId), 5000);
  }
  
  /**
   * 处理任务链
   */
  _processTaskChains() {
    for (const [chainId, chain] of this.taskChains) {
      if (chain.status === 'pending' || chain.status === 'running') {
        this._processTaskChain(chainId);
      }
    }
  }
  
  /**
   * 处理单个任务链
   */
  async _processTaskChain(chainId) {
    const chain = this.taskChains.get(chainId);
    if (!chain) return;
    
    if (chain.status === 'pending') {
      chain.status = 'running';
      chain.startTime = Date.now();
    }
    
    // 简化的任务链处理
    const readyTasks = chain.tasks.filter(task => {
      if (chain.completedTasks.has(task.id) || chain.activeTasks.has(task.id)) {
        return false;
      }
      // 检查依赖
      return (task.dependencies || []).every(depId => chain.completedTasks.has(depId));
    });
    
    // 提交就绪任务
    for (const task of readyTasks.slice(0, 3)) { // 限制并发数
      const taskId = this.submitTask(task);
      chain.activeTasks.add(task.id);
      
      // 监听任务完成
      const completionHandler = (event) => {
        if (event.taskId === taskId) {
          chain.activeTasks.delete(task.id);
          chain.completedTasks.add(task.id);
          chain.results.set(task.id, event.result);
          
          // 更新进度
          chain.progress = chain.completedTasks.size / chain.tasks.length;
          
          // 检查完成状态
          if (chain.completedTasks.size === chain.tasks.length) {
            chain.status = 'completed';
            this.emit('task-chain-completed', { chainId, chain });
          }
          
          this.off('task-completed', completionHandler);
        }
      };
      
      this.on('task-completed', completionHandler);
    }
  }
  
  /**
   * 检查收敛状态
   */
  _checkConvergence() {
    const activeSessions = Array.from(this.collaborationSessions.values())
      .filter(session => session.status === 'active');
    
    let totalConsensus = 0;
    let sessionCount = 0;
    
    for (const session of activeSessions) {
      totalConsensus += session.convergenceTracker.consensus;
      sessionCount++;
    }
    
    this.convergenceState.globalConsensus = sessionCount > 0 ? totalConsensus / sessionCount : 0;
    
    // 计算任务完成率
    const totalTasks = this.tasks.size;
    const completedTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'completed').length;
    
    this.convergenceState.taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
    
    // 计算协作效率
    this.convergenceState.collaborationEfficiency = this._calculateCollaborationEfficiency();
    
    // 获取网络稳定性
    this.convergenceState.networkStability = this.topology ? 
      this.topology.stabilityMetrics.networkStability : 0.5;
    
    this.convergenceState.lastConvergenceCheck = Date.now();
    
    this.emit('convergence-updated', { convergenceState: this.convergenceState });
  }
  
  /**
   * 计算协作效率
   */
  _calculateCollaborationEfficiency() {
    if (this.performanceMetrics.totalTasksProcessed === 0) return 0;
    
    const successRate = this.performanceMetrics.successfulCollaborations / 
                       this.performanceMetrics.totalTasksProcessed;
    
    return successRate;
  }
  
  /**
   * 事件处理方法
   */
  _handleTaskCompletion(event) {
    this.performanceMetrics.totalTasksProcessed++;
    this.performanceMetrics.successfulCollaborations++;
  }
  
  _handleTaskFailure(event) {
    this.performanceMetrics.totalTasksProcessed++;
  }
  
  _handleCollaborationFormed(event) {}
  _handleAgentAdded(event) {}
  _handlePerturbationDetected(event) {}
  _handleFieldUpdate(event) {}
  _handleResonanceDetected(event) {}
  _handleTopologyChange(event) {}
  
  /**
   * 获取引擎状态摘要
   */
  getStatusSummary() {
    return {
      agents: this.agents.size,
      tasks: {
        total: this.tasks.size,
        pending: Array.from(this.tasks.values()).filter(t => t.status === 'pending').length,
        executing: Array.from(this.tasks.values()).filter(t => t.status === 'executing').length,
        completed: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length,
        failed: Array.from(this.tasks.values()).filter(t => t.status === 'failed').length
      },
      taskChains: this.taskChains.size,
      activeSessions: Array.from(this.collaborationSessions.values())
        .filter(s => s.status === 'active').length,
      convergenceState: { ...this.convergenceState },
      performanceMetrics: { ...this.performanceMetrics }
    };
  }
  
  /**
   * 清理资源
   */
  destroy() {
    if (this.convergenceTimer) {
      clearInterval(this.convergenceTimer);
    }
    if (this.taskChainTimer) {
      clearInterval(this.taskChainTimer);
    }
    this.removeAllListeners();
  }
}