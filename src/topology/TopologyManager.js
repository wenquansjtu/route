import { EventEmitter } from 'events';
import { Matrix } from 'ml-matrix';
import { calculateDistance3D, generateId, deepClone } from '../core/index.js';

/**
 * 拓扑扰动建模管理器
 * 构建和管理Agent网络的拓扑结构，实现动态重构
 */
export class TopologyManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // 基础配置
    this.maxNodes = config.maxNodes || 1000;
    this.updateInterval = config.updateInterval || 500; // ms
    this.stabilityThreshold = config.stabilityThreshold || 0.8;
    
    // 拓扑参数
    this.topologyParams = {
      connectionThreshold: config.connectionThreshold || 0.3,
      isolationThreshold: config.isolationThreshold || 0.1,
      clusterThreshold: config.clusterThreshold || 0.6,
      rebalanceThreshold: config.rebalanceThreshold || 0.5,
      maxConnectionsPerNode: config.maxConnectionsPerNode || 10,
      minClusterSize: config.minClusterSize || 3
    };
    
    // 数据存储
    this.nodes = new Map(); // nodeId -> node data
    this.edges = new Map(); // edgeId -> edge data
    this.clusters = new Map(); // clusterId -> cluster data
    this.subgraphs = new Map(); // subgraphId -> subgraph data
    
    // 拓扑结构
    this.adjacencyMatrix = null; // 邻接矩阵
    this.connectionGraph = null; // 连接图
    this.taskFlowGraph = null;   // 任务流图谱
    
    // 稳定性指标
    this.stabilityMetrics = {
      networkStability: 0,
      clusterStability: 0,
      connectionStability: 0,
      flowStability: 0,
      lastRestructure: Date.now()
    };
    
    // 动态重构状态
    this.restructureState = {
      isRestructuring: false,
      restructureReason: null,
      targetStructure: null,
      progress: 0
    };
    
    this._initializeTopology();
  }
  
  /**
   * 初始化拓扑管理器
   */
  _initializeTopology() {
    // 启动拓扑更新循环
    this.updateTimer = setInterval(() => {
      this._updateTopology();
    }, this.updateInterval);
    
    this.on('node-added', this._handleNodeAdded.bind(this));
    this.on('node-removed', this._handleNodeRemoved.bind(this));
    this.on('connection-formed', this._handleConnectionFormed.bind(this));
    this.on('connection-broken', this._handleConnectionBroken.bind(this));
  }
  
  /**
   * 添加节点（Agent）
   */
  addNode(agent, nodeData = {}) {
    if (this.nodes.size >= this.maxNodes) {
      throw new Error('Maximum nodes limit reached');
    }
    
    const node = {
      id: agent.id,
      type: agent.type || 'agent',
      position: { ...agent.position },
      properties: {
        mass: agent.mass || 1.0,
        energy: agent.energy || 100.0,
        capabilities: agent.capabilities || [],
        semanticVector: [...(agent.semanticEmbedding || [])],
        ...nodeData
      },
      
      // 拓扑属性
      connections: new Set(), // 连接的节点ID
      degree: 0, // 节点度数
      clustering: 0, // 聚类系数
      centrality: 0, // 中心性
      influence: 0, // 影响力
      
      // 稳定性属性
      stability: 1.0,
      lastConnectionChange: Date.now(),
      connectionHistory: [],
      
      // 状态
      status: 'active',
      lastUpdate: Date.now()
    };
    this.nodes.set(agent.id, node);
    this._updateNodeMetrics(agent.id);
    
    this.emit('node-added', { nodeId: agent.id, node });
    return true;
  }
  
  /**
   * 移除节点
   */
  removeNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    
    // 移除所有相关连接
    const connections = Array.from(node.connections);
    for (const connectedId of connections) {
      this.removeConnection(nodeId, connectedId);
    }
    
    // 从集群中移除
    this._removeNodeFromClusters(nodeId);
    
    this.nodes.delete(nodeId);
    this.emit('node-removed', { nodeId });
    
    // 检查是否需要重构
    this._checkRestructureNeed('node_removal');
    
    return true;
  }
  
  /**
   * 添加连接
   */
  addConnection(nodeId1, nodeId2, connectionData = {}) {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);
    
    if (!node1 || !node2 || nodeId1 === nodeId2) return false;
    
    // 检查连接是否已存在
    if (node1.connections.has(nodeId2)) return false;
    
    // 检查连接数限制
    if (node1.connections.size >= this.topologyParams.maxConnectionsPerNode ||
        node2.connections.size >= this.topologyParams.maxConnectionsPerNode) {
      return false;
    }
    
    const edgeId = `${nodeId1}-${nodeId2}`;
    const edge = {
      id: edgeId,
      source: nodeId1,
      target: nodeId2,
      weight: connectionData.weight || this._calculateConnectionWeight(node1, node2),
      type: connectionData.type || 'collaboration',
      
      // 连接属性
      strength: connectionData.strength || 0.5,
      reliability: connectionData.reliability || 1.0,
      bandwidth: connectionData.bandwidth || 1.0,
      latency: connectionData.latency || 0,
      
      // 历史数据
      createdAt: Date.now(),
      lastUsed: Date.now(),
      usageCount: 0,
      successRate: 1.0,
      
      // 状态
      status: 'active'
    };
    
    // 建立双向连接
    node1.connections.add(nodeId2);
    node2.connections.add(nodeId1);
    this.edges.set(edgeId, edge);
    
    // 更新节点度数
    node1.degree = node1.connections.size;
    node2.degree = node2.connections.size;
    
    // 记录连接历史
    node1.connectionHistory.push({ action: 'add', target: nodeId2, timestamp: Date.now() });
    node2.connectionHistory.push({ action: 'add', target: nodeId1, timestamp: Date.now() });
    
    this.emit('connection-formed', { edgeId, source: nodeId1, target: nodeId2, edge });
    
    // 更新相关指标
    this._updateNodeMetrics(nodeId1);
    this._updateNodeMetrics(nodeId2);
    this._updateClusterAffiliation(nodeId1, nodeId2);
    
    return true;
  }
  
  /**
   * 移除连接
   */
  removeConnection(nodeId1, nodeId2) {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);
    const edgeId = `${nodeId1}-${nodeId2}`;
    
    if (!node1 || !node2 || !this.edges.has(edgeId)) return false;
    
    // 移除连接
    node1.connections.delete(nodeId2);
    node2.connections.delete(nodeId1);
    this.edges.delete(edgeId);
    
    // 更新节点度数
    node1.degree = node1.connections.size;
    node2.degree = node2.connections.size;
    
    // 记录连接历史
    node1.connectionHistory.push({ action: 'remove', target: nodeId2, timestamp: Date.now() });
    node2.connectionHistory.push({ action: 'remove', target: nodeId1, timestamp: Date.now() });
    
    this.emit('connection-broken', { edgeId, source: nodeId1, target: nodeId2 });
    
    // 更新相关指标
    this._updateNodeMetrics(nodeId1);
    this._updateNodeMetrics(nodeId2);
    this._checkClusterIntegrity();
    
    return true;
  }
  
  /**
   * 计算连接权重
   */
  _calculateConnectionWeight(node1, node2) {
    // 基于距离、语义相似度等计算权重
    const distance = calculateDistance3D(node1.position, node2.position);
    const distanceFactor = 1 / (1 + distance * 0.001);
    
    // 语义相似度（如果有语义向量）
    let semanticFactor = 0.5;
    if (node1.properties.semanticVector && node2.properties.semanticVector) {
      semanticFactor = this._calculateSemanticSimilarity(
        node1.properties.semanticVector,
        node2.properties.semanticVector
      );
    }
    
    // 能力互补性
    const capabilityFactor = this._calculateCapabilityComplementarity(
      node1.properties.capabilities,
      node2.properties.capabilities
    );
    
    return (distanceFactor * 0.3 + semanticFactor * 0.4 + capabilityFactor * 0.3);
  }
  
  /**
   * 计算语义相似度
   */
  _calculateSemanticSimilarity(vector1, vector2) {
    if (vector1.length !== vector2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  /**
   * 计算能力互补性
   */
  _calculateCapabilityComplementarity(capabilities1, capabilities2) {
    const set1 = new Set(capabilities1);
    const set2 = new Set(capabilities2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    if (union.size === 0) return 0;
    
    // 互补性 = 1 - 重叠度，鼓励不同能力的Agent连接
    const overlap = intersection.size / union.size;
    return 1 - overlap;
  }
  
  /**
   * 更新节点指标
   */
  _updateNodeMetrics(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    // 更新聚类系数
    node.clustering = this._calculateClusteringCoefficient(nodeId);
    
    // 更新中心性
    node.centrality = this._calculateBetweennessCentrality(nodeId);
    
    // 更新影响力
    node.influence = this._calculateNodeInfluence(nodeId);
    
    // 更新稳定性
    node.stability = this._calculateNodeStability(nodeId);
    
    node.lastUpdate = Date.now();
  }
  
  /**
   * 计算聚类系数
   */
  _calculateClusteringCoefficient(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node || node.degree < 2) return 0;
    
    const neighbors = Array.from(node.connections);
    let triangles = 0;
    
    // 计算邻居之间的连接数
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const neighbor1 = this.nodes.get(neighbors[i]);
        if (neighbor1 && neighbor1.connections.has(neighbors[j])) {
          triangles++;
        }
      }
    }
    
    const possibleTriangles = (node.degree * (node.degree - 1)) / 2;
    return possibleTriangles > 0 ? triangles / possibleTriangles : 0;
  }
  
  /**
   * 计算介数中心性（简化版本）
   */
  _calculateBetweennessCentrality(nodeId) {
    // 简化实现，在实际应用中可以使用更复杂的算法
    const node = this.nodes.get(nodeId);
    if (!node) return 0;
    
    // 基于节点度数和连接质量的简单中心性计算
    const degreeNorm = node.degree / this.topologyParams.maxConnectionsPerNode;
    const qualityScore = this._calculateConnectionQuality(nodeId);
    
    return (degreeNorm + qualityScore) / 2;
  }
  
  /**
   * 计算连接质量
   */
  _calculateConnectionQuality(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node || node.connections.size === 0) return 0;
    
    let totalWeight = 0;
    for (const connectedId of node.connections) {
      const edgeId = `${nodeId}-${connectedId}`;
      const edge = this.edges.get(edgeId) || this.edges.get(`${connectedId}-${nodeId}`);
      if (edge) {
        totalWeight += edge.weight * edge.reliability;
      }
    }
    
    return totalWeight / node.connections.size;
  }
  
  /**
   * 计算节点影响力
   */
  _calculateNodeInfluence(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;
    
    // 基于中心性、能量和连接质量计算影响力
    const centralityFactor = node.centrality;
    const energyFactor = node.properties.energy / 100.0;
    const qualityFactor = this._calculateConnectionQuality(nodeId);
    
    return (centralityFactor * 0.4 + energyFactor * 0.3 + qualityFactor * 0.3);
  }
  
  /**
   * 计算节点稳定性
   */
  _calculateNodeStability(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;
    
    // 基于连接变化频率计算稳定性
    const recentChanges = node.connectionHistory.filter(h => 
      Date.now() - h.timestamp < 30000 // 最近30秒
    ).length;
    
    const changeRate = recentChanges / 30; // 每秒变化率
    return Math.max(0, 1 - changeRate);
  }
  
  /**
   * 更新拓扑结构
   */
  _updateTopology() {
    this._buildAdjacencyMatrix();
    this._analyzeConnectedComponents();
    this._updateClusters();
    this._buildTaskFlowGraph();
    this._calculateStabilityMetrics();
    this._checkRestructureNeed('periodic_check');
    
    this.emit('topology-updated', {
      stabilityMetrics: this.stabilityMetrics,
      restructureState: this.restructureState
    });
  }
  
  /**
   * 构建邻接矩阵
   */
  _buildAdjacencyMatrix() {
    const nodeIds = Array.from(this.nodes.keys());
    const size = nodeIds.length;
    
    this.adjacencyMatrix = new Matrix(size, size);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i === j) {
          this.adjacencyMatrix.set(i, j, 0);
          continue;
        }
        
        const node1Id = nodeIds[i];
        const node2Id = nodeIds[j];
        const edgeId = `${node1Id}-${node2Id}`;
        const edge = this.edges.get(edgeId) || this.edges.get(`${node2Id}-${node1Id}`);
        
        this.adjacencyMatrix.set(i, j, edge ? edge.weight : 0);
      }
    }
  }
  
  /**
   * 分析连通分量
   */
  _analyzeConnectedComponents() {
    const visited = new Set();
    const components = [];
    
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        const component = this._dfsComponent(nodeId, visited);
        if (component.length > 0) {
          components.push(component);
        }
      }
    }
    
    // 识别孤岛和主要连通分量
    this.connectedComponents = components.sort((a, b) => b.length - a.length);
    this._identifyIsolatedNodes();
  }
  
  /**
   * 深度优先搜索连通分量
   */
  _dfsComponent(startNodeId, visited) {
    const component = [];
    const stack = [startNodeId];
    
    while (stack.length > 0) {
      const nodeId = stack.pop();
      if (visited.has(nodeId)) continue;
      
      visited.add(nodeId);
      component.push(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (node) {
        for (const connectedId of node.connections) {
          if (!visited.has(connectedId)) {
            stack.push(connectedId);
          }
        }
      }
    }
    
    return component;
  }
  
  /**
   * 识别孤立节点
   */
  _identifyIsolatedNodes() {
    this.isolatedNodes = [];
    
    for (const [nodeId, node] of this.nodes) {
      if (node.connections.size === 0) {
        this.isolatedNodes.push(nodeId);
      }
    }
  }
  
  /**
   * 更新集群
   */
  _updateClusters() {
    this._detectClusters();
    this._validateClusterIntegrity();
    this._calculateClusterMetrics();
  }
  
  /**
   * 检测集群
   */
  _detectClusters() {
    const visited = new Set();
    const clusters = new Map();
    
    for (const [nodeId, node] of this.nodes) {
      if (visited.has(nodeId)) continue;
      
      const cluster = this._expandCluster(nodeId, visited);
      if (cluster.length >= this.topologyParams.minClusterSize) {
        const clusterId = generateId();
        clusters.set(clusterId, {
          id: clusterId,
          members: new Set(cluster),
          center: this._calculateClusterCenter(cluster),
          cohesion: 0.5,
          density: 0.5,
          createdAt: Date.now(),
          lastUpdate: Date.now()
        });
      }
    }
    
    this.clusters = clusters;
  }
  
  _expandCluster(startNodeId, visited) {
    const cluster = [];
    const queue = [startNodeId];
    const threshold = this.topologyParams.clusterThreshold;
    
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (visited.has(nodeId)) continue;
      
      visited.add(nodeId);
      cluster.push(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (!node) continue;
      
      for (const neighborId of node.connections) {
        if (!visited.has(neighborId)) {
          const edge = this._getEdge(nodeId, neighborId);
          if (edge && edge.weight > threshold) {
            queue.push(neighborId);
          }
        }
      }
    }
    
    return cluster;
  }
  
  _getEdge(nodeId1, nodeId2) {
    return this.edges.get(`${nodeId1}-${nodeId2}`) || this.edges.get(`${nodeId2}-${nodeId1}`);
  }
  
  _calculateClusterCenter(cluster) {
    const center = { x: 0, y: 0, z: 0 };
    let count = 0;
    
    for (const nodeId of cluster) {
      const node = this.nodes.get(nodeId);
      if (node) {
        center.x += node.position.x;
        center.y += node.position.y;
        center.z += node.position.z;
        count++;
      }
    }
    
    if (count > 0) {
      center.x /= count;
      center.y /= count;
      center.z /= count;
    }
    
    return center;
  }
  
  _validateClusterIntegrity() {
    for (const [clusterId, cluster] of this.clusters) {
      const validMembers = new Set();
      for (const nodeId of cluster.members) {
        if (this.nodes.has(nodeId)) {
          validMembers.add(nodeId);
        }
      }
      
      cluster.members = validMembers;
      
      if (cluster.members.size < this.topologyParams.minClusterSize) {
        this.clusters.delete(clusterId);
      }
    }
  }
  
  _calculateClusterMetrics() {
    for (const cluster of this.clusters.values()) {
      cluster.lastUpdate = Date.now();
    }
  }
  
  /**
   * 构建任务流图谱
   */
  _buildTaskFlowGraph() {
    this.taskFlowGraph = {
      nodes: new Map(),
      flows: new Map(),
      bottlenecks: [],
      criticalPaths: []
    };
    
    for (const [nodeId, node] of this.nodes) {
      this.taskFlowGraph.nodes.set(nodeId, {
        id: nodeId,
        capacity: node.properties.energy,
        throughput: node.degree * 10,
        capabilities: node.properties.capabilities
      });
    }
  }
  
  /**
   * 计算稳定性指标
   */
  _calculateStabilityMetrics() {
    const nodes = Array.from(this.nodes.values());
    
    this.stabilityMetrics.networkStability = nodes.length > 0 ? 
      nodes.reduce((sum, node) => sum + node.stability, 0) / nodes.length : 0;
    
    this.stabilityMetrics.clusterStability = this.clusters.size > 0 ? 0.8 : 0;
    
    const edges = Array.from(this.edges.values());
    this.stabilityMetrics.connectionStability = edges.length > 0 ?
      edges.reduce((sum, edge) => sum + edge.reliability, 0) / edges.length : 0;
    
    this.stabilityMetrics.flowStability = 0.7;
  }
  
  /**
   * 检查是否需要重构
   */
  _checkRestructureNeed(trigger) {
    if (this.restructureState.isRestructuring) return;
    
    const reasons = [];
    
    if (this.isolatedNodes && this.isolatedNodes.length > 0) {
      reasons.push('isolation_detected');
    }
    
    if (this.stabilityMetrics.networkStability < this.stabilityThreshold) {
      reasons.push('network_instability');
    }
    
    if (this.connectedComponents && this.connectedComponents.length > 1) {
      reasons.push('connectivity_low');
    }
    
    if (reasons.length > 0) {
      this.emit('restructure-needed', { reasons, trigger });
    }
  }
  
  _updateClusterAffiliation(nodeId1, nodeId2) {}
  _checkClusterIntegrity() { this._validateClusterIntegrity(); }
  _removeNodeFromClusters(nodeId) {
    for (const cluster of this.clusters.values()) {
      cluster.members.delete(nodeId);
    }
    this._validateClusterIntegrity();
  }
  
  /**
   * 获取拓扑状态摘要
   */
  getStatusSummary() {
    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
      clusters: this.clusters.size,
      connectedComponents: this.connectedComponents ? this.connectedComponents.length : 0,
      isolatedNodes: this.isolatedNodes ? this.isolatedNodes.length : 0,
      stabilityMetrics: { ...this.stabilityMetrics },
      restructureState: { ...this.restructureState }
    };
  }
  
  _handleNodeAdded(event) {}
  _handleNodeRemoved(event) {}
  _handleConnectionFormed(event) {}
  _handleConnectionBroken(event) {}
  
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