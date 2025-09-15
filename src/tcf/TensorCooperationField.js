import { Matrix } from 'ml-matrix';
import { EventEmitter } from 'events';
import { TensorPerturbation, SemanticVector } from '../core/Models.js';
import { calculateDistance3D, multiply3D, add3D, normalize3D } from '../core/index.js';

/**
 * 张量协作力场 (Tensor Cooperation Field, TCF)
 * 类比引力张量扰动原理，量化Agent间协同效应
 */
export class TensorCooperationField extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // 基础配置
    this.dimensions = config.dimensions || 768;
    this.fieldResolution = config.fieldResolution || 50;
    this.updateInterval = config.updateInterval || 200;
    
    // 张量维度配置
    this.tensorDimensions = {
      semantic: config.semanticDim || 0.4,
      novelty: config.noveltyDim || 0.25,
      coherence: config.coherenceDim || 0.25,
      entropy: config.entropyDim || 0.1
    };
    
    // 力场参数
    this.fieldParameters = {
      attractionStrength: config.attractionStrength || 1.0,
      repulsionStrength: config.repulsionStrength || 0.3,
      dampingFactor: config.dampingFactor || 0.1,
      resonanceThreshold: config.resonanceThreshold || 0.8,
      convergenceThreshold: config.convergenceThreshold || 0.95,
      divergenceThreshold: config.divergenceThreshold || 0.2
    };
    
    // 数据存储
    this.agents = new Map();
    this.fieldGrid = null;
    this.forceVectors = new Map();
    this.cooperationWaves = [];
    this.resonanceZones = [];
    this.singularityPoints = [];
    
    // 协作行为状态
    this.collaborationState = {
      globalCoherence: 0,
      resonanceLevel: 0,
      convergenceStatus: 'stable',
      energyDistribution: [],
      waveAmplitude: 0
    };
    
    // 性能监控
    this.fieldMetrics = {
      totalEnergy: 0,
      averageForce: 0,
      coherenceStability: 0,
      cooperationEfficiency: 0,
      lastUpdate: Date.now()
    };
    
    this._initializeTCF();
  }
  
  /**
   * 初始化TCF系统
   */
  _initializeTCF() {
    this._initializeFieldGrid();
    
    this.updateTimer = setInterval(() => {
      this._updateCooperationField();
    }, this.updateInterval);
    
    this.on('agent-added', this._handleAgentAdded.bind(this));
    this.on('agent-removed', this._handleAgentRemoved.bind(this));
    this.on('perturbation-detected', this._handlePerturbationDetected.bind(this));
  }
  
  /**
   * 初始化力场网格
   */
  _initializeFieldGrid() {
    const resolution = this.fieldResolution;
    this.fieldGrid = {
      resolution,
      bounds: { min: -500, max: 500 },
      forces: new Array(resolution).fill(null).map(() =>
        new Array(resolution).fill(null).map(() =>
          new Array(resolution).fill(null).map(() => ({
            x: 0, y: 0, z: 0,
            magnitude: 0,
            type: 'neutral'
          }))
        )
      )
    };
  }
  
  /**
   * 添加Agent到力场
   */
  addAgent(agent) {
    const agentField = {
      id: agent.id,
      position: { ...agent.position },
      semanticVector: new SemanticVector(this.dimensions, [...agent.semanticEmbedding]),
      mass: agent.mass || 1.0,
      energy: agent.energy || 100.0,
      
      // 张量属性
      semanticDistance: 0,
      noveltyScore: 0,
      coherenceLevel: 0,
      memoryEntropy: agent.memoryEntropy || 0,
      
      // 力场属性
      forceVector: { x: 0, y: 0, z: 0 },
      influenceRadius: this._calculateInfluenceRadius(agent),
      cooperationState: 'neutral',
      
      // 历史数据
      forceHistory: [],
      cooperationHistory: [],
      lastUpdate: Date.now()
    };
    
    this.agents.set(agent.id, agentField);
    this._recalculateAgentMetrics(agent.id);
    
    this.emit('agent-added', { agentId: agent.id });
    return true;
  }
  
  /**
   * 移除Agent
   */
  removeAgent(agentId) {
    if (this.agents.has(agentId)) {
      this.agents.delete(agentId);
      this.forceVectors.delete(agentId);
      this.emit('agent-removed', { agentId });
      return true;
    }
    return false;
  }
  
  /**
   * 更新Agent信息
   */
  updateAgent(agentId, updates) {
    const agentField = this.agents.get(agentId);
    if (!agentField) return false;
    
    if (updates.position) {
      agentField.position = { ...updates.position };
    }
    
    if (updates.semanticEmbedding) {
      agentField.semanticVector = new SemanticVector(this.dimensions, [...updates.semanticEmbedding]);
    }
    
    if (updates.energy !== undefined) {
      agentField.energy = updates.energy;
    }
    
    if (updates.memoryEntropy !== undefined) {
      agentField.memoryEntropy = updates.memoryEntropy;
    }
    
    agentField.lastUpdate = Date.now();
    this._recalculateAgentMetrics(agentId);
    
    this.emit('agent-updated', { agentId, updates });
    return true;
  }
  
  /**
   * 重新计算Agent指标
   */
  _recalculateAgentMetrics(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    // 计算与其他Agent的平均语义距离
    let totalDistance = 0;
    let count = 0;
    
    for (const [otherId, otherAgent] of this.agents) {
      if (otherId !== agentId) {
        const distance = agent.semanticVector.euclideanDistance(otherAgent.semanticVector);
        totalDistance += distance;
        count++;
      }
    }
    
    agent.semanticDistance = count > 0 ? totalDistance / count : 0;
    agent.noveltyScore = this._calculateNoveltyScore(agent);
    agent.coherenceLevel = this._calculateCoherenceLevel(agent);
  }
  
  /**
   * 计算新颖度分数
   */
  _calculateNoveltyScore(agent) {
    let minSimilarity = 1.0;
    
    for (const [otherId, otherAgent] of this.agents) {
      if (otherId !== agent.id) {
        const similarity = agent.semanticVector.cosineSimilarity(otherAgent.semanticVector);
        minSimilarity = Math.min(minSimilarity, similarity);
      }
    }
    
    return 1 - minSimilarity;
  }
  
  /**
   * 计算上下文对齐度
   */
  _calculateCoherenceLevel(agent) {
    const entropyFactor = Math.exp(-agent.memoryEntropy);
    const energyFactor = agent.energy / 100.0;
    
    return (entropyFactor + energyFactor) / 2;
  }
  
  /**
   * 计算影响半径
   */
  _calculateInfluenceRadius(agent) {
    return Math.sqrt(agent.mass * agent.energy) * 10;
  }
  
  /**
   * 更新协作力场
   */
  _updateCooperationField() {
    this._calculateTensorForces();
    this._updateFieldGrid();
    this._detectCooperationWaves();
    this._identifyResonanceZones();
    this._detectSingularityPoints();
    this._updateCollaborationState();
    this._updateFieldMetrics();
    
    this.emit('field-updated', {
      collaborationState: this.collaborationState,
      metrics: this.fieldMetrics
    });
  }
  
  /**
   * 计算张量力
   */
  _calculateTensorForces() {
    const agents = Array.from(this.agents.values());
    
    // 清空力向量
    for (const agent of agents) {
      agent.forceVector = { x: 0, y: 0, z: 0 };
    }
    
    // 计算每对Agent之间的力
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const force = this._calculatePairwiseForce(agents[i], agents[j]);
        
        // 应用力到两个Agent
        agents[i].forceVector = add3D(agents[i].forceVector, force);
        agents[j].forceVector = add3D(agents[j].forceVector, multiply3D(force, -1));
      }
    }
    
    // 更新力向量历史
    for (const agent of agents) {
      agent.forceHistory.push({
        timestamp: Date.now(),
        force: { ...agent.forceVector },
        magnitude: Math.sqrt(
          agent.forceVector.x ** 2 + 
          agent.forceVector.y ** 2 + 
          agent.forceVector.z ** 2
        )
      });
      
      // 保持历史长度
      if (agent.forceHistory.length > 100) {
        agent.forceHistory.shift();
      }
      
      this.forceVectors.set(agent.id, agent.forceVector);
    }
  }
  
  /**
   * 计算两个Agent之间的力
   */
  _calculatePairwiseForce(agent1, agent2) {
    // 计算多维度张量分析
    const tensorAnalysis = this.calculateTensorAnalysis(agent1, agent2);
    
    // 基于张量分析计算力向量
    const force = this._computeForceFromTensorAnalysis(agent1, agent2, tensorAnalysis);
    
    return force;
  }
  
  /**
   * 计算多维度张量分析
   * 包括：语义距离、新颖度、一致性、熵值
   */
  calculateTensorAnalysis(agent1, agent2) {
    // 1. 语义距离维度
    const semanticDistance = agent1.semanticVector.euclideanDistance(agent2.semanticVector);
    const semanticTensor = {
      distance: semanticDistance,
      similarity: 1 - semanticDistance,
      contextualAlignment: this._calculateContextualAlignment(agent1, agent2),
      knowledgeOverlap: this._calculateKnowledgeOverlap(agent1, agent2)
    };
    
    // 2. 信息新颖度维度
    const noveltyTensor = {
      informationNovelty: this._calculateInformationNovelty(agent1, agent2),
      approachDiversity: this._calculateApproachDiversity(agent1, agent2),
      perspectiveUniqueness: this._calculatePerspectiveUniqueness(agent1, agent2),
      knowledgeComplementarity: this._calculateKnowledgeComplementarity(agent1, agent2)
    };
    
    // 3. 上下文一致性维度
    const coherenceTensor = {
      goalCongruence: this._calculateGoalCongruence(agent1, agent2),
      contextCoherence: this._calculateContextCoherence(agent1, agent2),
      temporalAlignment: this._calculateTemporalAlignment(agent1, agent2),
      methodologicalConsistency: this._calculateMethodologicalConsistency(agent1, agent2)
    };
    
    // 4. 状态能量（记忆熵）维度
    const entropyTensor = {
      memoryEntropy: (agent1.memoryEntropy + agent2.memoryEntropy) / 2,
      cognitiveLoad: this._calculateCognitiveLoad(agent1, agent2),
      informationDensity: this._calculateInformationDensity(agent1, agent2),
      processingComplexity: this._calculateProcessingComplexity(agent1, agent2)
    };
    
    // 综合张量分析
    const tensorAnalysis = {
      semantic: semanticTensor,
      novelty: noveltyTensor,
      coherence: coherenceTensor,
      entropy: entropyTensor,
      
      // 全局指标
      collaborationPotential: this._calculateCollaborationPotential(semanticTensor, noveltyTensor, coherenceTensor, entropyTensor),
      synergyIndex: this._calculateSynergyIndex(semanticTensor, noveltyTensor, coherenceTensor, entropyTensor),
      resonanceFrequency: this._calculateResonanceFrequency(semanticTensor, coherenceTensor),
      harmonicLevel: this._calculateHarmonicLevel(agent1, agent2)
    };
    
    return tensorAnalysis;
  }
  
  /**
   * 基于张量分析计算力向量
   */
  _computeForceFromTensorAnalysis(agent1, agent2, tensorAnalysis) {
    const distance = calculateDistance3D(agent1.position, agent2.position);
    if (distance === 0) return { x: 0, y: 0, z: 0 };
    
    // 方向向量
    const direction = {
      x: (agent2.position.x - agent1.position.x) / distance,
      y: (agent2.position.y - agent1.position.y) / distance,
      z: (agent2.position.z - agent1.position.z) / distance
    };
    
    // 计算引力/斥力强度
    const attractionStrength = this._calculateAttractionStrength(tensorAnalysis);
    const repulsionStrength = this._calculateRepulsionStrength(tensorAnalysis);
    
    const netForce = attractionStrength - repulsionStrength;
    const forceMagnitude = netForce * Math.exp(-distance * 0.001); // 距离衰减
    
    return {
      x: direction.x * forceMagnitude,
      y: direction.y * forceMagnitude,
      z: direction.z * forceMagnitude
    };
  }
  
  /**
   * 计算上下文对齐度
   */
  _calculateContextualAlignment(agent1, agent2) {
    // 基于语义相似性的简化计算
    const semanticSimilarity = agent1.semanticVector.cosineSimilarity(agent2.semanticVector);
    return semanticSimilarity;
  }
  
  /**
   * 计算知识重叠度
   */
  _calculateKnowledgeOverlap(agent1, agent2) {
    // 基于语义向量相似性的简化计算
    return agent1.semanticVector.cosineSimilarity(agent2.semanticVector);
  }
  
  /**
   * 计算信息新颖度
   */
  _calculateInformationNovelty(agent1, agent2) {
    // 基于语义距离计算新颖度
    const semanticDistance = agent1.semanticVector.euclideanDistance(agent2.semanticVector);
    return Math.min(semanticDistance, 1.0);
  }
  
  /**
   * 计算方法多样性
   */
  _calculateApproachDiversity(agent1, agent2) {
    // 基于新颖度分数的差异
    return Math.abs(agent1.noveltyScore - agent2.noveltyScore);
  }
  
  /**
   * 计算视角独特性
   */
  _calculatePerspectiveUniqueness(agent1, agent2) {
    // 基于记忆熵的差异
    return Math.abs(agent1.memoryEntropy - agent2.memoryEntropy);
  }
  
  /**
   * 计算创新潜力
   */
  _calculateInnovationPotential(agent1, agent2) {
    const avgNovelty = (agent1.noveltyScore + agent2.noveltyScore) / 2;
    const diversityBonus = this._calculateApproachDiversity(agent1, agent2) * 0.5;
    return Math.min(avgNovelty + diversityBonus, 1.0);
  }
  
  /**
   * 计算上下文一致性
   */
  _calculateContextualCoherence(agent1, agent2) {
    const coherence1 = agent1.coherenceLevel || 0;
    const coherence2 = agent2.coherenceLevel || 0;
    return (coherence1 + coherence2) / 2;
  }
  
  /**
   * 计算时间对齐度
   */
  _calculateTemporalAlignment(agent1, agent2) {
    const timeDiff = Math.abs(agent1.lastUpdate - agent2.lastUpdate);
    return Math.exp(-timeDiff / 10000); // 10秒内的活动认为对齐
  }
  
  /**
   * 计算目标一致性
   */
  _calculateGoalCongruence(agent1, agent2) {
    // 基于能量状态的相似性
    const energyDiff = Math.abs(agent1.energy - agent2.energy);
    return Math.exp(-energyDiff / 50); // 能量差异越小，目标越一致
  }
  
  /**
   * 计算通信效率
   */
  _calculateCommunicationEfficiency(agent1, agent2) {
    const distance = calculateDistance3D(agent1.position, agent2.position);
    return Math.exp(-distance * 0.001); // 距离越近，通信效率越高
  }
  
  /**
   * 计算信息密度
   */
  _calculateInformationDensity(agent1, agent2) {
    const avgEntropy = (agent1.memoryEntropy + agent2.memoryEntropy) / 2;
    return Math.min(avgEntropy, 1.0);
  }
  
  /**
   * 计算处理能力
   */
  _calculateProcessingCapacity(agent1, agent2) {
    const avgEnergy = (agent1.energy + agent2.energy) / 200; // 归一化到0-1
    return Math.min(avgEnergy, 1.0);
  }
  
  /**
   * 计算认知负载
   */
  _calculateCognitiveLoad(agent1, agent2) {
    const load1 = agent1.memoryEntropy;
    const load2 = agent2.memoryEntropy;
    return (load1 + load2) / 2;
  }
  
  /**
   * 计算知识互补性
   */
  _calculateKnowledgeComplementarity(agent1, agent2) {
    // 基于语义距离和新颖度差异计算互补性
    const semanticDistance = agent1.semanticVector.euclideanDistance(agent2.semanticVector);
    const noveltyDifference = Math.abs(agent1.noveltyScore - agent2.noveltyScore);
    
    // 语义距离适中且新颖度差异大的Agent互补性高
    const optimalDistance = 0.3; // 最佳语义距离
    const distanceScore = 1 - Math.abs(semanticDistance - optimalDistance) / optimalDistance;
    
    return Math.max(0, distanceScore * noveltyDifference);
  }
  
  /**
   * 计算上下文一致性
   */
  _calculateContextCoherence(agent1, agent2) {
    const coherence1 = agent1.coherenceLevel || 0;
    const coherence2 = agent2.coherenceLevel || 0;
    
    // 考虑时间同步性
    const timeDiff = Math.abs(agent1.lastUpdate - agent2.lastUpdate);
    const timeAlignment = Math.exp(-timeDiff / 5000); // 5秒内认为同步
    
    return ((coherence1 + coherence2) / 2) * timeAlignment;
  }
  
  /**
   * 计算方法一致性
   */
  _calculateMethodologicalConsistency(agent1, agent2) {
    // 基于能量状态和处理方式的一致性
    const energyConsistency = 1 - Math.abs(agent1.energy - agent2.energy) / 100;
    const entropyConsistency = 1 - Math.abs(agent1.memoryEntropy - agent2.memoryEntropy);
    
    return (energyConsistency + entropyConsistency) / 2;
  }
  
  /**
   * 计算处理复杂度
   */
  _calculateProcessingComplexity(agent1, agent2) {
    const complexity1 = agent1.memoryEntropy * agent1.influenceRadius;
    const complexity2 = agent2.memoryEntropy * agent2.influenceRadius;
    
    return (complexity1 + complexity2) / 2;
  }
  
  /**
   * 计算共振频率
   */
  _calculateResonanceFrequency(semanticTensor, coherenceTensor) {
    const semanticResonance = semanticTensor.similarity;
    const coherenceResonance = coherenceTensor.goalCongruence;
    
    // 共振频率与语义相似性和目标一致性正相关
    return (semanticResonance * coherenceResonance) ** 0.5;
  }
  
  /**
   * 计算谐波级别
   */
  _calculateHarmonicLevel(agent1, agent2) {
    // 基于历史协作成功率计算谐波级别
    const history1 = agent1.cooperationHistory || [];
    const history2 = agent2.cooperationHistory || [];
    
    // 查找共同协作历史
    const commonHistory = history1.filter(h1 => 
      history2.some(h2 => 
        h2.partnerId === agent1.id && h1.partnerId === agent2.id
      )
    );
    
    if (commonHistory.length === 0) return 0.5; // 默认谐波级别
    
    const successRate = commonHistory.filter(h => h.success).length / commonHistory.length;
    return Math.min(1.0, successRate + 0.1); // 小幅提升基础谐波
  }
  
  /**
   * 计算综合兼容性
   */
  _calculateOverallCompatibility(semantic, novelty, coherence, entropy) {
    const weights = this.tensorDimensions;
    
    return (
      semantic.similarity * weights.semantic +
      novelty.informationNovelty * weights.novelty +
      coherence.contextualCoherence * weights.coherence +
      (1 - entropy.memoryEntropy) * weights.entropy
    );
  }
  
  /**
   * 计算协作潜力
   */
  _calculateCollaborationPotential(semantic, novelty, coherence, entropy) {
    // 协作潜力 = 互补性 + 一致性 - 冲突性
    const complementarity = novelty.approachDiversity * 0.6 + (1 - semantic.similarity) * 0.4;
    const alignment = coherence.contextualCoherence * 0.7 + coherence.goalCongruence * 0.3;
    const conflict = entropy.cognitiveLoad * 0.5 + (semantic.distance > 0.8 ? 0.5 : 0);
    
    return Math.max(0, complementarity + alignment - conflict);
  }
  
  /**
   * 计算协同指数
   */
  _calculateSynergyIndex(semantic, novelty, coherence, entropy) {
    // 协同效应 = (互补性 * 一致性) / 复杂性
    const complementarity = novelty.informationNovelty;
    const alignment = coherence.contextualCoherence;
    const complexity = entropy.memoryEntropy + entropy.cognitiveLoad;
    
    return complexity > 0 ? (complementarity * alignment) / complexity : 0;
  }
  
  /**
   * 计算引力强度
   */
  _calculateAttractionStrength(tensorAnalysis) {
    const { semantic, novelty, coherence } = tensorAnalysis;
    
    // 引力因素：相似性、互补性、一致性
    const similarity = semantic.similarity * 0.4;
    const complementarity = novelty.innovationPotential * 0.3;
    const alignment = coherence.contextualCoherence * 0.3;
    
    return (similarity + complementarity + alignment) * this.fieldParameters.attractionStrength;
  }
  
  /**
   * 计算斥力强度
   */
  _calculateRepulsionStrength(tensorAnalysis) {
    const { entropy, coherence } = tensorAnalysis;
    
    // 斥力因素：认知负载、目标冲突
    const cognitiveOverload = entropy.cognitiveLoad > 0.8 ? 0.5 : 0;
    const goalConflict = coherence.goalCongruence < 0.3 ? 0.5 : 0;
    
    return (cognitiveOverload + goalConflict) * this.fieldParameters.repulsionStrength;
  }
    const distance = calculateDistance3D(agent1.position, agent2.position);
    if (distance === 0) return { x: 0, y: 0, z: 0 };
    
    // 计算张量分量
    const semanticComponent = this._calculateSemanticForce(agent1, agent2, distance);
    const noveltyComponent = this._calculateNoveltyForce(agent1, agent2, distance);
    const coherenceComponent = this._calculateCoherenceForce(agent1, agent2, distance);
    const entropyComponent = this._calculateEntropyForce(agent1, agent2, distance);
    
    // 合成总力
    const totalForce = {
      x: (
        semanticComponent.x * this.tensorDimensions.semantic +
        noveltyComponent.x * this.tensorDimensions.novelty +
        coherenceComponent.x * this.tensorDimensions.coherence +
        entropyComponent.x * this.tensorDimensions.entropy
      ),
      y: (
        semanticComponent.y * this.tensorDimensions.semantic +
        noveltyComponent.y * this.tensorDimensions.novelty +
        coherenceComponent.y * this.tensorDimensions.coherence +
        entropyComponent.y * this.tensorDimensions.entropy
      ),
      z: (
        semanticComponent.z * this.tensorDimensions.semantic +
        noveltyComponent.z * this.tensorDimensions.novelty +
        coherenceComponent.z * this.tensorDimensions.coherence +
        entropyComponent.z * this.tensorDimensions.entropy
      )
    };
    
    return totalForce;
  }
  
  /**
   * 计算语义力分量
   */
  _calculateSemanticForce(agent1, agent2, distance) {
    const similarity = agent1.semanticVector.cosineSimilarity(agent2.semanticVector);
    const direction = normalize3D({
      x: agent2.position.x - agent1.position.x,
      y: agent2.position.y - agent1.position.y,
      z: agent2.position.z - agent1.position.z
    });
    
    const forceMagnitude = similarity * this.fieldParameters.attractionStrength / (distance * distance + 1);
    return multiply3D(direction, forceMagnitude);
  }
  
  /**
   * 计算新颖度力分量
   */
  _calculateNoveltyForce(agent1, agent2, distance) {
    const noveltyDiff = Math.abs(agent1.noveltyScore - agent2.noveltyScore);
    const direction = normalize3D({
      x: agent2.position.x - agent1.position.x,
      y: agent2.position.y - agent1.position.y,
      z: agent2.position.z - agent1.position.z
    });
    
    const forceMagnitude = noveltyDiff * this.fieldParameters.attractionStrength * 0.5 / (distance + 1);
    return multiply3D(direction, forceMagnitude);
  }
  
  /**
   * 计算相干力分量
   */
  _calculateCoherenceForce(agent1, agent2, distance) {
    const coherenceProduct = agent1.coherenceLevel * agent2.coherenceLevel;
    const direction = normalize3D({
      x: agent2.position.x - agent1.position.x,
      y: agent2.position.y - agent1.position.y,
      z: agent2.position.z - agent1.position.z
    });
    
    const forceMagnitude = coherenceProduct * this.fieldParameters.attractionStrength / (distance + 1);
    return multiply3D(direction, forceMagnitude);
  }
  
  /**
   * 计算熵力分量
   */
  _calculateEntropyForce(agent1, agent2, distance) {
    const entropySum = agent1.memoryEntropy + agent2.memoryEntropy;
    const direction = normalize3D({
      x: agent2.position.x - agent1.position.x,
      y: agent2.position.y - agent1.position.y,
      z: agent2.position.z - agent1.position.z
    });
    
    const forceMagnitude = -entropySum * this.fieldParameters.repulsionStrength / (distance + 1);
    return multiply3D(direction, forceMagnitude);
  }
  
  /**
   * 更新力场网格
   */
  _updateFieldGrid() {
    const grid = this.fieldGrid;
    const resolution = grid.resolution;
    const bounds = grid.bounds;
    const stepSize = (bounds.max - bounds.min) / resolution;
    
    for (let x = 0; x < resolution; x++) {
      for (let y = 0; y < resolution; y++) {
        for (let z = 0; z < resolution; z++) {
          grid.forces[x][y][z] = { x: 0, y: 0, z: 0, magnitude: 0, type: 'neutral' };
        }
      }
    }
  }
  
  /**
   * 检测协作波动
   */
  _detectCooperationWaves() {
    const currentTime = Date.now();
    const waveThreshold = 0.5;
    
    this.cooperationWaves = this.cooperationWaves.filter(wave => 
      currentTime - wave.timestamp < wave.duration
    );
    
    for (const agent of this.agents.values()) {
      if (agent.forceHistory.length < 3) continue;
      
      const recentForces = agent.forceHistory.slice(-3);
      const magnitudes = recentForces.map(f => f.magnitude);
      
      const deltaForce = magnitudes[2] - magnitudes[0];
      if (Math.abs(deltaForce) > waveThreshold) {
        this.cooperationWaves.push({
          id: `wave_${Date.now()}_${agent.id}`,
          sourceAgentId: agent.id,
          epicenter: { ...agent.position },
          amplitude: Math.abs(deltaForce),
          frequency: 1.0,
          timestamp: currentTime,
          duration: 5000,
          propagationRadius: 0,
          maxRadius: agent.influenceRadius * 2
        });
      }
    }
  }
  
  /**
   * 识别共振区域
   */
  _identifyResonanceZones() {
    this.resonanceZones = [];
    // 简化实现，完整版本可以使用TCFResonanceDetector
  }
  
  /**
   * 检测协作奇点
   */
  _detectSingularityPoints() {
    this.singularityPoints = [];
    // 简化实现，完整版本需要复杂的网格分析
  }
  
  /**
   * 更新协作状态
   */
  _updateCollaborationState() {
    const agents = Array.from(this.agents.values());
    if (agents.length === 0) return;
    
    this.collaborationState.globalCoherence = this._calculateGlobalCoherence(agents);
    this.collaborationState.resonanceLevel = this._calculateResonanceLevel();
    this.collaborationState.convergenceStatus = this._determineConvergenceStatus();
    this.collaborationState.energyDistribution = this._calculateEnergyDistribution(agents);
    this.collaborationState.waveAmplitude = this._calculateWaveAmplitude();
  }
  
  _calculateGlobalCoherence(agents) {
    let totalCoherence = 0;
    for (const agent of agents) {
      totalCoherence += agent.coherenceLevel;
    }
    return totalCoherence / agents.length;
  }
  
  _calculateResonanceLevel() {
    return this.resonanceZones.reduce((sum, zone) => sum + zone.coherence, 0) / Math.max(this.resonanceZones.length, 1);
  }
  
  _determineConvergenceStatus() {
    const coherence = this.collaborationState.globalCoherence;
    if (coherence > this.fieldParameters.convergenceThreshold) return 'converging';
    if (coherence < this.fieldParameters.divergenceThreshold) return 'diverging';
    return 'stable';
  }
  
  _calculateEnergyDistribution(agents) {
    const distribution = { low: 0, medium: 0, high: 0 };
    for (const agent of agents) {
      if (agent.energy < 30) distribution.low++;
      else if (agent.energy < 70) distribution.medium++;
      else distribution.high++;
    }
    return distribution;
  }
  
  _calculateWaveAmplitude() {
    return this.cooperationWaves.reduce((max, wave) => Math.max(max, wave.amplitude), 0);
  }
  
  /**
   * 更新力场指标
   */
  _updateFieldMetrics() {
    const agents = Array.from(this.agents.values());
    
    this.fieldMetrics.totalEnergy = agents.reduce((sum, a) => sum + a.energy, 0);
    
    const totalForce = agents.reduce((sum, a) => {
      const mag = Math.sqrt(a.forceVector.x ** 2 + a.forceVector.y ** 2 + a.forceVector.z ** 2);
      return sum + mag;
    }, 0);
    this.fieldMetrics.averageForce = agents.length > 0 ? totalForce / agents.length : 0;
    
    this.fieldMetrics.coherenceStability = this.collaborationState.globalCoherence;
    this.fieldMetrics.cooperationEfficiency = this._calculateCooperationEfficiency();
    this.fieldMetrics.lastUpdate = Date.now();
  }
  
  _calculateCooperationEfficiency() {
    const coherence = this.collaborationState.globalCoherence;
    const resonance = this.collaborationState.resonanceLevel;
    const singularityPenalty = this.singularityPoints.length * 0.1;
    
    return Math.max(0, (coherence + resonance) / 2 - singularityPenalty);
  }
  
  /**
   * 获取状态摘要
   */
  getStatusSummary() {
    return {
      agents: this.agents.size,
      cooperationWaves: this.cooperationWaves.length,
      resonanceZones: this.resonanceZones.length,
      singularityPoints: this.singularityPoints.length,
      collaborationState: { ...this.collaborationState },
      fieldMetrics: { ...this.fieldMetrics }
    };
  }
  
  /**
   * 事件处理
   */
  _handleAgentAdded(event) {}
  _handleAgentRemoved(event) {}
  _handlePerturbationDetected(event) {}
  
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