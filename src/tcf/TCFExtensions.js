import { TensorCooperationField } from './TensorCooperationField.js';

/**
 * TCF力场计算扩展
 * 包含复杂的力场分量计算和状态更新方法
 */
export class TCFFieldCalculator {
  /**
   * 计算语义力分量
   */
  static calculateSemanticForce(agent1, agent2, distance, attractionStrength) {
    const similarity = agent1.semanticVector.cosineSimilarity(agent2.semanticVector);
    const direction = this.normalizeDirection({
      x: agent2.position.x - agent1.position.x,
      y: agent2.position.y - agent1.position.y,
      z: agent2.position.z - agent1.position.z
    });
    
    // 相似度高的Agent相互吸引
    const forceMagnitude = similarity * attractionStrength / (distance * distance + 1);
    
    return this.multiplyVector(direction, forceMagnitude);
  }
  
  /**
   * 计算新颖度力分量
   */
  static calculateNoveltyForce(agent1, agent2, distance, attractionStrength) {
    const noveltyDiff = Math.abs(agent1.noveltyScore - agent2.noveltyScore);
    const direction = this.normalizeDirection({
      x: agent2.position.x - agent1.position.x,
      y: agent2.position.y - agent1.position.y,
      z: agent2.position.z - agent1.position.z
    });
    
    // 新颖度差异大的Agent相互吸引（互补效应）
    const forceMagnitude = noveltyDiff * attractionStrength * 0.5 / (distance + 1);
    
    return this.multiplyVector(direction, forceMagnitude);
  }
  
  /**
   * 计算相干力分量
   */
  static calculateCoherenceForce(agent1, agent2, distance, attractionStrength) {
    const coherenceProduct = agent1.coherenceLevel * agent2.coherenceLevel;
    const direction = this.normalizeDirection({
      x: agent2.position.x - agent1.position.x,
      y: agent2.position.y - agent1.position.y,
      z: agent2.position.z - agent1.position.z
    });
    
    // 相干度高的Agent之间产生强吸引力
    const forceMagnitude = coherenceProduct * attractionStrength / (distance + 1);
    
    return this.multiplyVector(direction, forceMagnitude);
  }
  
  /**
   * 计算熵力分量
   */
  static calculateEntropyForce(agent1, agent2, distance, repulsionStrength) {
    const entropySum = agent1.memoryEntropy + agent2.memoryEntropy;
    const direction = this.normalizeDirection({
      x: agent2.position.x - agent1.position.x,
      y: agent2.position.y - agent1.position.y,
      z: agent2.position.z - agent1.position.z
    });
    
    // 高熵Agent倾向于分散，产生排斥力
    const forceMagnitude = -entropySum * repulsionStrength / (distance + 1);
    
    return this.multiplyVector(direction, forceMagnitude);
  }
  
  /**
   * 归一化方向向量
   */
  static normalizeDirection(vector) {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    if (magnitude === 0) return { x: 0, y: 0, z: 0 };
    
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude,
      z: vector.z / magnitude
    };
  }
  
  /**
   * 向量标量乘法
   */
  static multiplyVector(vector, scalar) {
    return {
      x: vector.x * scalar,
      y: vector.y * scalar,
      z: vector.z * scalar
    };
  }
}

/**
 * TCF波动检测器
 * 检测和分析协作波动
 */
export class TCFWaveDetector {
  constructor(tcf) {
    this.tcf = tcf;
    this.waveThreshold = 0.5;
  }
  
  /**
   * 检测协作波动
   */
  detectCooperationWaves() {
    const currentTime = Date.now();
    
    // 清理过期波动
    this.tcf.cooperationWaves = this.tcf.cooperationWaves.filter(wave => 
      currentTime - wave.timestamp < wave.duration
    );
    
    // 检测新的波动
    for (const agent of this.tcf.agents.values()) {
      if (agent.forceHistory.length < 3) continue;
      
      const recentForces = agent.forceHistory.slice(-3);
      const magnitudes = recentForces.map(f => f.magnitude);
      
      // 检测力的突然变化
      const deltaForce = magnitudes[2] - magnitudes[0];
      if (Math.abs(deltaForce) > this.waveThreshold) {
        this.tcf.cooperationWaves.push({
          id: `wave_${Date.now()}_${agent.id}`,
          sourceAgentId: agent.id,
          epicenter: { ...agent.position },
          amplitude: Math.abs(deltaForce),
          frequency: this.estimateWaveFrequency(magnitudes),
          timestamp: currentTime,
          duration: 5000,
          propagationRadius: 0,
          maxRadius: agent.influenceRadius * 2
        });
      }
    }
    
    // 更新波动传播
    for (const wave of this.tcf.cooperationWaves) {
      const elapsed = (currentTime - wave.timestamp) / 1000;
      wave.propagationRadius = Math.min(
        elapsed * this.tcf.fieldParameters.attractionStrength * 100,
        wave.maxRadius
      );
    }
  }
  
