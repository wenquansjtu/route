import { TopologyManager } from './TopologyManager.js';
import { generateId } from '../core/index.js';

/**
 * 拓扑重构器 - 负责动态重构网络拓扑
 */
export class TopologyRestructurer {
  constructor(topologyManager) {
    this.topology = topologyManager;
    this.restructureStrategies = {
      'isolation_detected': this._handleIsolationRestructure.bind(this),
      'cluster_imbalance': this._handleClusterRebalance.bind(this),
      'connectivity_low': this._handleConnectivityImprovement.bind(this),
      'performance_degradation': this._handlePerformanceOptimization.bind(this)
    };
  }
  
  /**
   * 执行拓扑重构
   */
  async executeRestructure(reason, targetStructure = null) {
    if (this.topology.restructureState.isRestructuring) {
      return false; // 已在重构中
    }
    
    this.topology.restructureState = {
      isRestructuring: true,
      restructureReason: reason,
      targetStructure: targetStructure,
      progress: 0
    };
    
    try {
      const strategy = this.restructureStrategies[reason];
      if (strategy) {
        await strategy(targetStructure);
      } else {
        await this._defaultRestructure();
      }
      
      this.topology.stabilityMetrics.lastRestructure = Date.now();
      this.topology.emit('restructure-completed', { reason, success: true });
      
    } catch (error) {
      this.topology.emit('restructure-failed', { reason, error: error.message });
    } finally {
      this.topology.restructureState.isRestructuring = false;
      this.topology.restructureState.progress = 100;
    }
    
    return true;
  }
  
  /**
   * 处理孤立节点重构
   */
  async _handleIsolationRestructure() {
    const isolatedNodes = this.topology.isolatedNodes;
    
    for (const nodeId of isolatedNodes) {
      const node = this.topology.nodes.get(nodeId);
      if (!node) continue;
      
      // 为孤立节点寻找最佳连接目标
      const candidates = this._findConnectionCandidates(nodeId);
      
      // 建立最多3个连接
      let connectionsAdded = 0;
      for (const candidate of candidates.slice(0, 3)) {
        if (this.topology.addConnection(nodeId, candidate.nodeId, {
          weight: candidate.score,
          type: 'restructure'
        })) {
          connectionsAdded++;
        }
      }
      
      this.topology.emit('isolation-resolved', { 
        nodeId, 
        connectionsAdded,
        candidates: candidates.length 
      });
    }
    
    this.topology.restructureState.progress = 50;
  }
  
  /**
   * 寻找连接候选者
   */
  _findConnectionCandidates(nodeId) {
    const node = this.topology.nodes.get(nodeId);
    if (!node) return [];
    
    const candidates = [];
    
    for (const [otherId, otherNode] of this.topology.nodes) {
      if (otherId === nodeId || node.connections.has(otherId)) continue;
      
      // 检查连接数限制
      if (otherNode.connections.size >= this.topology.topologyParams.maxConnectionsPerNode) {
        continue;
      }
      
      const score = this._calculateConnectionScore(node, otherNode);
      candidates.push({ nodeId: otherId, score });
    }
    
    return candidates.sort((a, b) => b.score - a.score);
  }
  
  /**
   * 计算连接分数
   */
  _calculateConnectionScore(node1, node2) {
    // 距离因子
    const distance = this._calculateDistance(node1.position, node2.position);
    const distanceFactor = 1 / (1 + distance * 0.001);
    
    // 能力互补因子
    const capabilityFactor = this._calculateCapabilityComplementarity(
      node1.properties.capabilities,
      node2.properties.capabilities
    );
    
    // 负载平衡因子
    const loadFactor = 1 / (1 + Math.abs(node1.degree - node2.degree));
    
    // 能量因子
    const energyFactor = (node1.properties.energy + node2.properties.energy) / 200;
    
    return distanceFactor * 0.3 + capabilityFactor * 0.3 + loadFactor * 0.2 + energyFactor * 0.2;
  }
  
  /**
   * 处理集群重平衡
   */
  async _handleClusterRebalance() {
    const clusters = Array.from(this.topology.clusters.values());
    
    // 识别过大和过小的集群
    const avgClusterSize = clusters.reduce((sum, c) => sum + c.members.length, 0) / clusters.length;
    const oversizedClusters = clusters.filter(c => c.members.length > avgClusterSize * 1.5);
    const undersizedClusters = clusters.filter(c => c.members.length < avgClusterSize * 0.5);
    
    // 从过大集群迁移节点到过小集群
    for (const oversized of oversizedClusters) {
      const nodesToMigrate = this._selectNodesForMigration(oversized);
      
      for (const nodeId of nodesToMigrate) {
        const bestTarget = this._findBestClusterForNode(nodeId, undersizedClusters);
        if (bestTarget) {
          await this._migrateNodeToCluster(nodeId, oversized.id, bestTarget.id);
        }
      }
    }
    
    this.topology.restructureState.progress = 75;
  }
  
