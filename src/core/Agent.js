import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

/**
 * AI Agent - 类宇宙结构中的扰动源
 * 每个Agent都有自己的语义空间位置和能量状态
 */
export class CosmicAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // 基础属性
    this.id = config.id || uuidv4();
    this.name = config.name || `Agent-${this.id.slice(0, 8)}`;
    this.type = config.type || 'general';
    this.capabilities = config.capabilities || [];
    
    // 宇宙结构属性
    this.position = config.position || this._generateRandomPosition();
    this.mass = config.mass || 1.0; // 影响力权重
    this.energy = config.energy || 100.0; // 当前能量状态
    this.maxEnergy = config.maxEnergy || 100.0;
    
    // 语义属性
    this.semanticEmbedding = config.semanticEmbedding || new Array(768).fill(0).map(() => Math.random());
    this.contextWindow = config.contextWindow || [];
    this.memoryEntropy = 0; // 记忆熵值
    
    // 协作属性
    this.collaborationHistory = new Map(); // 与其他Agent的协作历史
    this.currentTasks = new Set(); // 当前执行的任务
    this.connectionStrength = new Map(); // 与其他Agent的连接强度
    
    // 状态属性
    this.status = 'idle'; // idle, busy, offline, error
    this.lastActivity = Date.now();
    this.performanceMetrics = {
      tasksCompleted: 0,
      averageResponseTime: 0,
      successRate: 1.0,
      collaborationScore: 0
    };
    
    this._initializeAgent();
  }
  
  /**
   * 生成随机的3D宇宙坐标位置
   */
  _generateRandomPosition() {
    return {
      x: (Math.random() - 0.5) * 1000,
      y: (Math.random() - 0.5) * 1000,
      z: (Math.random() - 0.5) * 1000
    };
  }
  
  /**
   * 初始化Agent
   */
  _initializeAgent() {
    this.on('task-received', this._handleTaskReceived.bind(this));
    this.on('collaboration-request', this._handleCollaborationRequest.bind(this));
    this.on('energy-depleted', this._handleEnergyDepletion.bind(this));
    
    // 定期更新状态
    setInterval(() => this._updateStatus(), 1000);
  }
  
  /**
   * 更新Agent的语义嵌入向量
   */
  updateSemanticEmbedding(newEmbedding) {
    this.semanticEmbedding = newEmbedding;
    this._updateMemoryEntropy();
    this.emit('semantic-updated', { agentId: this.id, embedding: newEmbedding });
  }
  
  /**
   * 计算与另一个Agent的语义距离
   */
  calculateSemanticDistance(otherAgent) {
    const embedding1 = this.semanticEmbedding;
    const embedding2 = otherAgent.semanticEmbedding;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return 1 - similarity; // 距离 = 1 - 相似度
  }
  
  /**
   * 计算与另一个Agent的物理距离
   */
  calculatePhysicalDistance(otherAgent) {
    const dx = this.position.x - otherAgent.position.x;
    const dy = this.position.y - otherAgent.position.y;
    const dz = this.position.z - otherAgent.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * 更新与其他Agent的连接强度
   */
  updateConnectionStrength(agentId, strength) {
    this.connectionStrength.set(agentId, strength);
    this.emit('connection-updated', { agentId: this.id, targetId: agentId, strength });
  }
  
  /**
   * 添加上下文信息
   */
  addContext(context) {
    this.contextWindow.push({
      timestamp: Date.now(),
      content: context,
      relevance: 1.0
    });
    
    // 保持上下文窗口大小
    if (this.contextWindow.length > 50) {
      this.contextWindow.shift();
    }
    
    this._updateMemoryEntropy();
  }
  
  /**
   * 处理任务
   */
  async processTask(task) {
    if (this.energy < 10) {
      throw new Error('Insufficient energy to process task');
    }
    
    this.status = 'busy';
    this.currentTasks.add(task.id);
    
    try {
      const startTime = Date.now();
      
      // 模拟任务处理
      const result = await this._executeTask(task);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 更新性能指标
      this._updatePerformanceMetrics(responseTime, true);
      
      // 消耗能量
      this._consumeEnergy(task.complexity || 10);
      
      this.currentTasks.delete(task.id);
      this.status = this.currentTasks.size > 0 ? 'busy' : 'idle';
      
      this.emit('task-completed', { agentId: this.id, taskId: task.id, result, responseTime });
      
      return result;
    } catch (error) {
      this._updatePerformanceMetrics(0, false);
      this.currentTasks.delete(task.id);
      this.status = 'error';
      
      this.emit('task-failed', { agentId: this.id, taskId: task.id, error: error.message });
      throw error;
    }
  }
  
  /**
   * 执行具体任务（子类可重写）
   */
  async _executeTask(task) {
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return {
      taskId: task.id,
      result: `Task ${task.type} completed by ${this.name}`,
      confidence: Math.random() * 0.3 + 0.7,
      metadata: {
        processingTime: Date.now(),
        agentCapabilities: this.capabilities
      }
    };
  }
  
  /**
   * 消耗能量
   */
  _consumeEnergy(amount) {
    this.energy = Math.max(0, this.energy - amount);
    if (this.energy === 0) {
      this.emit('energy-depleted', { agentId: this.id });
    }
  }
  
  /**
   * 恢复能量
   */
  restoreEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    if (this.status === 'offline' && this.energy > 10) {
      this.status = 'idle';
    }
  }
  
  /**
   * 更新记忆熵值
   */
  _updateMemoryEntropy() {
    if (this.contextWindow.length === 0) {
      this.memoryEntropy = 0;
      return;
    }
    
    // 计算上下文的信息熵
    const relevanceSum = this.contextWindow.reduce((sum, ctx) => sum + ctx.relevance, 0);
    let entropy = 0;
    
    for (const ctx of this.contextWindow) {
      const probability = ctx.relevance / relevanceSum;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    }
    
    this.memoryEntropy = entropy;
  }
  
  /**
   * 更新性能指标
   */
  _updatePerformanceMetrics(responseTime, success) {
    const metrics = this.performanceMetrics;
    
    if (success) {
      metrics.tasksCompleted++;
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
    }
    
    // 更新成功率（指数衰减平均）
    metrics.successRate = metrics.successRate * 0.9 + (success ? 1 : 0) * 0.1;
  }
  
  /**
   * 更新Agent状态
   */
  _updateStatus() {
    this.lastActivity = Date.now();
    
    // 自动恢复少量能量
    if (this.energy < this.maxEnergy) {
      this.restoreEnergy(0.5);
    }
    
    // 检查是否长时间未活动
    const inactiveTime = Date.now() - this.lastActivity;
    if (inactiveTime > 30000 && this.status === 'idle') { // 30秒
      this.status = 'offline';
    }
  }
  
  /**
   * 处理任务接收事件
   */
  _handleTaskReceived(event) {
    // 子类可重写此方法
  }
  
  /**
   * 处理协作请求
   */
  _handleCollaborationRequest(event) {
    // 子类可重写此方法
  }
  
  /**
   * 处理能量耗尽
   */
  _handleEnergyDepletion(event) {
    this.status = 'offline';
    this.currentTasks.clear();
  }
  
  /**
   * 获取Agent状态摘要
   */
  getStatusSummary() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      energy: this.energy,
      position: this.position,
      activeTasks: this.currentTasks.size,
      memoryEntropy: this.memoryEntropy,
      performanceMetrics: { ...this.performanceMetrics },
      connectionCount: this.connectionStrength.size
    };
  }
  
  /**
   * 序列化Agent状态
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      capabilities: this.capabilities,
      position: this.position,
      mass: this.mass,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      semanticEmbedding: this.semanticEmbedding,
      status: this.status,
      performanceMetrics: this.performanceMetrics
    };
  }
  
  /**
   * 从序列化数据恢复Agent
   */
  static deserialize(data) {
    return new CosmicAgent(data);
  }
}