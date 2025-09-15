import { SemanticPerturbationMap } from './SemanticPerturbationMap.js';
import { EventEmitter } from 'events';

/**
 * SPM调度器 - 负责Agent优先级调度和任务分配
 * 基于"引力中心"区域优先调度Agent，提高任务完成效率
 */
export class SPMScheduler extends EventEmitter {
  constructor(spm, config = {}) {
    super();
    
    this.spm = spm;
    this.config = {
      priorityAlgorithm: config.priorityAlgorithm || 'gravitational', // gravitational, semantic, hybrid
      schedulingInterval: config.schedulingInterval || 1000, // ms
      maxConcurrentTasks: config.maxConcurrentTasks || 10,
      gravityCenterWeight: config.gravityCenterWeight || 0.4,
      semanticWeight: config.semanticWeight || 0.3,
      proximityWeight: config.proximityWeight || 0.3,
      ...config
    };
    
    // 任务队列
    this.pendingTasks = new Map(); // taskId -> task
    this.activeTasks = new Map(); // taskId -> { task, assignedAgents }
    this.completedTasks = new Map(); // taskId -> result
    
    // 调度统计
    this.statistics = {
      totalScheduled: 0,
      totalCompleted: 0,
      averageWaitTime: 0,
      averageExecutionTime: 0,
      efficiencyScore: 0
    };
    
    this._initializeScheduler();
  }
  
  /**
   * 初始化调度器
   */
  _initializeScheduler() {
    // 启动调度循环
    this.schedulerTimer = setInterval(() => {
      this._runSchedulingCycle();
    }, this.config.schedulingInterval);
    
    // 监听SPM事件
    this.smp?.on('map-updated', this._handleMapUpdate.bind(this));
  }
  
  /**
   * 添加任务到调度队列
   */
  scheduleTask(task, priority = 0) {
    task.priority = priority;
    task.scheduledAt = Date.now();
    this.pendingTasks.set(task.id, task);
    
    this.emit('task-scheduled', { taskId: task.id, priority });
    this._runImmediateScheduling();
    
    return task.id;
  }
  
  /**
   * 取消任务
   */
  cancelTask(taskId) {
    if (this.pendingTasks.has(taskId)) {
      const task = this.pendingTasks.get(taskId);
      task.cancel();
      this.pendingTasks.delete(taskId);
      this.emit('task-cancelled', { taskId });
      return true;
    }
    
    if (this.activeTasks.has(taskId)) {
      const { task, assignedAgents } = this.activeTasks.get(taskId);
      task.cancel();
      
      // 通知分配的Agent取消任务
      for (const agentId of assignedAgents) {
        this.emit('task-cancel-request', { taskId, agentId });
      }
      
      this.activeTasks.delete(taskId);
      this.emit('task-cancelled', { taskId });
      return true;
    }
    
    return false;
  }
  
  /**
   * 运行调度周期
   */
  _runSchedulingCycle() {
    if (this.pendingTasks.size === 0 || this.activeTasks.size >= this.config.maxConcurrentTasks) {
      return;
    }
    
    // 获取可用的Agent
    const availableAgents = this._getAvailableAgents();
    if (availableAgents.length === 0) return;
    
    // 选择最高优先级的任务
    const taskToSchedule = this._selectNextTask();
    if (!taskToSchedule) return;
    
    // 为任务分配最佳Agent
    const assignedAgents = this._assignOptimalAgents(taskToSchedule, availableAgents);
    if (assignedAgents.length === 0) return;
    
    // 执行任务分配
    this._executeTaskAssignment(taskToSchedule, assignedAgents);
  }
  
  /**
   * 立即调度（当新任务添加时）
   */
  _runImmediateScheduling() {
    // 如果有高优先级任务且系统不忙，立即调度
    if (this.activeTasks.size < this.config.maxConcurrentTasks) {
      this._runSchedulingCycle();
    }
  }
  