  /**
   * 选择迁移节点
   */
  _selectNodesForMigration(cluster) {
    const members = cluster.members.map(id => this.topology.nodes.get(id)).filter(Boolean);
    
    // 选择边缘节点（连接度较低的节点）
    return members
      .sort((a, b) => a.degree - b.degree)
      .slice(0, Math.floor(cluster.members.length * 0.2)) // 迁移20%的节点
      .map(node => node.id);
  }
  
  /**
   * 为节点寻找最佳集群
   */
  _findBestClusterForNode(nodeId, targetClusters) {
    const node = this.topology.nodes.get(nodeId);
    if (!node) return null;
    
    let bestCluster = null;
    let bestScore = -1;
    
    for (const cluster of targetClusters) {
      const score = this._calculateClusterAffinityScore(nodeId, cluster);
      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }
    
    return bestCluster;
  }
  
  /**
   * 计算集群亲和度分数
   */
  _calculateClusterAffinityScore(nodeId, cluster) {
    const node = this.topology.nodes.get(nodeId);
    if (!node) return 0;
    
    let totalScore = 0;
    let count = 0;
    
    for (const memberId of cluster.members) {
      const member = this.topology.nodes.get(memberId);
      if (member) {
        totalScore += this._calculateConnectionScore(node, member);
        count++;
      }
    }
    
    return count > 0 ? totalScore / count : 0;
  }
  
  /**
   * 迁移节点到集群
   */
  async _migrateNodeToCluster(nodeId, fromClusterId, toClusterId) {
    const fromCluster = this.topology.clusters.get(fromClusterId);
    const toCluster = this.topology.clusters.get(toClusterId);
    
    if (!fromCluster || !toCluster) return false;
    
    // 从原集群移除
    fromCluster.members.delete(nodeId);
    
    // 添加到新集群
    toCluster.members.add(nodeId);
    
    // 建立新的集群内连接
    const connectionsToAdd = Math.min(3, toCluster.members.size - 1);
    const targets = Array.from(toCluster.members)
      .filter(id => id !== nodeId)
      .slice(0, connectionsToAdd);
    
    for (const targetId of targets) {
      this.topology.addConnection(nodeId, targetId, {
        type: 'cluster_migration',
        weight: 0.7
      });
    }
    
    this.topology.emit('node-migrated', { 
      nodeId, 
      fromCluster: fromClusterId, 
      toCluster: toClusterId 
    });
    
    return true;
  }
  
  /**
   * 处理连通性改善
   */
  async _handleConnectivityImprovement() {
    const components = this.topology.connectedComponents;
    
    if (components.length > 1) {
      // 连接不同的连通分量
      for (let i = 1; i < components.length; i++) {
        await this._bridgeComponents(components[0], components[i]);
      }
    }
    
    // 增加关键节点的连接
    await this._reinforceKeyNodes();
    
    this.topology.restructureState.progress = 90;
  }
  
  /**
   * 桥接连通分量
   */
  async _bridgeComponents(component1, component2) {
    let bestPair = null;
    let bestScore = -1;
    
    // 寻找最佳桥接节点对
    for (const nodeId1 of component1) {
      for (const nodeId2 of component2) {
        const node1 = this.topology.nodes.get(nodeId1);
        const node2 = this.topology.nodes.get(nodeId2);
        
        if (node1 && node2) {
          const score = this._calculateConnectionScore(node1, node2);
          if (score > bestScore) {
            bestScore = score;
            bestPair = { nodeId1, nodeId2 };
          }
        }
      }
    }
    
    if (bestPair) {
      this.topology.addConnection(bestPair.nodeId1, bestPair.nodeId2, {
        type: 'bridge',
        weight: bestScore
      });
    }
  }
  
  /**
   * 加强关键节点
   */
  async _reinforceKeyNodes() {
    const nodes = Array.from(this.topology.nodes.values());
    const keyNodes = nodes
      .filter(node => node.centrality > 0.7 || node.influence > 0.8)
      .sort((a, b) => (b.centrality + b.influence) - (a.centrality + a.influence))
      .slice(0, 5); // 前5个关键节点
    
    for (const keyNode of keyNodes) {
      if (keyNode.connections.size < this.topology.topologyParams.maxConnectionsPerNode) {
        const candidates = this._findConnectionCandidates(keyNode.id);
        const connectionsToAdd = Math.min(
          2, 
          this.topology.topologyParams.maxConnectionsPerNode - keyNode.connections.size
        );
        
        for (let i = 0; i < connectionsToAdd && i < candidates.length; i++) {
          this.topology.addConnection(keyNode.id, candidates[i].nodeId, {
            type: 'reinforcement',
            weight: candidates[i].score
          });
        }
      }
    }
  }
  
