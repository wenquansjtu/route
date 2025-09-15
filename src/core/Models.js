import { Matrix } from 'ml-matrix';

/**
 * 张量扰动 - 表示Agent网络中的语义扰动
 * 类比CMB张量扰动，用于建模Agent间的相互作用
 */
export class TensorPerturbation {
  constructor(config = {}) {
    this.id = config.id || this._generateId();
    this.sourceAgentId = config.sourceAgentId;
    this.targetAgentId = config.targetAgentId;
    
    // 张量属性
    this.magnitude = config.magnitude || 0;
    this.direction = config.direction || { x: 0, y: 0, z: 0 };
    this.frequency = config.frequency || 1.0;
    this.phase = config.phase || 0;
    
    // 语义属性
    this.semanticType = config.semanticType || 'neutral'; // collaboration, competition, information, error
    this.coherenceLevel = config.coherenceLevel || 0.5;
    this.noveltyScore = config.noveltyScore || 0;
    
    // 时间属性
    this.timestamp = config.timestamp || Date.now();
    this.duration = config.duration || 1000; // ms
    this.decayRate = config.decayRate || 0.1;
    
    // 传播属性
    this.propagationSpeed = config.propagationSpeed || 1.0;
    this.damping = config.damping || 0.05;
    this.resonanceFreq = config.resonanceFreq || 1.0;
  }
  