  /**
   * 获取可用的Agent
   */
  _getAvailableAgents() {
    const availableAgents = [];
    
    for (const [agentId, agentInfo] of this.spm.agents) {
      // 检查Agent是否可用（不在执行任务中）
      const isAvailable = !Array.from(this.activeTasks.values()).some(activeTask =>
        activeTask.assignedAgents.includes(agentId)
      );
      
      if (isAvailable) {
        availableAgents.push({
          id: agentId,
          info: agentInfo,
          priority: this._calculateAgentPriority(agentId, agentInfo)
        });
      }
    }
    
    // 按优先级排序
    availableAgents.sort((a, b) => b.priority - a.priority);
    return availableAgents;
  }
  
  /**
   * 计算Agent优先级
   */
  _calculateAgentPriority(agentId, agentInfo) {
    let priority = 0;
    
    switch (this.config.priorityAlgorithm) {
      case 'gravitational':
        priority = this._calculateGravitationalPriority(agentId);
        break;
      case 'semantic':
        priority = this._calculateSemanticPriority(agentInfo);
        break;
      case 'hybrid':
        priority = this._calculateHybridPriority(agentId, agentInfo);
        break;
      default:
        priority = Math.random(); // 随机调度
    }
    
    return priority;
  }
  
  /**
   * 计算引力中心优先级
   */
  _calculateGravitationalPriority(agentId) {
    const gravityCenter = this.spm.gravityCenters.find(gc => gc.agentId === agentId);
    if (gravityCenter) {
      return gravityCenter.pull * gravityCenter.stability;
    }
    
    // 如果不是引力中心，基于与引力中心的距离计算优先级
    const collaborationTrend = this.spm.collaborationTrends.get(agentId);
    return collaborationTrend ? collaborationTrend.gravitationalPull : 0;
  }
  
  /**
   * 计算语义优先级
   */
  _calculateSemanticPriority(agentInfo) {
    // 基于语义向量的多样性和质量计算优先级
    const vectorMagnitude = agentInfo.semanticVector.magnitude;
    const memoryEntropy = agentInfo.memoryEntropy || 0;
    
    return vectorMagnitude * (1 + memoryEntropy);
  }
  
  /**
   * 计算混合优先级
   */
  _calculateHybridPriority(agentId, agentInfo) {
    const gravitationalScore = this._calculateGravitationalPriority(agentId);
    const semanticScore = this._calculateSemanticPriority(agentInfo);
    
    return (
      gravitationalScore * this.config.gravityCenterWeight +
      semanticScore * this.config.semanticWeight
    );
  }
  
  /**
   * 选择下一个要调度的任务
   */
  _selectNextTask() {
    if (this.pendingTasks.size === 0) return null;
    
    let bestTask = null;
    let bestScore = -1;
    
    for (const task of this.pendingTasks.values()) {
      // 检查任务依赖是否满足
      if (!task.canExecute(new Set(this.completedTasks.keys()))) {
        continue;
      }
      
      const score = this._calculateTaskPriority(task);
      if (score > bestScore) {
        bestScore = score;
        bestTask = task;
      }
    }
    
    return bestTask;
  }
  
  /**
   * 计算任务优先级
   */
  _calculateTaskPriority(task) {
    let score = task.priority || 0;
    
    // 考虑任务等待时间
    const waitTime = Date.now() - task.scheduledAt;
    score += waitTime * 0.001; // 等待时间越长，优先级越高
    
    // 考虑任务复杂度（简单任务优先）
    score -= (task.complexity || 10) * 0.1;
    
    // 考虑截止时间
    if (task.deadline) {
      const timeToDeadline = task.deadline - Date.now();
      if (timeToDeadline < 60000) { // 1分钟内到期
        score += 100; // 高优先级
      }
    }
    
    return score;
  }
  
