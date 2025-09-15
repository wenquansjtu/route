import { CollaborationEngine } from './CollaborationEngine.js';
import { generateId } from '../core/index.js';

/**
 * 协作收敛处理器扩展
 * 处理Agent任务结果和收敛算法
 */
export class CollaborationProcessor {
  constructor(engine) {
    this.engine = engine;
  }
  
  /**
   * 处理Agent任务结果
   */
  async handleAgentTaskResult(taskId, agentId, result) {
    const taskState = this.engine.tasks.get(taskId);
    const session = taskState?.collaborationSession ? 
      this.engine.collaborationSessions.get(taskState.collaborationSession) : null;
    
    if (!taskState || !session) return;
    
    // 记录结果
    session.convergenceTracker.participantResults.set(agentId, {
      result,
      timestamp: Date.now(),
      confidence: result.confidence || 0.8
    });
    
    // 检查是否所有Agent都已完成
    if (session.convergenceTracker.participantResults.size === session.participants.size) {
      await this._processCollaborationResults(taskId, session);
    }
  }
  
  /**
   * 处理Agent任务错误
   */
  async handleAgentTaskError(taskId, agentId, error) {
    const taskState = this.engine.tasks.get(taskId);
    const agentInfo = this.engine.agents.get(agentId);
    
    if (!taskState || !agentInfo) return;
    
    // 从任务中移除失败的Agent
    taskState.assignedAgents.delete(agentId);
    agentInfo.currentTasks.delete(taskId);
    
    // 更新Agent性能分数
    agentInfo.performanceScore = Math.max(0.1, agentInfo.performanceScore * 0.9);
    
    // 如果还有其他Agent在工作，等待它们完成
    if (taskState.assignedAgents.size > 0) {
      this.engine.emit('agent-task-failed', { taskId, agentId, error: error.message });
      return;
    }
    
    // 所有Agent都失败了，重新分配任务
    await this._reassignTask(taskId);
  }
  
  /**
   * 处理协作结果
   */
  async _processCollaborationResults(taskId, session) {
    const taskState = this.engine.tasks.get(taskId);
    if (!taskState) return;
    
    const results = Array.from(session.convergenceTracker.participantResults.values());
    
    // 根据协作策略合并结果
    let finalResult;
    switch (session.strategy) {
      case 'consensus':
        finalResult = await this._achieveConsensus(results, session);
        break;
      case 'hierarchical':
        finalResult = await this._hierarchicalMerge(results, session);
        break;
      case 'solo':
        finalResult = results[0]?.result;
        break;
      default:
        finalResult = await this._defaultMerge(results);
    }
    
    // 更新任务状态
    taskState.status = 'completed';
    taskState.results = results;
    taskState.consensus = finalResult;
    taskState.convergenceProgress = 1.0;
    
    // 清理Agent分配
    for (const agentId of taskState.assignedAgents) {
      const agentInfo = this.engine.agents.get(agentId);
      if (agentInfo) {
        agentInfo.currentTasks.delete(taskId);
        agentInfo.performanceScore = Math.min(1.0, agentInfo.performanceScore * 1.1);
      }
    }
    
    // 关闭协作会话
    session.status = 'completed';
    
    this.engine.emit('task-completed', { taskId, result: finalResult, session });
    this.engine.performanceMetrics.totalTasksProcessed++;
    this.engine.performanceMetrics.successfulCollaborations++;
  }
  
  /**
   * 达成共识
   */
  async _achieveConsensus(results, session) {
    const maxIterations = 10;
    let currentIteration = 0;
    let consensus = null;
    
    while (currentIteration < maxIterations) {
      // 计算结果相似度
      const similarities = this._calculateResultSimilarities(results);
      const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
      
      if (avgSimilarity > this.engine.convergenceThreshold) {
        // 达成共识，合并结果
        consensus = this._mergeResults(results);
        break;
      }
      
      // 如果没有达成共识，尝试调和分歧
      results = await this._reconcileDifferences(results, session);
      currentIteration++;
      
      session.convergenceTracker.iterations++;
      session.convergenceTracker.consensus = avgSimilarity;
      session.convergenceTracker.convergenceHistory.push({
        iteration: currentIteration,
        consensus: avgSimilarity,
        timestamp: Date.now()
      });
    }
    
    return consensus || this._fallbackMerge(results);
  }
  