  /**
   * 估算波动频率
   */
  estimateWaveFrequency(magnitudes) {
    if (magnitudes.length < 3) return 1.0;
    
    let crossings = 0;
    const mean = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
    
    for (let i = 1; i < magnitudes.length; i++) {
      if ((magnitudes[i - 1] - mean) * (magnitudes[i] - mean) < 0) {
        crossings++;
      }
    }
    
    return crossings / 2;
  }
}

/**
 * TCF共振检测器
 * 识别共振区域
 */
export class TCFResonanceDetector {
  constructor(tcf) {
    this.tcf = tcf;
  }
  
  /**
   * 识别共振区域
   */
  identifyResonanceZones() {
    this.tcf.resonanceZones = [];
    const agents = Array.from(this.tcf.agents.values());
    
    // 寻找力向量方向相似且幅度接近的Agent群
    for (let i = 0; i < agents.length; i++) {
      const group = [agents[i]];
      
      for (let j = i + 1; j < agents.length; j++) {
        const similarity = this.calculateForceVectorSimilarity(agents[i], agents[j]);
        const distance = this.calculateDistance3D(agents[i].position, agents[j].position);
        
        if (similarity > this.tcf.fieldParameters.resonanceThreshold && distance < 200) {
          group.push(agents[j]);
        }
      }
      
      if (group.length >= 2) {
        const centerPos = this.calculateGroupCenter(group);
        const avgForce = this.calculateAverageForce(group);
        
        this.tcf.resonanceZones.push({
          id: `resonance_${Date.now()}_${i}`,
          agents: group.map(a => a.id),
          center: centerPos,
          averageForce: avgForce,
          coherence: this.calculateGroupCoherence(group),
          strength: avgForce.magnitude,
          radius: this.calculateGroupRadius(group, centerPos)
        });
      }
    }
  }
  
  /**
   * 计算力向量相似度
   */
  calculateForceVectorSimilarity(agent1, agent2) {
    const force1 = agent1.forceVector;
    const force2 = agent2.forceVector;
    
    const dot = force1.x * force2.x + force1.y * force2.y + force1.z * force2.z;
    const mag1 = Math.sqrt(force1.x ** 2 + force1.y ** 2 + force1.z ** 2);
    const mag2 = Math.sqrt(force2.x ** 2 + force2.y ** 2 + force2.z ** 2);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    return dot / (mag1 * mag2);
  }
  
  /**
   * 计算群组中心
   */
  calculateGroupCenter(group) {
    const center = { x: 0, y: 0, z: 0 };
    
    for (const agent of group) {
      center.x += agent.position.x;
      center.y += agent.position.y;
      center.z += agent.position.z;
    }
    
    center.x /= group.length;
    center.y /= group.length;
    center.z /= group.length;
    
    return center;
  }
  
  /**
   * 计算平均力向量
   */
  calculateAverageForce(group) {
    const avgForce = { x: 0, y: 0, z: 0 };
    
    for (const agent of group) {
      avgForce.x += agent.forceVector.x;
      avgForce.y += agent.forceVector.y;
      avgForce.z += agent.forceVector.z;
    }
    
    avgForce.x /= group.length;
    avgForce.y /= group.length;
    avgForce.z /= group.length;
    
    const magnitude = Math.sqrt(avgForce.x ** 2 + avgForce.y ** 2 + avgForce.z ** 2);
    
    return { ...avgForce, magnitude };
  }
  
  /**
   * 计算群组相干性
   */
  calculateGroupCoherence(group) {
    if (group.length < 2) return 1.0;
    
    let totalCoherence = 0;
    let count = 0;
    
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const similarity = this.calculateForceVectorSimilarity(group[i], group[j]);
        totalCoherence += similarity;
        count++;
      }
    }
    
    return count > 0 ? totalCoherence / count : 0;
  }
  
  /**
   * 计算群组半径
   */
  calculateGroupRadius(group, center) {
    let maxDistance = 0;
    
    for (const agent of group) {
      const distance = this.calculateDistance3D(agent.position, center);
      maxDistance = Math.max(maxDistance, distance);
    }
    
    return maxDistance;
  }
  
  /**
   * 计算3D距离
   */
  calculateDistance3D(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}