  /**
   * 为任务分配最佳Agent
   */
  _assignOptimalAgents(task, availableAgents) {
    const requiredAgents = Math.min(task.maxAgents, availableAgents.length);
    const assignedAgents = [];
    
    if (task.collaborationType === 'sequential') {
      // 顺序协作，只分配一个最佳Agent
      if (availableAgents.length > 0) {
        assignedAgents.push(this._selectBestAgentForTask(task, availableAgents));
      }
    } else if (task.collaborationType === 'parallel') {
      // 并行协作，分配多个Agent
      for (let i = 0; i < requiredAgents && i < availableAgents.length; i++) {
        const bestAgent = this._selectBestAgentForTask(task, availableAgents, assignedAgents);
        if (bestAgent) {
          assignedAgents.push(bestAgent);
        }
      }
    } else if (task.collaborationType === 'hierarchical') {
      // 分层协作，选择一个主Agent和多个辅助Agent
      const primaryAgent = this._selectBestAgentForTask(task, availableAgents);
      if (primaryAgent) {
        assignedAgents.push(primaryAgent);
        
        // 选择辅助Agent
        const remainingAgents = availableAgents.filter(a => a.id !== primaryAgent.id);
        for (let i = 0; i < requiredAgents - 1 && i < remainingAgents.length; i++) {
          const supportAgent = this._selectBestAgentForTask(task, remainingAgents, assignedAgents);
          if (supportAgent) {
            assignedAgents.push(supportAgent);
          }
        }
      }
    }
    
    return assignedAgents;
  }
  
  /**
   * 为特定任务选择最佳Agent
   */
  _selectBestAgentForTask(task, availableAgents, excludeAgents = []) {
    const excludeIds = new Set(excludeAgents.map(a => a.id));
    const candidateAgents = availableAgents.filter(a => !excludeIds.has(a.id));
    
    if (candidateAgents.length === 0) return null;
    
    let bestAgent = null;
    let bestScore = -1;
    
    for (const agent of candidateAgents) {
      const score = this._calculateAgentTaskMatch(agent, task);
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }
    
    return bestAgent;
  }
  
  /**
   * 计算Agent与任务的匹配度
   */
  _calculateAgentTaskMatch(agent, task) {
    let score = agent.priority; // 基础优先级
    
    // 语义匹配度
    if (task.semanticVector && agent.info.semanticVector) {
      const semanticSimilarity = task.semanticVector.cosineSimilarity(agent.info.semanticVector);
      score += semanticSimilarity * this.config.semanticWeight;
    }
    
    // 能力匹配度
    if (task.requiredCapabilities && task.requiredCapabilities.length > 0) {
      const capabilityMatch = this._calculateCapabilityMatch(agent, task.requiredCapabilities);
      score += capabilityMatch * 0.5;
    }
    
    // 协作历史匹配度
    const collaborationHistory = this._getAgentCollaborationHistory(agent.id);
    const historyBonus = Math.min(collaborationHistory.successRate * 0.3, 0.3);
    score += historyBonus;
    
    return score;
  }
  
  /**
   * 计算能力匹配度
   */
  _calculateCapabilityMatch(agent, requiredCapabilities) {
    // 这里需要从Agent对象中获取能力信息
    // 暂时返回随机值作为示例
    return Math.random();
  }
  
  /**
   * 获取Agent协作历史
   */
  _getAgentCollaborationHistory(agentId) {
    // 计算Agent的历史成功率
    let successfulTasks = 0;
    let totalTasks = 0;
    
    for (const [taskId, result] of this.completedTasks) {
      if (result.assignedAgents && result.assignedAgents.includes(agentId)) {
        totalTasks++;
        if (result.status === 'completed') {
          successfulTasks++;
        }
      }
    }
    
    return {
      successRate: totalTasks > 0 ? successfulTasks / totalTasks : 1.0,
      totalTasks
    };
  }
  
  /**
   * 执行任务分配
   */
  _executeTaskAssignment(task, assignedAgents) {
    // 从待处理队列移除
    this.pendingTasks.delete(task.id);
    
    // 添加到活跃任务
    this.activeTasks.set(task.id, {
      task,
      assignedAgents: assignedAgents.map(a => a.id),
      startTime: Date.now()
    });
    
    // 更新任务状态
    for (const agent of assignedAgents) {
      task.assignAgent(agent.id);
    }
    task.start();
    
    // 更新统计
    this.statistics.totalScheduled++;
    
    // 发送任务给Agent
    this.emit('task-assigned', {
      taskId: task.id,
      assignedAgents: assignedAgents.map(a => a.id),
      task: task.serialize()
    });
    
    // 设置任务完成监听
    this._setupTaskCompletion(task.id);
  }
  