  /**
   * 计算结果相似度
   */
  _calculateResultSimilarities(results) {
    const similarities = [];
    
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const similarity = this._calculateResultSimilarity(results[i].result, results[j].result);
        similarities.push(similarity);
      }
    }
    
    return similarities;
  }
  
  /**
   * 计算两个结果的相似度
   */
  _calculateResultSimilarity(result1, result2) {
    // 简化实现，实际中可以根据结果类型使用不同的相似度算法
    if (typeof result1.result === 'string' && typeof result2.result === 'string') {
      // 字符串相似度
      return this._stringSimilarity(result1.result, result2.result);
    } else if (typeof result1.confidence === 'number' && typeof result2.confidence === 'number') {
      // 基于置信度的相似度
      return 1 - Math.abs(result1.confidence - result2.confidence);
    }
    
    return 0.5; // 默认中等相似度
  }
  
  /**
   * 字符串相似度计算
   */
  _stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this._levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  /**
   * 计算编辑距离
   */
  _levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * 调和分歧
   */
  async _reconcileDifferences(results, session) {
    // 简化实现：基于置信度加权平均
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    
    return results.map(r => ({
      ...r,
      weight: r.confidence / totalConfidence
    }));
  }
  
  /**
   * 合并结果
   */
  _mergeResults(results) {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0].result;
    
    // 基于置信度的加权合并
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const weights = results.map(r => r.confidence / totalConfidence);
    
    // 如果所有结果都是字符串，选择最高置信度的结果
    if (results.every(r => typeof r.result.result === 'string')) {
      const bestResult = results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      return bestResult.result;
    }
    
    // 否则创建合并结果
    return {
      type: 'merged',
      results: results.map(r => r.result),
      weights: weights,
      confidence: totalConfidence / results.length,
      timestamp: Date.now()
    };
  }
  
  /**
   * 分层合并
   */
  async _hierarchicalMerge(results, session) {
    if (results.length === 0) return null;
    
    // 假设第一个Agent是主Agent
    const primaryResult = results[0];
    const supportResults = results.slice(1);
    
    // 使用支持结果来增强主结果
    const enhancedResult = {
      ...primaryResult.result,
      supportingEvidence: supportResults.map(r => r.result),
      confidence: this._calculateHierarchicalConfidence(primaryResult, supportResults)
    };
    
    return enhancedResult;
  }
  
  /**
   * 计算分层置信度
   */
  _calculateHierarchicalConfidence(primary, supporting) {
    const primaryWeight = 0.7;
    const supportWeight = 0.3;
    
    const supportingConfidence = supporting.length > 0 ?
      supporting.reduce((sum, r) => sum + r.confidence, 0) / supporting.length : 0;
    
    return primary.confidence * primaryWeight + supportingConfidence * supportWeight;
  }
  
  /**
   * 默认合并
   */
  _defaultMerge(results) {
    return this._mergeResults(results);
  }
  
  /**
   * 后备合并
   */
  _fallbackMerge(results) {
    // 选择置信度最高的结果
    if (results.length === 0) return null;
    
    const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    return bestResult.result;
  }
  
  /**
   * 重新分配任务
   */
  async _reassignTask(taskId) {
    const taskState = this.engine.tasks.get(taskId);
    if (!taskState) return;
    
    taskState.status = 'pending';
    taskState.assignedAgents.clear();
    taskState.iterations++;
    
    if (taskState.iterations > 3) {
      // 超过重试次数，标记为失败
      taskState.status = 'failed';
      this.engine.emit('task-failed', { 
        taskId, 
        reason: 'max_reassignment_attempts_reached' 
      });
      return;
    }
    
    // 延迟重新调度
    setTimeout(() => {
      this.engine._scheduleTask(taskId);
    }, 5000);
  }
}

/**
 * 任务链处理器
 */
export class TaskChainProcessor {
  constructor(engine) {
    this.engine = engine;
  }
  
  /**
   * 处理任务链
   */
  async processTaskChains() {
    for (const [chainId, chain] of this.engine.taskChains) {
      if (chain.status === 'pending' || chain.status === 'running') {
        await this._processTaskChain(chainId);
      }
    }
  }
  
  /**
   * 处理单个任务链
   */
  async _processTaskChain(chainId) {
    const chain = this.engine.taskChains.get(chainId);
    if (!chain) return;
    
    if (chain.status === 'pending') {
      chain.status = 'running';
      chain.startTime = Date.now();
    }
    
    // 查找可以执行的任务
    const readyTasks = this._findReadyTasks(chain);
    
    // 根据策略处理任务
    switch (chain.strategy) {
      case 'sequential':
        await this._processSequentialChain(chain, readyTasks);
        break;
      case 'parallel':
        await this._processParallelChain(chain, readyTasks);
        break;
      case 'adaptive':
        await this._processAdaptiveChain(chain, readyTasks);
        break;
      default:
        await this._processDefaultChain(chain, readyTasks);
    }
    
    // 更新进度
    this._updateChainProgress(chain);
    
    // 检查完成状态
    if (chain.completedTasks.size === chain.tasks.length) {
      chain.status = 'completed';
      this.engine.emit('task-chain-completed', { chainId, chain });
    }
  }
  
