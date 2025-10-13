import { Matrix } from 'ml-matrix';
import { EventEmitter } from 'events';
import { SemanticVector, TensorPerturbation } from '../core/Models.js';
import { calculateDistance3D, deepClone } from '../core/index.js';

/**
 * 语义扰动映射矩阵 (Semantic Perturbation Map, SPM)
 * 类比CMB张量扰动建模，构建Agent间的语义关联图谱
 */
export class SemanticPerturbationMap extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // 基础配置
    this.dimensions = config.dimensions || 768; // 语义向量维度
    this.maxAgents = config.maxAgents || 1000;
    this.updateInterval = config.updateInterval || 100; // ms
    
    // 扰动参数
    this.perturbationThreshold = config.perturbationThreshold || 0.1;
    this.propagationSpeed = config.propagationSpeed || 1.0;
    this.dampingFactor = config.dampingFactor || 0.05;
    this.resonanceAmplification = config.resonanceAmplification || 1.5;
    
    // 数据存储
    this.agents = new Map(); // agentId -> agent info
    this.perturbations = new Map(); // perturbationId -> perturbation
    this.semanticMatrix = null; // N×N 语义相似度矩阵
    this.connectionMatrix = null; // N×N 连接强度矩阵
    this.influenceMatrix = null; // N×N 影响力矩阵
    
    // 协作指标
    this.collaborationTrends = new Map(); // agentId -> trend data
    this.gravityCenters = []; // 引力中心列表
    this.cooperationIslands = []; // 协作孤岛
    
    // 统计数据
    this.statistics = {
      totalPerturbations: 0,
      activePerturbations: 0,
      averageCoherence: 0,
      networkEntropy: 0,
      lastUpdate: Date.now()
    };
    
    this._initializeSPM();
  }
  
  /**
   * 初始化SPM系统
   */
  _initializeSPM() {
    // 启动定期更新
    this.updateTimer = setInterval(() => {
      this._updatePerturbationMap();
    }, this.updateInterval);
    
    this.on('agent-added', this._handleAgentAdded.bind(this));
    this.on('agent-removed', this._handleAgentRemoved.bind(this));
    this.on('perturbation-created', this._handlePerturbationCreated.bind(this));
  }
  
  /**
   * 添加Agent到映射矩阵
   */
  addAgent(agent) {
    if (this.agents.size >= this.maxAgents) {
      throw new Error('Maximum agents limit reached');
    }
    
    const agentInfo = {
      id: agent.id,
      name: agent.name,
      position: { ...agent.position },
      semanticVector: new SemanticVector(this.dimensions, [...agent.semanticEmbedding]),
      lastUpdate: Date.now(),
      influenceRadius: this._calculateInfluenceRadius(agent),
      collaborationScore: 0,
      perturbationHistory: []
    };
    
    this.agents.set(agent.id, agentInfo);
    this._rebuildMatrices();
    
    this.emit('agent-added', { agentId: agent.id, agentInfo });
    return true;
  }
  
  /**
   * 移除Agent
   */
  removeAgent(agentId) {
    if (this.agents.has(agentId)) {
      this.agents.delete(agentId);
      this.collaborationTrends.delete(agentId);
      this._rebuildMatrices();
      
      this.emit('agent-removed', { agentId });
      return true;
    }
    return false;
  }
  
  /**
   * 更新Agent信息
   */
  updateAgent(agentId, updates) {
    const agentInfo = this.agents.get(agentId);
    if (!agentInfo) return false;
    
    let needRebuild = false;
    
    if (updates.position) {
      agentInfo.position = { ...updates.position };
      needRebuild = true;
    }
    
    if (updates.semanticEmbedding) {
      agentInfo.semanticVector = new SemanticVector(this.dimensions, [...updates.semanticEmbedding]);
      needRebuild = true;
    }
    
    agentInfo.lastUpdate = Date.now();
    
    if (needRebuild) {
      this._rebuildMatrices();
    }
    
    this.emit('agent-updated', { agentId, updates });
    return true;
  }
  
  /**
   * 创建语义扰动
   */
  createPerturbation(sourceAgentId, targetAgentId, config = {}) {
    const sourceAgent = this.agents.get(sourceAgentId);
    const targetAgent = this.agents.get(targetAgentId);
    
    if (!sourceAgent || !targetAgent) {
      throw new Error('Source or target agent not found');
    }
    
    // 计算扰动参数
    const semanticDistance = sourceAgent.semanticVector.euclideanDistance(targetAgent.semanticVector);
    const physicalDistance = calculateDistance3D(sourceAgent.position, targetAgent.position);
    
    const perturbation = new TensorPerturbation({
      sourceAgentId,
      targetAgentId,
      magnitude: config.magnitude || this._calculatePerturbationMagnitude(semanticDistance, physicalDistance),
      direction: this._calculatePerturbationDirection(sourceAgent.position, targetAgent.position),
      frequency: config.frequency || 1.0,
      semanticType: config.semanticType || 'collaboration',
      coherenceLevel: config.coherenceLevel || (1 - semanticDistance / 2),
      noveltyScore: config.noveltyScore || this._calculateNoveltyScore(sourceAgent, targetAgent),
      duration: config.duration || 5000,
      ...config
    });
    
    this.perturbations.set(perturbation.id, perturbation);
    this.statistics.totalPerturbations++;
    
    // 更新Agent的扰动历史
    sourceAgent.perturbationHistory.push({
      perturbationId: perturbation.id,
      type: 'outgoing',
      timestamp: Date.now()
    });
    
    targetAgent.perturbationHistory.push({
      perturbationId: perturbation.id,
      type: 'incoming',
      timestamp: Date.now()
    });
    
    this.emit('perturbation-created', { perturbation });
    return perturbation;
  }
  
  /**
   * 计算扰动幅度
   */
  _calculatePerturbationMagnitude(semanticDistance, physicalDistance) {
    // 语义距离越小，物理距离越小，扰动越强
    const semanticFactor = Math.exp(-semanticDistance);
    const spatialFactor = 1 / (1 + physicalDistance * 0.001);
    return semanticFactor * spatialFactor;
  }
  
  /**
   * 计算扰动方向
   */
  _calculatePerturbationDirection(sourcePos, targetPos) {
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
   * 计算新颖度分数
   */
  _calculateNoveltyScore(sourceAgent, targetAgent) {
    // 基于历史协作频率计算新颖度
    const collaborationHistory = sourceAgent.perturbationHistory.filter(h => 
      h.type === 'outgoing' && 
      this.perturbations.get(h.perturbationId)?.targetAgentId === targetAgent.id
    );
    
    const recentCollaborations = collaborationHistory.filter(h => 
      Date.now() - h.timestamp < 60000 // 最近1分钟
    );
    
    return Math.max(0, 1 - recentCollaborations.length * 0.2);
  }
  
  /**
   * 重建矩阵
   */
  _rebuildMatrices() {
    const agentCount = this.agents.size;
    if (agentCount === 0) return;
    
    const agentIds = Array.from(this.agents.keys());
    
    // 构建语义相似度矩阵
    this.semanticMatrix = new Matrix(agentCount, agentCount);
    this.connectionMatrix = new Matrix(agentCount, agentCount);
    this.influenceMatrix = new Matrix(agentCount, agentCount);
    
    for (let i = 0; i < agentCount; i++) {
      for (let j = 0; j < agentCount; j++) {
        if (i === j) {
          this.semanticMatrix.set(i, j, 1.0);
          this.connectionMatrix.set(i, j, 0.0);
          this.influenceMatrix.set(i, j, 0.0);
          continue;
        }
        
        const agent1 = this.agents.get(agentIds[i]);
        const agent2 = this.agents.get(agentIds[j]);
        
        // 语义相似度
        const semanticSimilarity = agent1.semanticVector.cosineSimilarity(agent2.semanticVector);
        this.semanticMatrix.set(i, j, semanticSimilarity);
        
        // 连接强度（基于距离和语义相似度）
        const distance = calculateDistance3D(agent1.position, agent2.position);
        const connectionStrength = semanticSimilarity * Math.exp(-distance * 0.001);
        this.connectionMatrix.set(i, j, connectionStrength);
        
        // 影响力（考虑扰动历史）
        const influenceScore = this._calculateInfluenceScore(agent1, agent2);
        this.influenceMatrix.set(i, j, influenceScore);
      }
    }
    
    this._updateCollaborationTrends();
    this._identifyGravityCenters();
    this._detectCooperationIslands();
  }
  
  /**
   * 计算影响力分数
   */
  _calculateInfluenceScore(agent1, agent2) {
    const perturbations = agent1.perturbationHistory.filter(h => {
      const pert = this.perturbations.get(h.perturbationId);
      return pert && pert.targetAgentId === agent2.id;
    });
    
    let totalInfluence = 0;
    const currentTime = Date.now();
    
    for (const history of perturbations) {
      const pert = this.perturbations.get(history.perturbationId);
      if (pert && pert.isActive(currentTime)) {
        const timeFactor = Math.exp(-(currentTime - pert.timestamp) / 10000); // 时间衰减
        totalInfluence += pert.magnitude * pert.coherenceLevel * timeFactor;
      }
    }
    
    return totalInfluence;
  }
  
  /**
   * 更新协作趋势
   */
  _updateCollaborationTrends() {
    for (const [agentId, agentInfo] of this.agents) {
      const trend = this.collaborationTrends.get(agentId) || {
        collaborationScore: 0,
        trendHistory: [],
        gravitationalPull: 0,
        stabilityIndex: 0
      };
      
      // 计算协作分数
      const currentScore = this._calculateCollaborationScore(agentInfo);
      trend.collaborationScore = currentScore;
      
      // 更新历史趋势
      trend.trendHistory.push({
        timestamp: Date.now(),
        score: currentScore
      });
      
      // 保持历史长度
      if (trend.trendHistory.length > 100) {
        trend.trendHistory.shift();
      }
      
      // 计算引力拉力
      trend.gravitationalPull = this._calculateGravitationalPull(agentId);
      
      // 计算稳定性指数
      trend.stabilityIndex = this._calculateStabilityIndex(trend.trendHistory);
      
      // 预测协作趋势
      const trendHistory = trend.trendHistory;
      const predictedTrend = this._predictCollaborationTrend(trendHistory);
      trend.prediction = predictedTrend;
      
      this.collaborationTrends.set(agentId, trend);
    }
    
    // 更新全局网络熵
    this._updateNetworkEntropy();
  }
  
  /**
   * 计算CMB类型的扰动强度
   */
  _calculateCMBPerturbationIntensity(agent) {
    const activePerturbs = agent.perturbationHistory.filter(h => {
      const pert = this.perturbations.get(h.perturbationId);
      return pert && pert.isActive(Date.now());
    });
    
    let totalIntensity = 0;
    let anisotropicComponent = 0;
    
    for (const history of activePerturbs) {
      const pert = this.perturbations.get(history.perturbationId);
      if (pert) {
        // 基础扰动强度
        totalIntensity += pert.magnitude * pert.coherenceLevel;
        
        // 各向异性分量（类似CMB的温度起伏）
        const direction = pert.direction;
        const anisotropy = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        anisotropicComponent += anisotropy * pert.magnitude;
      }
    }
    
    return {
      total: totalIntensity,
      anisotropic: anisotropicComponent,
      isotropic: totalIntensity - anisotropicComponent
    };
  }
  
  /**
   * 计算各向异性级别（Smoot启发）
   */
  _calculateAnisotropyLevel(agent) {
    const connections = this._getAgentConnections(agent.id);
    if (connections.length < 2) return 0;
    
    // 计算连接方向的分布
    const directions = connections.map(conn => {
      const otherAgent = this.agents.get(conn.targetId);
      if (!otherAgent) return { x: 0, y: 0, z: 0 };
      
      const dx = otherAgent.position.x - agent.position.x;
      const dy = otherAgent.position.y - agent.position.y;
      const dz = otherAgent.position.z - agent.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      return distance > 0 ? {
        x: dx / distance,
        y: dy / distance,
        z: dz / distance
      } : { x: 0, y: 0, z: 0 };
    });
    
    // 计算方向分布的各向异性
    const avgDirection = directions.reduce((acc, dir) => ({
      x: acc.x + dir.x,
      y: acc.y + dir.y,
      z: acc.z + dir.z
    }), { x: 0, y: 0, z: 0 });
    
    avgDirection.x /= directions.length;
    avgDirection.y /= directions.length;
    avgDirection.z /= directions.length;
    
    // 计算偏差
    const variance = directions.reduce((acc, dir) => {
      const dx = dir.x - avgDirection.x;
      const dy = dir.y - avgDirection.y;
      const dz = dir.z - avgDirection.z;
      return acc + (dx * dx + dy * dy + dz * dz);
    }, 0) / directions.length;
    
    return 1 - Math.exp(-variance); // 方差越大，各向异性越强
  }
  
  /**
   * 识别稳定协作路径（类似宇宙结构形成）
   */
  _identifyStableCollaborationPaths(agent) {
    const connections = this._getAgentConnections(agent.id);
    const stablePaths = [];
    
    for (const conn of connections) {
      const otherAgent = this.agents.get(conn.targetId);
      if (!otherAgent) continue;
      
      // 计算路径稳定性
      const stability = this._calculatePathStability(agent, otherAgent);
      
      if (stability > 0.7) { // 稳定性阈值
        stablePaths.push({
          targetId: conn.targetId,
          stability,
          strength: conn.strength,
          pathType: this._classifyPathType(stability, conn.strength)
        });
      }
    }
    
    return stablePaths.sort((a, b) => b.stability - a.stability);
  }
  
  /**
   * 计算路径稳定性
   */
  _calculatePathStability(agent1, agent2) {
    // 基于历史协作成功率
    const collaborationHistory = this._getCollaborationHistory(agent1.id, agent2.id);
    const successRate = this._calculateSuccessRate(collaborationHistory);
    
    // 基于语义相似性稳定性
    const semanticStability = this._calculateSemanticStability(agent1, agent2);
    
    // 基于物理距离稳定性
    const distanceStability = this._calculateDistanceStability(agent1, agent2);
    
    return (successRate * 0.5 + semanticStability * 0.3 + distanceStability * 0.2);
  }
  
  /**
   * 更新网络熵（全局混乱度度量）
   */
  _updateNetworkEntropy() {
    const agentList = Array.from(this.agents.values());
    if (agentList.length < 2) {
      this.statistics.networkEntropy = 0;
      return;
    }
    
    let totalEntropy = 0;
    
    // 计算连接分布熵
    const connectionCounts = agentList.map(agent => 
      this._getAgentConnections(agent.id).length
    );
    
    const maxConnections = Math.max(...connectionCounts);
    const connectionProbs = connectionCounts.map(count => count / maxConnections);
    
    for (const prob of connectionProbs) {
      if (prob > 0) {
        totalEntropy -= prob * Math.log2(prob);
      }
    }
    
    // 归一化
    this.statistics.networkEntropy = totalEntropy / Math.log2(agentList.length);
  }
  
  /**
   * 计算协作分数
   */
  _calculateCollaborationScore(agentInfo) {
    const recentPerturbations = agentInfo.perturbationHistory.filter(h => 
      Date.now() - h.timestamp < 30000 // 最近30秒
    );
    
    let score = 0;
    for (const history of recentPerturbations) {
      const pert = this.perturbations.get(history.perturbationId);
      if (pert) {
        score += pert.magnitude * pert.coherenceLevel * (history.type === 'outgoing' ? 1 : 0.8);
      }
    }
    
    return score;
  }
  
  /**
   * 计算引力拉力
   */
  _calculateGravitationalPull(agentId) {
    if (!this.connectionMatrix || !this.agents.has(agentId)) return 0;
    
    const agentIds = Array.from(this.agents.keys());
    const agentIndex = agentIds.indexOf(agentId);
    
    if (agentIndex === -1) return 0;
    
    let totalPull = 0;
    for (let i = 0; i < agentIds.length; i++) {
      if (i !== agentIndex) {
        totalPull += this.connectionMatrix.get(agentIndex, i);
      }
    }
    
    return totalPull;
  }
  
  /**
   * 计算稳定性指数
   */
  _calculateStabilityIndex(trendHistory) {
    if (trendHistory.length < 2) return 1.0;
    
    const scores = trendHistory.map(h => h.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.exp(-variance); // 方差越小，稳定性越高
  }
  
  /**
   * 识别引力中心
   */
  _identifyGravityCenters() {
    const centers = [];
    const threshold = 0.8; // 引力中心阈值
    
    for (const [agentId, trend] of this.collaborationTrends) {
      if (trend.gravitationalPull > threshold) {
        centers.push({
          agentId,
          pull: trend.gravitationalPull,
          stability: trend.stabilityIndex,
          influence: this._calculateTotalInfluence(agentId)
        });
      }
    }
    
    // 按引力拉力排序
    centers.sort((a, b) => b.pull - a.pull);
    this.gravityCenters = centers.slice(0, 10); // 保留前10个
  }
  
  /**
   * 检测协作孤岛
   */
  _detectCooperationIslands() {
    if (!this.connectionMatrix) return;
    
    const agentIds = Array.from(this.agents.keys());
    const visited = new Set();
    const islands = [];
    
    for (const agentId of agentIds) {
      if (visited.has(agentId)) continue;
      
      const island = this._exploreIsland(agentId, agentIds, visited);
      if (island.length > 1) {
        islands.push({
          agents: island,
          size: island.length,
          avgConnection: this._calculateAvgConnectionInIsland(island, agentIds),
          isolation: this._calculateIsolationScore(island, agentIds)
        });
      }
    }
    
    this.cooperationIslands = islands;
  }
  
  /**
   * 探索协作孤岛
   */
  _exploreIsland(startAgentId, allAgentIds, visited) {
    const island = [];
    const queue = [startAgentId];
    const connectionThreshold = 0.3;
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      island.push(currentId);
      
      const currentIndex = allAgentIds.indexOf(currentId);
      for (let i = 0; i < allAgentIds.length; i++) {
        const neighborId = allAgentIds[i];
        if (!visited.has(neighborId) && this.connectionMatrix.get(currentIndex, i) > connectionThreshold) {
          queue.push(neighborId);
        }
      }
    }
    
    return island;
  }
  
  /**
   * 计算孤岛内平均连接强度
   */
  _calculateAvgConnectionInIsland(island, allAgentIds) {
    let totalConnection = 0;
    let connectionCount = 0;
    
    for (let i = 0; i < island.length; i++) {
      for (let j = i + 1; j < island.length; j++) {
        const idx1 = allAgentIds.indexOf(island[i]);
        const idx2 = allAgentIds.indexOf(island[j]);
        totalConnection += this.connectionMatrix.get(idx1, idx2);
        connectionCount++;
      }
    }
    
    return connectionCount > 0 ? totalConnection / connectionCount : 0;
  }
  
  /**
   * 计算孤岛隔离度
   */
  _calculateIsolationScore(island, allAgentIds) {
    let externalConnections = 0;
    let totalExternalPairs = 0;
    
    for (const agentId of island) {
      const agentIndex = allAgentIds.indexOf(agentId);
      for (let i = 0; i < allAgentIds.length; i++) {
        if (!island.includes(allAgentIds[i])) {
          externalConnections += this.connectionMatrix.get(agentIndex, i);
          totalExternalPairs++;
        }
      }
    }
    
    const avgExternalConnection = totalExternalPairs > 0 ? externalConnections / totalExternalPairs : 0;
    return 1 - avgExternalConnection; // 隔离度 = 1 - 平均外部连接强度
  }
  
  /**
   * 计算总影响力
   */
  _calculateTotalInfluence(agentId) {
    if (!this.influenceMatrix) return 0;
    
    const agentIds = Array.from(this.agents.keys());
    const agentIndex = agentIds.indexOf(agentId);
    
    if (agentIndex === -1) return 0;
    
    let totalInfluence = 0;
    for (let i = 0; i < agentIds.length; i++) {
      totalInfluence += this.influenceMatrix.get(agentIndex, i);
    }
    
    return totalInfluence;
  }
  
  /**
   * 计算Agent的影响半径
   */
  _calculateInfluenceRadius(agent) {
    // 基于Agent的mass和energy计算影响半径
    return Math.sqrt(agent.mass * agent.energy) * 10;
  }
  
  /**
   * 更新扰动映射
   */
  _updatePerturbationMap() {
    const currentTime = Date.now();
    let activePerturbations = 0;
    let totalCoherence = 0;
    
    // 清理过期扰动
    for (const [pertId, perturbation] of this.perturbations) {
      if (!perturbation.isActive(currentTime)) {
        this.perturbations.delete(pertId);
      } else {
        activePerturbations++;
        totalCoherence += perturbation.coherenceLevel;
      }
    }
    
    // 更新统计数据
    this.statistics.activePerturbations = activePerturbations;
    this.statistics.averageCoherence = activePerturbations > 0 ? totalCoherence / activePerturbations : 0;
    this.statistics.networkEntropy = this._calculateNetworkEntropy();
    this.statistics.lastUpdate = currentTime;
    
    this.emit('map-updated', { statistics: this.statistics });
  }
  
  /**
   * 计算网络熵
   */
  _calculateNetworkEntropy() {
    if (!this.connectionMatrix) return 0;
    
    const connections = [];
    const size = this.connectionMatrix.rows;
    
    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) {
        connections.push(this.connectionMatrix.get(i, j));
      }
    }
    
    if (connections.length === 0) return 0;
    
    const totalConnection = connections.reduce((sum, conn) => sum + conn, 0);
    if (totalConnection === 0) return 0;
    
    let entropy = 0;
    for (const conn of connections) {
      if (conn > 0) {
        const probability = conn / totalConnection;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    return entropy;
  }
  
  /**
   * 获取协作趋势预测
   */
  getCollaborationTrendPrediction(agentId, timeHorizon = 30000) {
    const trend = this.collaborationTrends.get(agentId);
    if (!trend || trend.trendHistory.length < 2) {
      return { prediction: 0, confidence: 0 };
    }
    
    const history = trend.trendHistory.slice(-10); // 最近10个数据点
    const timePoints = history.map(h => h.timestamp);
    const scores = history.map(h => h.score);
    
    // 简单线性回归预测
    const n = history.length;
    const sumX = timePoints.reduce((sum, t) => sum + t, 0);
    const sumY = scores.reduce((sum, s) => sum + s, 0);
    const sumXY = timePoints.reduce((sum, t, i) => sum + t * scores[i], 0);
    const sumXX = timePoints.reduce((sum, t) => sum + t * t, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const futureTime = Date.now() + timeHorizon;
    const prediction = slope * futureTime + intercept;
    
    // 计算预测置信度
    const residuals = scores.map((s, i) => s - (slope * timePoints[i] + intercept));
    const mse = residuals.reduce((sum, r) => sum + r * r, 0) / n;
    const confidence = Math.exp(-mse); // 基于均方误差的置信度
    
    return { prediction: Math.max(0, prediction), confidence };
  }
  
  /**
   * 获取推荐的协作Agent
   */
  getRecommendedCollaborators(agentId, maxRecommendations = 5) {
    const agent = this.agents.get(agentId);
    if (!agent) return [];
    
    const recommendations = [];
    
    for (const [otherId, otherAgent] of this.agents) {
      if (otherId === agentId) continue;
      
      const semanticSimilarity = agent.semanticVector.cosineSimilarity(otherAgent.semanticVector);
      const distance = calculateDistance3D(agent.position, otherAgent.position);
      const collaborationHistory = this._getCollaborationHistory(agentId, otherId);
      
      const score = this._calculateCollaborationRecommendationScore(
        semanticSimilarity,
        distance,
        collaborationHistory
      );
      
      recommendations.push({
        agentId: otherId,
        score,
        semanticSimilarity,
        distance,
        collaborationHistory: collaborationHistory.length
      });
    }
    
    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, maxRecommendations);
  }
  
  /**
   * 获取协作历史
   */
  _getCollaborationHistory(agentId1, agentId2) {
    const agent = this.agents.get(agentId1);
    if (!agent) return [];
    
    return agent.perturbationHistory.filter(h => {
      const pert = this.perturbations.get(h.perturbationId);
      return pert && (pert.targetAgentId === agentId2 || pert.sourceAgentId === agentId2);
    });
  }
  
  /**
   * 计算协作推荐分数
   */
  _calculateCollaborationRecommendationScore(similarity, distance, history) {
    const semanticFactor = similarity * 0.4;
    const proximityFactor = Math.exp(-distance * 0.001) * 0.3;
    const noveltyFactor = Math.exp(-history.length * 0.1) * 0.3;
    
    return semanticFactor + proximityFactor + noveltyFactor;
  }
  
  /**
   * 获取SPM状态摘要
   */
  getStatusSummary() {
    return {
      agents: this.agents.size,
      activePerturbations: this.statistics.activePerturbations,
      totalPerturbations: this.statistics.totalPerturbations,
      averageCoherence: this.statistics.averageCoherence,
      networkEntropy: this.statistics.networkEntropy,
      gravityCenters: this.gravityCenters.length,
      cooperationIslands: this.cooperationIslands.length,
      lastUpdate: this.statistics.lastUpdate
    };
  }
  
  /**
   * 处理Agent添加事件
   */
  _handleAgentAdded(event) {
    // 子类可重写
  }
  
  /**
   * 处理Agent移除事件
   */
  _handleAgentRemoved(event) {
    // 子类可重写
  }
  
  /**
   * 处理扰动创建事件
   */
  _handlePerturbationCreated(event) {
    // 子类可重写
  }
  
  /**
   * 清理资源
   */
  destroy() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    this.removeAllListeners();
  }
}