  /**
   * 设置任务完成监听
   */
  _setupTaskCompletion(taskId) {
    const completionHandler = (result) => {
      this._handleTaskCompletion(taskId, result);
    };
    
    const errorHandler = (error) => {
      this._handleTaskError(taskId, error);
    };
    
    // 监听任务完成事件（这里需要与Agent系统集成）
    this.once(`task-completed-${taskId}`, completionHandler);
    this.once(`task-failed-${taskId}`, errorHandler);
  }
  
  /**
   * 处理任务完成
   */
  _handleTaskCompletion(taskId, result) {
    const activeTask = this.activeTasks.get(taskId);
    if (!activeTask) return;
    
    const executionTime = Date.now() - activeTask.startTime;
    const waitTime = activeTask.startTime - activeTask.task.scheduledAt;
    
    // 移动到完成队列
    this.activeTasks.delete(taskId);
    this.completedTasks.set(taskId, {
      ...result,
      executionTime,
      waitTime,
      assignedAgents: activeTask.assignedAgents,
      status: 'completed'
    });
    
    // 更新统计
    this.statistics.totalCompleted++;
    this._updateStatistics(waitTime, executionTime);
    
    this.emit('task-completed', { taskId, result, executionTime, waitTime });
  }
  
  /**
   * 处理任务错误
   */
  _handleTaskError(taskId, error) {
    const activeTask = this.activeTasks.get(taskId);
    if (!activeTask) return;
    
    const executionTime = Date.now() - activeTask.startTime;
    const waitTime = activeTask.startTime - activeTask.task.scheduledAt;
    
    // 移动到完成队列（标记为失败）
    this.activeTasks.delete(taskId);
    this.completedTasks.set(taskId, {
      error,
      executionTime,
      waitTime,
      assignedAgents: activeTask.assignedAgents,
      status: 'failed'
    });
    
    this.emit('task-failed', { taskId, error, executionTime, waitTime });
  }
  
  /**
   * 更新统计数据
   */
  _updateStatistics(waitTime, executionTime) {
    const stats = this.statistics;
    
    // 更新平均等待时间
    stats.averageWaitTime = (stats.averageWaitTime + waitTime) / 2;
    
    // 更新平均执行时间
    stats.averageExecutionTime = (stats.averageExecutionTime + executionTime) / 2;
    
    // 计算效率分数
    const successRate = stats.totalCompleted / stats.totalScheduled;
    const speedScore = Math.min(1, 10000 / stats.averageExecutionTime); // 10秒内完成得分1.0
    stats.efficiencyScore = successRate * speedScore;
  }
  
  /**
   * 处理映射更新
   */
  _handleMapUpdate(event) {
    // 当SPM更新时，可能需要重新评估任务优先级
    this._reevaluateTaskPriorities();
  }
  
  /**
   * 重新评估任务优先级
   */
  _reevaluateTaskPriorities() {
    // 重新计算所有待处理任务的优先级
    for (const task of this.pendingTasks.values()) {
      const newPriority = this._calculateTaskPriority(task);
      if (Math.abs(newPriority - task.priority) > 10) {
        task.priority = newPriority;
        this.emit('task-priority-updated', { taskId: task.id, newPriority });
      }
    }
  }
  
  /**
   * 获取调度器状态
   */
  getStatus() {
    return {
      pendingTasks: this.pendingTasks.size,
      activeTasks: this.activeTasks.size,
      completedTasks: this.completedTasks.size,
      statistics: { ...this.statistics },
      config: { ...this.config }
    };
  }
  
  /**
   * 获取任务状态
   */
  getTaskStatus(taskId) {
    if (this.pendingTasks.has(taskId)) {
      return { status: 'pending', task: this.pendingTasks.get(taskId) };
    }
    if (this.activeTasks.has(taskId)) {
      return { status: 'active', ...this.activeTasks.get(taskId) };
    }
    if (this.completedTasks.has(taskId)) {
      return { status: 'completed', result: this.completedTasks.get(taskId) };
    }
    return { status: 'not_found' };
  }
  
  /**
   * 清理资源
   */
  destroy() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
    }
    this.removeAllListeners();
  }
}