  /**
   * 查找就绪任务
   */
  _findReadyTasks(chain) {
    const readyTasks = [];
    
    for (const task of chain.tasks) {
      if (chain.completedTasks.has(task.id) || chain.activeTasks.has(task.id)) {
        continue;
      }
      
      const dependencies = chain.dependencies.get(task.id);
      if (dependencies && dependencies.ready) {
        // 检查所有依赖是否已完成
        const allDepsCompleted = dependencies.dependencies.every(depId => 
          chain.completedTasks.has(depId)
        );
        
        if (allDepsCompleted) {
          readyTasks.push(task);
        }
      }
    }
    
    return readyTasks;
  }
  
  /**
   * 处理顺序任务链
   */
  async _processSequentialChain(chain, readyTasks) {
    // 顺序执行，一次只执行一个任务
    if (chain.activeTasks.size > 0 || readyTasks.length === 0) return;
    
    const task = readyTasks[0]; // 选择第一个就绪任务
    await this._submitChainTask(chain, task);
  }
  
  /**
   * 处理并行任务链
   */
  async _processParallelChain(chain, readyTasks) {
    // 并行执行所有就绪任务
    for (const task of readyTasks) {
      await this._submitChainTask(chain, task);
    }
  }
  
  /**
   * 处理自适应任务链
   */
  async _processAdaptiveChain(chain, readyTasks) {
    // 根据系统负载动态调整并发度
    const systemLoad = this._calculateSystemLoad();
    const maxConcurrent = Math.max(1, Math.floor((1 - systemLoad) * 5));
    
    const availableSlots = maxConcurrent - chain.activeTasks.size;
    const tasksToSubmit = readyTasks.slice(0, availableSlots);
    
    for (const task of tasksToSubmit) {
      await this._submitChainTask(chain, task);
    }
  }
  
  /**
   * 默认任务链处理
   */
  async _processDefaultChain(chain, readyTasks) {
    await this._processSequentialChain(chain, readyTasks);
  }
  
  /**
   * 提交链任务
   */
  async _submitChainTask(chain, task) {
    const taskId = this.engine.submitTask(task);
    chain.activeTasks.add(task.id);
    
    // 监听任务完成
    const completionHandler = (event) => {
      if (event.taskId === taskId) {
        this._handleChainTaskCompletion(chain, task, event.result);
        this.engine.off('task-completed', completionHandler);
        this.engine.off('task-failed', failureHandler);
      }
    };
    
    const failureHandler = (event) => {
      if (event.taskId === taskId) {
        this._handleChainTaskFailure(chain, task, event.error);
        this.engine.off('task-completed', completionHandler);
        this.engine.off('task-failed', failureHandler);
      }
    };
    
    this.engine.on('task-completed', completionHandler);
    this.engine.on('task-failed', failureHandler);
  }
  
  /**
   * 处理链任务完成
   */
  _handleChainTaskCompletion(chain, task, result) {
    chain.activeTasks.delete(task.id);
    chain.completedTasks.add(task.id);
    chain.results.set(task.id, result);
    
    // 更新依赖的任务状态
    this._updateDependentTasks(chain, task.id);
    
    this.engine.emit('chain-task-completed', { 
      chainId: chain.id, 
      taskId: task.id, 
      result 
    });
  }
  
  /**
   * 处理链任务失败
   */
  _handleChainTaskFailure(chain, task, error) {
    chain.activeTasks.delete(task.id);
    chain.failedTasks.add(task.id);
    
    // 决定是否重试或终止链
    if (chain.failedTasks.size > chain.tasks.length * 0.3) {
      // 失败率过高，终止整个链
      chain.status = 'failed';
      this.engine.emit('task-chain-failed', { 
        chainId: chain.id, 
        reason: 'too_many_failures' 
      });
    }
  }
  
  /**
   * 更新依赖任务状态
   */
  _updateDependentTasks(chain, completedTaskId) {
    const taskNode = chain.dependencies.get(completedTaskId);
    if (!taskNode) return;
    
    for (const dependentId of taskNode.dependents) {
      const dependentNode = chain.dependencies.get(dependentId);
      if (dependentNode) {
        // 检查该依赖任务的所有前置任务是否已完成
        const allDepsCompleted = dependentNode.dependencies.every(depId => 
          chain.completedTasks.has(depId)
        );
        
        dependentNode.ready = allDepsCompleted;
      }
    }
  }
  
  /**
   * 更新链进度
   */
  _updateChainProgress(chain) {
    const totalTasks = chain.tasks.length;
    const completedTasks = chain.completedTasks.size;
    chain.progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
  }
  
  /**
   * 计算系统负载
   */
  _calculateSystemLoad() {
    const activeTasks = this.engine.tasks.size;
    const maxConcurrent = this.engine.maxConcurrentTasks;
    return activeTasks / maxConcurrent;
  }
}", "original_text": "", "replace_all": false}]