  /**
   * 默认重构策略
   */
  async _defaultRestructure() {
    // 简单的默认重构：优化现有连接
    const edges = Array.from(this.topology.edges.values());
    
    // 移除低质量连接
    const lowQualityEdges = edges.filter(edge => 
      edge.weight < this.topology.topologyParams.connectionThreshold
    );
    
    for (const edge of lowQualityEdges.slice(0, 5)) { // 最多移除5个
      this.topology.removeConnection(edge.source, edge.target);
    }
    
    // 为孤立节点建立连接
    await this._handleIsolationRestructure();
  }
  
  /**
   * 工具方法
   */
  _calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  _calculateCapabilityComplementarity(capabilities1, capabilities2) {
    const set1 = new Set(capabilities1);
    const set2 = new Set(capabilities2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    if (union.size === 0) return 0;
    
    const overlap = intersection.size / union.size;
    return 1 - overlap;
  }
}

/**
 * 集群管理器
 */
export class ClusterManager {
  constructor(topologyManager) {
    this.topology = topologyManager;
  }
  
  /**
   * 更新集群
   */
  updateClusters() {
    this._detectClusters();
    this._validateClusterIntegrity();
    this._calculateClusterMetrics();
  }
  
  /**
   * 检测集群（基于连通性和语义相似性）
   */
  _detectClusters() {
    const visited = new Set();
    const clusters = new Map();
    
    for (const [nodeId, node] of this.topology.nodes) {
      if (visited.has(nodeId)) continue;
      
      const cluster = this._expandCluster(nodeId, visited);
      if (cluster.length >= this.topology.topologyParams.minClusterSize) {
        const clusterId = generateId();
        clusters.set(clusterId, {
          id: clusterId,
          members: new Set(cluster),
          center: this._calculateClusterCenter(cluster),
          cohesion: this._calculateClusterCohesion(cluster),
          density: this._calculateClusterDensity(cluster),
          createdAt: Date.now(),
          lastUpdate: Date.now()
        });
      }
    }
    
    this.topology.clusters = clusters;
  }
  
  /**
   * 扩展集群
   */
  _expandCluster(startNodeId, visited) {
    const cluster = [];
    const queue = [startNodeId];
    const threshold = this.topology.topologyParams.clusterThreshold;
    
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (visited.has(nodeId)) continue;
      
      visited.add(nodeId);
      cluster.push(nodeId);
      
      const node = this.topology.nodes.get(nodeId);
      if (!node) continue;
      
      // 添加高质量连接的邻居
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
  
  /**
   * 获取边
   */
  _getEdge(nodeId1, nodeId2) {
    return this.topology.edges.get(`${nodeId1}-${nodeId2}`) || 
           this.topology.edges.get(`${nodeId2}-${nodeId1}`);
  }
  
  /**
   * 计算集群中心
   */
  _calculateClusterCenter(cluster) {
    const center = { x: 0, y: 0, z: 0 };
    let count = 0;
    
    for (const nodeId of cluster) {
      const node = this.topology.nodes.get(nodeId);
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
  
  /**
   * 计算集群内聚性
   */
  _calculateClusterCohesion(cluster) {
    if (cluster.length < 2) return 1.0;
    
    let totalWeight = 0;
    let connectionCount = 0;
    
    for (let i = 0; i < cluster.length; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        const edge = this._getEdge(cluster[i], cluster[j]);
        if (edge) {
          totalWeight += edge.weight;
          connectionCount++;
        }
      }
    }
    
    const maxConnections = (cluster.length * (cluster.length - 1)) / 2;
    const density = connectionCount / maxConnections;
    const avgWeight = connectionCount > 0 ? totalWeight / connectionCount : 0;
    
    return (density + avgWeight) / 2;
  }
  
  /**
   * 计算集群密度
   */
  _calculateClusterDensity(cluster) {
    if (cluster.length < 2) return 0;
    
    let connectionCount = 0;
    for (let i = 0; i < cluster.length; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        if (this._getEdge(cluster[i], cluster[j])) {
          connectionCount++;
        }
      }
    }
    
    const maxConnections = (cluster.length * (cluster.length - 1)) / 2;
    return connectionCount / maxConnections;
  }
  
  /**
   * 验证集群完整性
   */
  _validateClusterIntegrity() {
    for (const [clusterId, cluster] of this.topology.clusters) {
      // 移除不存在的节点
      const validMembers = new Set();
      for (const nodeId of cluster.members) {
        if (this.topology.nodes.has(nodeId)) {
          validMembers.add(nodeId);
        }
      }
      
      cluster.members = validMembers;
      
      // 如果集群太小，删除它
      if (cluster.members.size < this.topology.topologyParams.minClusterSize) {
        this.topology.clusters.delete(clusterId);
      }
    }
  }
  
  /**
   * 计算集群指标
   */
  _calculateClusterMetrics() {
    for (const cluster of this.topology.clusters.values()) {
      cluster.center = this._calculateClusterCenter(Array.from(cluster.members));
      cluster.cohesion = this._calculateClusterCohesion(Array.from(cluster.members));
      cluster.density = this._calculateClusterDensity(Array.from(cluster.members));
      cluster.lastUpdate = Date.now();
    }
  }
}