  _generateId() {
    return `pert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  
  /**
   * 计算当前时刻的扰动强度
   */
  getCurrentMagnitude(currentTime = Date.now()) {
    const elapsed = (currentTime - this.timestamp) / 1000; // 转换为秒
    
    if (elapsed > this.duration / 1000) {
      return 0; // 扰动已结束
    }
    
    // 考虑衰减和振荡
    const decay = Math.exp(-this.decayRate * elapsed);
    const oscillation = Math.sin(2 * Math.PI * this.frequency * elapsed + this.phase);
    
    return this.magnitude * decay * oscillation;
  }
  
  /**
   * 计算扰动在特定位置的影响
   */
  getInfluenceAtPosition(position, agentPosition) {
    const distance = this._calculateDistance(position, agentPosition);
    const attenuation = 1 / (1 + this.damping * distance);
    
    return {
      magnitude: this.getCurrentMagnitude() * attenuation,
      direction: this._calculateDirectionAt(position, agentPosition),
      coherence: this.coherenceLevel * attenuation
    };
  }
  
  /**
   * 计算两点之间的距离
   */
  _calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * 计算扰动在特定位置的方向
   */
  _calculateDirectionAt(targetPos, sourcePos) {
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const dz = targetPos.z - sourcePos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance === 0) return { x: 0, y: 0, z: 0 };
    
    return {
      x: dx / distance,
      y: dy / distance,
      z: dz / distance
    };
  }
  
  /**
   * 检查扰动是否仍然活跃
   */
  isActive(currentTime = Date.now()) {
    const elapsed = currentTime - this.timestamp;
    return elapsed < this.duration && this.getCurrentMagnitude(currentTime) > 0.001;
  }
  
  /**
   * 更新扰动参数
   */
  update(params) {
    Object.assign(this, params);
  }
  
  /**
   * 序列化扰动数据
   */
  serialize() {
    return {
      id: this.id,
      sourceAgentId: this.sourceAgentId,
      targetAgentId: this.targetAgentId,
      magnitude: this.magnitude,
      direction: this.direction,
      frequency: this.frequency,
      phase: this.phase,
      semanticType: this.semanticType,
      coherenceLevel: this.coherenceLevel,
      noveltyScore: this.noveltyScore,
      timestamp: this.timestamp,
      duration: this.duration,
      decayRate: this.decayRate,
      propagationSpeed: this.propagationSpeed,
      damping: this.damping,
      resonanceFreq: this.resonanceFreq
    };
  }
}

/**
 * 语义向量 - 表示Agent的语义状态
 */
export class SemanticVector {
  constructor(dimensions = 768, values = null) {
    this.dimensions = dimensions;
    this.values = values || new Array(dimensions).fill(0).map(() => Math.random() * 2 - 1);
    this.magnitude = this._calculateMagnitude();
    this.timestamp = Date.now();
  }
  
  /**
   * 计算向量模长
   */
  _calculateMagnitude() {
    return Math.sqrt(this.values.reduce((sum, val) => sum + val * val, 0));
  }
  
  /**
   * 归一化向量
   */
  normalize() {
    const mag = this.magnitude;
    if (mag > 0) {
      this.values = this.values.map(val => val / mag);
      this.magnitude = 1.0;
    }
    return this;
  }
  
  /**
   * 计算与另一个向量的余弦相似度
   */
  cosineSimilarity(other) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < this.dimensions; i++) {
      dotProduct += this.values[i] * other.values[i];
      normA += this.values[i] * this.values[i];
      normB += other.values[i] * other.values[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * 计算欧几里得距离
   */
  euclideanDistance(other) {
    let sum = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const diff = this.values[i] - other.values[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }
  
  /**
   * 向量加法
   */
  add(other, weight = 1.0) {
    const result = new SemanticVector(this.dimensions);
    for (let i = 0; i < this.dimensions; i++) {
      result.values[i] = this.values[i] + other.values[i] * weight;
    }
    result.magnitude = result._calculateMagnitude();
    return result;
  }
  
  /**
   * 向量减法
   */
  subtract(other) {
    const result = new SemanticVector(this.dimensions);
    for (let i = 0; i < this.dimensions; i++) {
      result.values[i] = this.values[i] - other.values[i];
    }
    result.magnitude = result._calculateMagnitude();
    return result;
  }
  
  /**
   * 标量乘法
   */
  multiply(scalar) {
    const result = new SemanticVector(this.dimensions);
    result.values = this.values.map(val => val * scalar);
    result.magnitude = result._calculateMagnitude();
    return result;
  }
  
  /**
   * 插值
   */
  interpolate(other, factor) {
    const result = new SemanticVector(this.dimensions);
    for (let i = 0; i < this.dimensions; i++) {
      result.values[i] = this.values[i] * (1 - factor) + other.values[i] * factor;
    }
    result.magnitude = result._calculateMagnitude();
    return result;
  }
  
  /**
   * 克隆向量
   */
  clone() {
    return new SemanticVector(this.dimensions, [...this.values]);
  }
  
  /**
   * 转换为矩阵
   */
  toMatrix() {
    return new Matrix([this.values]);
  }
  
  /**
   * 从矩阵创建向量
   */
  static fromMatrix(matrix) {
    const values = matrix.getRow(0);
    return new SemanticVector(values.length, values);
  }
  
  /**
   * 生成随机向量
   */
  static random(dimensions = 768, range = 1.0) {
    const values = new Array(dimensions).fill(0).map(() => (Math.random() * 2 - 1) * range);
    return new SemanticVector(dimensions, values);
  }
  
  /**
   * 零向量
   */
  static zero(dimensions = 768) {
    return new SemanticVector(dimensions, new Array(dimensions).fill(0));
  }
  
  /**
   * 序列化向量
   */
  serialize() {
    return {
      dimensions: this.dimensions,
      values: this.values,
      magnitude: this.magnitude,
      timestamp: this.timestamp
    };
  }
  
  /**
   * 从序列化数据恢复向量
   */
  static deserialize(data) {
    const vector = new SemanticVector(data.dimensions, data.values);
    vector.magnitude = data.magnitude;
    vector.timestamp = data.timestamp;
    return vector;
  }
}

/**
 * 任务定义
 */
export class Task {
  constructor(config = {}) {
    this.id = config.id || this._generateTaskId();
    this.type = config.type || 'general';
    this.priority = config.priority || 0;
    this.complexity = config.complexity || 10;
    
    // 任务内容
    this.description = config.description || '';
    this.input = config.input || {};
    this.expectedOutput = config.expectedOutput || {};
    this.constraints = config.constraints || {};
    
    // 依赖关系
    this.dependencies = config.dependencies || []; // 依赖的任务ID列表
    this.dependents = config.dependents || []; // 依赖此任务的任务ID列表
    
    // 执行状态
    this.status = 'pending'; // pending, assigned, executing, completed, failed, cancelled
    this.assignedAgents = new Set(config.assignedAgents || []);
    this.result = null;
    this.error = null;
    
    // 时间属性
    this.createdAt = config.createdAt || Date.now();
    this.assignedAt = null;
    this.startedAt = null;
    this.completedAt = null;
    this.deadline = config.deadline || null;
    
    // 语义属性
    this.semanticVector = config.semanticVector || SemanticVector.random();
    this.requiredCapabilities = config.requiredCapabilities || [];
    
    // 协作属性
    this.collaborationType = config.collaborationType || 'sequential'; // sequential, parallel, hierarchical
    this.minAgents = config.minAgents || 1;
    this.maxAgents = config.maxAgents || 1;
  }
  
  _generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  
  /**
   * 分配Agent给任务
   */
  assignAgent(agentId) {
    if (this.assignedAgents.size < this.maxAgents) {
      this.assignedAgents.add(agentId);
      if (this.status === 'pending') {
        this.status = 'assigned';
        this.assignedAt = Date.now();
      }
      return true;
    }
    return false;
  }
  
  /**
   * 移除Agent分配
   */
  unassignAgent(agentId) {
    this.assignedAgents.delete(agentId);
    if (this.assignedAgents.size === 0) {
      this.status = 'pending';
      this.assignedAt = null;
    }
  }
  
  /**
   * 开始执行任务
   */
  start() {
    if (this.status === 'assigned') {
      this.status = 'executing';
      this.startedAt = Date.now();
      return true;
    }
    return false;
  }
  
  /**
   * 完成任务
   */
  complete(result) {
    this.status = 'completed';
    this.result = result;
    this.completedAt = Date.now();
  }
  
  /**
   * 任务失败
   */
  fail(error) {
    this.status = 'failed';
    this.error = error;
    this.completedAt = Date.now();
  }
  
  /**
   * 取消任务
   */
  cancel() {
    this.status = 'cancelled';
    this.completedAt = Date.now();
  }
  
  /**
   * 检查是否可以执行
   */
  canExecute(completedTasks = new Set()) {
    return this.dependencies.every(depId => completedTasks.has(depId));
  }
  
  /**
   * 检查是否过期
   */
  isOverdue(currentTime = Date.now()) {
    return this.deadline && currentTime > this.deadline;
  }
  
  /**
   * 计算执行时间
   */
  getExecutionTime() {
    if (this.startedAt && this.completedAt) {
      return this.completedAt - this.startedAt;
    }
    return null;
  }
  
  /**
   * 获取任务进度
   */
  getProgress() {
    switch (this.status) {
      case 'pending': return 0;
      case 'assigned': return 0.1;
      case 'executing': return 0.5;
      case 'completed': return 1.0;
      case 'failed':
      case 'cancelled': return 0;
      default: return 0;
    }
  }
  
  /**
   * 序列化任务
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      priority: this.priority,
      complexity: this.complexity,
      description: this.description,
      input: this.input,
      expectedOutput: this.expectedOutput,
      constraints: this.constraints,
      dependencies: this.dependencies,
      dependents: this.dependents,
      status: this.status,
      assignedAgents: Array.from(this.assignedAgents),
      result: this.result,
      error: this.error,
      createdAt: this.createdAt,
      assignedAt: this.assignedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      deadline: this.deadline,
      semanticVector: this.semanticVector.serialize(),
      requiredCapabilities: this.requiredCapabilities,
      collaborationType: this.collaborationType,
      minAgents: this.minAgents,
      maxAgents: this.maxAgents
    };
  }
  
  /**
   * 从序列化数据恢复任务
   */
  static deserialize(data) {
    const task = new Task(data);
    task.semanticVector = SemanticVector.deserialize(data.semanticVector);
    task.assignedAgents = new Set(data.assignedAgents);
    return task;
  }
}