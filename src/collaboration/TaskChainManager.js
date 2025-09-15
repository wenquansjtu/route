import { EventEmitter } from 'events';
import { Task } from '../core/Models.js';
import { generateId } from '../core/index.js';

/**
 * 复杂任务链条下的协作收敛系统
 * 实现"热场溯源图"和路径重映射机制
 * 基于宇宙结构理论的CMB扰动建模
 */
export class TaskChainManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxChainLength: config.maxChainLength || 10,
      maxRetryAttempts: config.maxRetryAttempts || 3,
      pathStabilityThreshold: config.pathStabilityThreshold || 0.7,
      heatDecayRate: config.heatDecayRate || 0.1,
      perturbationSensitivity: config.perturbationSensitivity || 0.3,
      cosmicStructureModeling: config.cosmicStructureModeling !== false,
      ...config
    };
    
    // 任务链存储
    this.taskChains = new Map(); // chainId -> TaskChain
    this.activeChains = new Set(); // 活跃的链ID
    this.failedChains = new Map(); // 失败的链及其原因
    
    // 热场追踪 - CMB风格的扰动建模
    this.heatFieldMap = new Map(); // 节点热力图
    this.pathHistory = new Map(); // 路径历史记录
    this.stabilityMetrics = new Map(); // 路径稳定性指标
    this.perturbationField = new Map(); // 扰动场映射
    
    // 扰动路径预测 - 基于宇宙结构理论
    this.perturbationPredictor = new CosmicPerturbationPredictor(this.config);
    this.pathRemapper = new CosmicPathRemapper(this.config);
    this.heatFieldVisualizer = new HeatFieldBacktrackingMap(this.config);
    
    this._initializeManager();
  }

/**
 * 宇宙结构扰动预测器 - 基于CMB张量扰动理论
 */
class CosmicPerturbationPredictor {
  constructor(config = {}) {
    this.config = config;
    this.cosmicConstants = {
      hubbleConstant: 0.07,
      perturbationAmplitude: 0.1,
      structureFormationThreshold: 0.3,
      anisotropyFactor: 0.00001
    };
  }
  
  async predictPath(taskChain, availableAgents) {
    const cosmicStructure = this._buildCosmicStructureModel(taskChain, availableAgents);
    const perturbationField = this._calculateCMBPerturbationField(cosmicStructure);
    const anisotropyAnalysis = this._analyzeAnisotropicDistribution(cosmicStructure);
    const formationPath = this._predictStructureFormation(cosmicStructure, perturbationField);
    const pathStability = this._calculatePathStability(formationPath, anisotropyAnalysis);
    
    return {
      stability: pathStability,
      cosmicStructure,
      perturbationField,
      anisotropyAnalysis,
      formationPath,
      confidence: this._calculatePredictionConfidence(pathStability, anisotropyAnalysis),
      riskFactors: this._identifyCosmicRiskFactors(cosmicStructure)
    };
  }
  
  _buildCosmicStructureModel(taskChain, availableAgents) {
    const nodes = availableAgents.map(agent => ({
      id: agent.id,
      position: agent.position,
      mass: agent.energy / 100,
      capabilities: agent.capabilities,
      perturbationSource: this._calculateAgentPerturbationStrength(agent)
    }));
    
    return {
      nodes,
      connections: this._calculateCosmicConnections(nodes, taskChain),
      fieldDimensions: { x: 1000, y: 1000, z: 500 },
      expansionRate: this.cosmicConstants.hubbleConstant,
      criticalDensity: this._calculateCriticalDensity(nodes)
    };
  }
  
  _calculateCMBPerturbationField(cosmicStructure) {
    const fieldMap = new Map();
    
    for (const node of cosmicStructure.nodes) {
      const isotropicComponent = this.cosmicConstants.perturbationAmplitude * Math.random();
      const anisotropicComponent = this.cosmicConstants.anisotropyFactor * node.perturbationSource;
      const gravitationalLensing = node.mass * 0.1;
      
      fieldMap.set(node.id, {
        isotropic: isotropicComponent,
        anisotropic: anisotropicComponent,
        gravitationalLensing,
        totalPerturbation: Math.sqrt(
          isotropicComponent ** 2 + anisotropicComponent ** 2 + gravitationalLensing ** 2
        )
      });
    }
    
    return fieldMap;
  }
  
  _analyzeAnisotropicDistribution(cosmicStructure) {
    return {
      dipole: { magnitude: Math.random() * 0.01, direction: { x: 1, y: 0, z: 0 } },
      quadrupole: { magnitude: Math.random() * 0.001 },
      higherOrder: Array(5).fill(0).map(() => Math.random() * 0.0001),
      anisotropyLevel: Math.random() * 0.02,
      structureSeeds: cosmicStructure.nodes.filter(node => node.perturbationSource > 0.7).map(node => node.id)
    };
  }
  
  _predictStructureFormation(cosmicStructure, perturbationField) {
    const formationPath = [];
    const collapseRegions = cosmicStructure.nodes.filter(node => {
      const field = perturbationField.get(node.id);
      return field && field.totalPerturbation > this.cosmicConstants.structureFormationThreshold;
    });
    
    for (let timeStep = 0; timeStep < 10; timeStep++) {
      formationPath.push({
        timeStep,
        structureState: {
          time: timeStep,
          evolutionFactor: Math.exp(-timeStep * 0.1),
          structureGrowth: collapseRegions.length * (1 + timeStep * 0.1)
        },
        stabilityRegions: Array(Math.floor(collapseRegions.length * 0.7)).fill(0).map((_, i) => `stable_${i}`),
        instabilityRegions: Array(Math.floor(collapseRegions.length * 0.3)).fill(0).map((_, i) => `unstable_${i}`)
      });
    }
    
    return formationPath;
  }
  
  _calculatePathStability(formationPath, anisotropyAnalysis) {
    if (formationPath.length === 0) return 0;
    
    const stabilityTrend = formationPath.map(step => {
      const stableRegions = step.stabilityRegions.length;
      const unstableRegions = step.instabilityRegions.length;
      return stableRegions / (stableRegions + unstableRegions + 1);
    });
    
    const averageStability = stabilityTrend.reduce((sum, s) => sum + s, 0) / stabilityTrend.length;
    const anisotropyPenalty = anisotropyAnalysis.anisotropyLevel * 0.2;
    
    return Math.max(0, Math.min(1, averageStability - anisotropyPenalty));
  }
  
  _calculateAgentPerturbationStrength(agent) {
    const energyFactor = agent.energy / 100;
    const capabilityFactor = agent.capabilities.length / 10;
    const positionFactor = Math.sqrt(
      agent.position.x ** 2 + agent.position.y ** 2 + agent.position.z ** 2
    ) / 1000;
    
    return (energyFactor + capabilityFactor) * (1 + positionFactor * 0.1);
  }
  
  _calculateCosmicConnections(nodes, taskChain) {
    const connections = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const gravitationalStrength = this._calculateGravitationalBinding(nodes[i], nodes[j]);
        
        if (gravitationalStrength > 0.1) {
          connections.push({
            source: nodes[i].id,
            target: nodes[j].id,
            strength: gravitationalStrength,
            type: 'gravitational'
          });
        }
      }
    }
    
    return connections;
  }
  
  _calculateGravitationalBinding(node1, node2) {
    const distance = Math.sqrt(
      (node1.position.x - node2.position.x) ** 2 +
      (node1.position.y - node2.position.y) ** 2 +
      (node1.position.z - node2.position.z) ** 2
    );
    
    const massProduct = node1.mass * node2.mass;
    const capabilityOverlap = this._calculateCapabilityOverlap(node1.capabilities, node2.capabilities);
    
    return (massProduct * capabilityOverlap) / (distance + 1);
  }
  
  _calculateCapabilityOverlap(caps1, caps2) {
    const set1 = new Set(caps1);
    const set2 = new Set(caps2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  _calculateCriticalDensity(nodes) {
    const totalMass = nodes.reduce((sum, node) => sum + node.mass, 0);
    const volume = 1000 * 1000 * 500;
    return totalMass / volume;
  }
  
  _calculatePredictionConfidence(pathStability, anisotropyAnalysis) {
    const stabilityConfidence = pathStability;
    const anisotropyConfidence = 1 - anisotropyAnalysis.anisotropyLevel;
    return (stabilityConfidence + anisotropyConfidence) / 2;
  }
  
  _identifyCosmicRiskFactors(cosmicStructure) {
    const riskFactors = [];
    
    if (cosmicStructure.criticalDensity < 0.3) {
      riskFactors.push('结构密度过低，可能导致结构不稳定');
    }
    
    if (cosmicStructure.nodes.length < 3) {
      riskFactors.push('节点数量不足，难以形成稳定结构');
    }
    
    const isolatedNodes = cosmicStructure.nodes.filter(node => 
      cosmicStructure.connections.filter(conn => 
        conn.source === node.id || conn.target === node.id
      ).length === 0
    );
    
    if (isolatedNodes.length > 0) {
      riskFactors.push(`${isolatedNodes.length}个孤立节点，可能形成协作孤岛`);
    }
    
    return riskFactors;
  }
}

/**
 * 宇宙结构路径重映射器
 */
class CosmicPathRemapper {
  constructor(config = {}) {
    this.config = config;
  }
  
  async generateAlternativePath(taskChain, availableAgents, failureAnalysis) {
    const collapsePattern = this._analyzeStructuralCollapse(taskChain, failureAnalysis);
    const alternativeStructures = this._identifyAlternativeStructures(availableAgents, collapsePattern);
    const cosmicViability = this._calculateCosmicViability(alternativeStructures, taskChain);
    
    if (cosmicViability.score < 0.6) {
      return null;
    }
    
    return {
      viability: cosmicViability.score,
      alternativeStructure: cosmicViability.bestStructure,
      remappingStrategy: this._determineRemappingStrategy(collapsePattern),
      cosmicStabilityMetrics: cosmicViability.stabilityMetrics
    };
  }
  
  _analyzeStructuralCollapse(taskChain, failureAnalysis) {
    return {
      collapseType: failureAnalysis.type === 'agent-specific' ? 'localized' : 'distributed',
      collapseRadius: failureAnalysis.problematicAgents.length,
      collapseIntensity: failureAnalysis.severity === 'high' ? 0.8 : 0.4,
      affectedRegions: failureAnalysis.problematicAgents
    };
  }
  
  _identifyAlternativeStructures(availableAgents, collapsePattern) {
    const problematicAgents = new Set(collapsePattern.affectedRegions);
    
    return availableAgents
      .filter(agent => !problematicAgents.has(agent.id))
      .map(agent => ({
        id: agent.id,
        cosmicPosition: agent.position,
        structuralMass: agent.energy / 100,
        stabilityIndex: agent.performanceMetrics?.successRate || 0.7
      }));
  }
  
  _calculateCosmicViability(structures, taskChain) {
    if (structures.length === 0) {
      return { score: 0, bestStructure: null, stabilityMetrics: {} };
    }
    
    const viabilityScores = structures.map(structure => ({
      structure,
      score: this._calculateStructuralViability(structure)
    }));
    
    viabilityScores.sort((a, b) => b.score - a.score);
    
    return {
      score: viabilityScores[0].score,
      bestStructure: viabilityScores[0].structure,
      stabilityMetrics: {
        averageStability: viabilityScores.reduce((sum, v) => sum + v.score, 0) / viabilityScores.length,
        structuralDiversity: viabilityScores.length,
        maxViability: viabilityScores[0].score
      }
    };
  }
  
  _calculateStructuralViability(structure) {
    const massStability = structure.structuralMass;
    const performanceStability = structure.stabilityIndex;
    const positionStability = Math.exp(-Math.sqrt(
      structure.cosmicPosition.x ** 2 + 
      structure.cosmicPosition.y ** 2 + 
      structure.cosmicPosition.z ** 2
    ) / 1000);
    
    return (massStability + performanceStability + positionStability) / 3;
  }
  
  _determineRemappingStrategy(collapsePattern) {
    switch (collapsePattern.collapseType) {
      case 'localized':
        return 'structural-substitution';
      case 'distributed':
        return 'cosmic-redistribution';
      default:
        return 'adaptive-reformation';
    }
  }
}

/**
 * 热场溯源图可视化器
 */
class HeatFieldBacktrackingMap {
  constructor(config = {}) {
    this.config = config;
    this.heatFieldHistory = new Map();
    this.visualizationData = new Map();
  }
  
  recordHeatFieldState(chainId, agentId, heatLevel, taskContext) {
    const timestamp = Date.now();
    
    if (!this.heatFieldHistory.has(chainId)) {
      this.heatFieldHistory.set(chainId, []);
    }
    
    const heatRecord = {
      timestamp,
      agentId,
      heatLevel,
      taskId: taskContext.taskId,
      position: taskContext.agentPosition,
      cosmicCoordinates: this._convertToCosmicCoordinates(taskContext.agentPosition)
    };
    
    this.heatFieldHistory.get(chainId).push(heatRecord);
    this._updateVisualizationData(chainId, heatRecord);
  }
  
  generateBacktrackingMap(chainId) {
    const history = this.heatFieldHistory.get(chainId);
    if (!history || history.length === 0) return null;
    
    return {
      chainId,
      totalHeatEvents: history.length,
      heatFieldEvolution: this._analyzeHeatFieldEvolution(history),
      criticalHeatPoints: this._identifyCriticalHeatPoints(history),
      visualizationMap: this._generateVisualizationMap(history)
    };
  }
  
  _convertToCosmicCoordinates(position) {
    return {
      galacticLongitude: Math.atan2(position.y, position.x) * 180 / Math.PI,
      galacticLatitude: Math.atan2(position.z, Math.sqrt(position.x ** 2 + position.y ** 2)) * 180 / Math.PI,
      radialDistance: Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2)
    };
  }
  
  _updateVisualizationData(chainId, heatRecord) {
    if (!this.visualizationData.has(chainId)) {
      this.visualizationData.set(chainId, {
        nodes: new Map(),
        heatField: new Map()
      });
    }
    
    const vizData = this.visualizationData.get(chainId);
    
    vizData.nodes.set(heatRecord.agentId, {
      id: heatRecord.agentId,
      position: heatRecord.position,
      heatLevel: heatRecord.heatLevel,
      lastUpdate: heatRecord.timestamp
    });
    
    vizData.heatField.set(`${heatRecord.agentId}_${heatRecord.timestamp}`, {
      intensity: heatRecord.heatLevel,
      position: heatRecord.cosmicCoordinates,
      timestamp: heatRecord.timestamp
    });
  }
  
  _analyzeHeatFieldEvolution(history) {
    return {
      totalPhases: Math.ceil(history.length / 5),
      heatIntensityTrend: this._calculateHeatTrend(history),
      evolutionPattern: 'cosmic-structure-formation'
    };
  }
  
  _identifyCriticalHeatPoints(history) {
    return history
      .filter(record => record.heatLevel > 0.7)
      .map(record => ({
        agentId: record.agentId,
        timestamp: record.timestamp,
        intensity: record.heatLevel,
        cosmicPosition: record.cosmicCoordinates
      }));
  }
  
  _generateVisualizationMap(history) {
    return {
      heatFieldData: history.map(record => ({
        x: record.cosmicCoordinates.galacticLongitude,
        y: record.cosmicCoordinates.galacticLatitude,
        intensity: record.heatLevel,
        timestamp: record.timestamp
      })),
      agentTrajectories: this._calculateAgentTrajectories(history)
    };
  }
  
  _calculateHeatTrend(history) {
    const timeWindows = [];
    const windowSize = Math.max(1, Math.floor(history.length / 10));
    
    for (let i = 0; i < history.length; i += windowSize) {
      const window = history.slice(i, i + windowSize);
      const avgHeat = window.reduce((sum, record) => sum + record.heatLevel, 0) / window.length;
      timeWindows.push(avgHeat);
    }
    
    return timeWindows;
  }
  
  _calculateAgentTrajectories(history) {
    const trajectories = new Map();
    
    for (const record of history) {
      if (!trajectories.has(record.agentId)) {
        trajectories.set(record.agentId, []);
      }
      
      trajectories.get(record.agentId).push({
        timestamp: record.timestamp,
        position: record.position,
        heatLevel: record.heatLevel
      });
    }
    
    return Object.fromEntries(trajectories);
  }
}

export { TaskChainManager, CosmicPerturbationPredictor, CosmicPathRemapper, HeatFieldBacktrackingMap };
  
  /**
   * 创建任务链
   */
  async createTaskChain(chainData) {
    const chainId = chainData.id || generateId();
    
    const taskChain = {
      id: chainId,
      name: chainData.name || `Chain-${chainId.slice(0, 8)}`,
      description: chainData.description,
      tasks: this._buildTaskGraph(chainData.tasks),
      dependencies: this._buildDependencyGraph(chainData.tasks),
      
      // 执行状态
      status: 'pending', // pending, running, completed, failed, remapping
      currentStep: 0,
      completedTasks: new Set(),
      failedTasks: new Set(),
      
      // 路径追踪
      executionPath: [],
      heatTrace: [],
      perturbationHistory: [],
      
      // 配置
      maxRetries: chainData.maxRetries || this.config.maxRetryAttempts,
      priority: chainData.priority || 5,
      
      // 时间戳
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null
    };\n    \n    this.taskChains.set(chainId, taskChain);\n    \n    console.log(`📋 Created task chain: ${taskChain.name} with ${taskChain.tasks.length} tasks`);\n    \n    this.emit('chain-created', { chainId, taskChain });\n    \n    return chainId;\n  }\n  \n  /**\n   * 执行任务链\n   */\n  async executeTaskChain(chainId, availableAgents) {\n    const taskChain = this.taskChains.get(chainId);\n    if (!taskChain) {\n      throw new Error(`Task chain ${chainId} not found`);\n    }\n    \n    console.log(`🚀 Starting execution of task chain: ${taskChain.name}`);\n    \n    taskChain.status = 'running';\n    taskChain.startedAt = Date.now();\n    this.activeChains.add(chainId);\n    \n    try {\n      // 预测扰动路径\n      const predictedPath = await this.perturbationPredictor.predictPath(taskChain, availableAgents);\n      taskChain.predictedPath = predictedPath;\n      \n      console.log(`🔮 Predicted execution path stability: ${(predictedPath.stability * 100).toFixed(1)}%`);\n      \n      // 执行任务链\n      const result = await this._executeChainSteps(taskChain, availableAgents);\n      \n      taskChain.status = 'completed';\n      taskChain.completedAt = Date.now();\n      this.activeChains.delete(chainId);\n      \n      console.log(`✅ Task chain ${taskChain.name} completed successfully`);\n      \n      this.emit('chain-completed', { chainId, result });\n      \n      return result;\n      \n    } catch (error) {\n      console.error(`❌ Task chain ${taskChain.name} failed:`, error.message);\n      \n      // 尝试路径重映射\n      const remappingResult = await this._attemptPathRemapping(taskChain, availableAgents, error);\n      \n      if (remappingResult.success) {\n        return await this.executeTaskChain(chainId, availableAgents);\n      } else {\n        taskChain.status = 'failed';\n        this.activeChains.delete(chainId);\n        this.failedChains.set(chainId, { error: error.message, timestamp: Date.now() });\n        \n        this.emit('chain-failed', { chainId, error: error.message });\n        throw error;\n      }\n    }\n  }\n  \n  /**\n   * 构建任务图\n   */\n  _buildTaskGraph(tasksData) {\n    return tasksData.map(taskData => ({\n      id: taskData.id || generateId(),\n      name: taskData.name,\n      type: taskData.type,\n      description: taskData.description,\n      requiredCapabilities: taskData.requiredCapabilities || [],\n      dependencies: taskData.dependencies || [],\n      expectedOutput: taskData.expectedOutput,\n      timeoutMs: taskData.timeoutMs || 30000,\n      \n      // 执行状态\n      status: 'pending',\n      assignedAgent: null,\n      startedAt: null,\n      completedAt: null,\n      result: null,\n      retryCount: 0\n    }));\n  }\n  \n  /**\n   * 构建依赖图\n   */\n  _buildDependencyGraph(tasksData) {\n    const dependencies = new Map();\n    \n    for (const task of tasksData) {\n      dependencies.set(task.id, task.dependencies || []);\n    }\n    \n    return dependencies;\n  }\n  \n  /**\n   * 执行链步骤\n   */\n  async _executeChainSteps(taskChain, availableAgents) {\n    const results = [];\n    \n    // 拓扑排序确定执行顺序\n    const executionOrder = this._topologicalSort(taskChain.tasks, taskChain.dependencies);\n    \n    for (const taskId of executionOrder) {\n      const task = taskChain.tasks.find(t => t.id === taskId);\n      if (!task) continue;\n      \n      console.log(`📝 Executing task: ${task.name}`);\n      \n      // 等待依赖完成\n      await this._waitForDependencies(task, taskChain);\n      \n      // 选择最佳Agent\n      const selectedAgent = await this._selectOptimalAgent(task, availableAgents, taskChain);\n      \n      if (!selectedAgent) {\n        throw new Error(`No suitable agent found for task: ${task.name}`);\n      }\n      \n      // 更新热场图\n      this._updateHeatField(selectedAgent.id, task, taskChain);\n      \n      // 执行任务\n      try {\n        task.status = 'running';\n        task.assignedAgent = selectedAgent.id;\n        task.startedAt = Date.now();\n        \n        taskChain.executionPath.push({\n          taskId: task.id,\n          agentId: selectedAgent.id,\n          timestamp: Date.now(),\n          heatLevel: this._getHeatLevel(selectedAgent.id)\n        });\n        \n        // Emit event for real-time visualization\n        this.emit('task-chain-execution-step', {\n          taskChainId: taskChain.id,\n          taskId: task.id,\n          agentId: selectedAgent.id,\n          timestamp: Date.now(),\n          taskName: task.name\n        });\n        \n        const result = await this._executeTaskWithAgent(task, selectedAgent, taskChain);\n        \n        task.status = 'completed';\n        task.completedAt = Date.now();\n        task.result = result;\n        taskChain.completedTasks.add(task.id);\n        \n        results.push(result);\n        \n        console.log(`✅ Task ${task.name} completed by ${selectedAgent.name}`);\n        \n        // Emit completion event\n        this.emit('task-completed-in-chain', {\n          taskChainId: taskChain.id,\n          taskId: task.id,\n          agentId: selectedAgent.id,\n          result: result\n        });\n        \n      } catch (error) {\n        console.error(`❌ Task ${task.name} failed:`, error.message);\n        \n        task.status = 'failed';\n        task.retryCount++;\n        taskChain.failedTasks.add(task.id);\n        \n        // 记录失败位点\n        this._recordFailurePoint(task, selectedAgent, error, taskChain);\n        \n        // 检查是否可以重试\n        if (task.retryCount < taskChain.maxRetries) {\n          console.log(`🔄 Retrying task ${task.name} (attempt ${task.retryCount + 1})`);\n          // 重置状态并重试\n          task.status = 'pending';\n          task.assignedAgent = null;\n          taskChain.failedTasks.delete(task.id);\n          \n          // 从当前任务重新开始\n          const currentIndex = executionOrder.indexOf(taskId);\n          const remainingTasks = executionOrder.slice(currentIndex);\n          \n          for (const retryTaskId of remainingTasks) {\n            const retryTask = taskChain.tasks.find(t => t.id === retryTaskId);\n            if (retryTask && retryTask.status !== 'completed') {\n              await this._executeTaskInChain(retryTask, availableAgents, taskChain);\n            }\n          }\n        } else {\n          throw error;\n        }\n      }\n    }\n    \n    return {\n      chainId: taskChain.id,\n      results,\n      executionPath: taskChain.executionPath,\n      metrics: this._calculateChainMetrics(taskChain)\n    };\n  }\n  \n  /**\n   * 拓扑排序\n   */\n  _topologicalSort(tasks, dependencies) {\n    const visited = new Set();\n    const result = [];\n    \n    const visit = (taskId) => {\n      if (visited.has(taskId)) return;\n      \n      visited.add(taskId);\n      \n      const deps = dependencies.get(taskId) || [];\n      for (const depId of deps) {\n        visit(depId);\n      }\n      \n      result.push(taskId);\n    };\n    \n    for (const task of tasks) {\n      visit(task.id);\n    }\n    \n    return result;\n  }\n  \n  /**\n   * 等待依赖完成\n   */\n  async _waitForDependencies(task, taskChain) {\n    const dependencies = taskChain.dependencies.get(task.id) || [];\n    \n    while (dependencies.some(depId => !taskChain.completedTasks.has(depId))) {\n      await new Promise(resolve => setTimeout(resolve, 100));\n      \n      // 检查是否有依赖失败\n      const failedDeps = dependencies.filter(depId => taskChain.failedTasks.has(depId));\n      if (failedDeps.length > 0) {\n        throw new Error(`Dependency failed: ${failedDeps.join(', ')}`);\n      }\n    }\n  }\n  \n  /**\n   * 选择最佳Agent\n   */\n  async _selectOptimalAgent(task, availableAgents, taskChain) {\n    const candidates = availableAgents.filter(agent => \n      agent.status === 'idle' && \n      this._checkCapabilityMatch(agent, task)\n    );\n    \n    if (candidates.length === 0) return null;\n    \n    // 基于热场图和历史性能选择\n    const scored = candidates.map(agent => ({\n      agent,\n      score: this._calculateAgentScore(agent, task, taskChain)\n    }));\n    \n    scored.sort((a, b) => b.score - a.score);\n    return scored[0].agent;\n  }\n  \n  /**\n   * 检查能力匹配\n   */\n  _checkCapabilityMatch(agent, task) {\n    const agentCaps = new Set(agent.capabilities);\n    const requiredCaps = task.requiredCapabilities;\n    \n    return requiredCaps.every(cap => agentCaps.has(cap));\n  }\n  \n  /**\n   * 计算Agent分数\n   */\n  _calculateAgentScore(agent, task, taskChain) {\n    let score = 0;\n    \n    // 能力匹配度\n    const capabilityMatch = this._calculateCapabilityMatch(agent, task);\n    score += capabilityMatch * 0.4;\n    \n    // 热场图权重\n    const heatLevel = this._getHeatLevel(agent.id);\n    score += (1 - heatLevel) * 0.3; // 热度低的Agent优先\n    \n    // 历史成功率\n    score += agent.performanceMetrics.successRate * 0.2;\n    \n    // 当前能量状态\n    score += (agent.energy / agent.maxEnergy) * 0.1;\n    \n    return score;\n  }\n  \n  /**\n   * 更新热场图\n   */\n  _updateHeatField(agentId, task, taskChain) {\n    if (!this.heatFieldMap.has(agentId)) {\n      this.heatFieldMap.set(agentId, { heat: 0, lastUpdate: Date.now(), taskCount: 0 });\n    }\n    \n    const heatData = this.heatFieldMap.get(agentId);\n    heatData.heat = Math.min(1.0, heatData.heat + 0.2);\n    heatData.lastUpdate = Date.now();\n    heatData.taskCount++;\n    \n    // 记录热场追踪\n    taskChain.heatTrace.push({\n      agentId,\n      taskId: task.id,\n      heatLevel: heatData.heat,\n      timestamp: Date.now()\n    });\n  }\n  \n  /**\n   * 获取热度级别\n   */\n  _getHeatLevel(agentId) {\n    const heatData = this.heatFieldMap.get(agentId);\n    if (!heatData) return 0;\n    \n    // 热度衰减\n    const timeSinceUpdate = Date.now() - heatData.lastUpdate;\n    const decayedHeat = heatData.heat * Math.exp(-timeSinceUpdate * this.config.heatDecayRate / 10000);\n    \n    return Math.max(0, decayedHeat);\n  }\n  \n  /**\n   * 记录失败点\n   */\n  _recordFailurePoint(task, agent, error, taskChain) {\n    const failurePoint = {\n      taskId: task.id,\n      agentId: agent.id,\n      error: error.message,\n      timestamp: Date.now(),\n      heatLevel: this._getHeatLevel(agent.id),\n      pathPosition: taskChain.executionPath.length\n    };\n    \n    if (!taskChain.failurePoints) {\n      taskChain.failurePoints = [];\n    }\n    \n    taskChain.failurePoints.push(failurePoint);\n    \n    console.log(`🔥 Recorded failure point: Task ${task.name} failed on Agent ${agent.name}`);\n  }\n  \n  /**\n   * 尝试路径重映射\n   */\n  async _attemptPathRemapping(taskChain, availableAgents, originalError) {\n    console.log(`🗺️ Attempting path remapping for chain: ${taskChain.name}`);\n    \n    taskChain.status = 'remapping';\n    \n    try {\n      // 分析失败模式\n      const failureAnalysis = this._analyzeFailurePattern(taskChain);\n      \n      // 生成新路径\n      const newPath = await this.pathRemapper.generateAlternativePath(\n        taskChain, \n        availableAgents, \n        failureAnalysis\n      );\n      \n      if (newPath && newPath.viability > 0.6) {\n        console.log(`✅ Found alternative path with viability: ${(newPath.viability * 100).toFixed(1)}%`);\n        \n        // 重置任务链状态\n        this._resetTaskChain(taskChain, newPath);\n        \n        return { success: true, newPath };\n      } else {\n        console.log(`❌ No viable alternative path found`);\n        return { success: false, reason: 'No viable alternative path' };\n      }\n      \n    } catch (error) {\n      console.error(`❌ Path remapping failed:`, error.message);\n      return { success: false, reason: error.message };\n    }\n  }\n  \n  /**\n   * 分析失败模式\n   */\n  _analyzeFailurePattern(taskChain) {\n    const failurePoints = taskChain.failurePoints || [];\n    \n    if (failurePoints.length === 0) {\n      return { type: 'unknown', severity: 'low' };\n    }\n    \n    // 分析失败模式\n    const agentFailures = new Map();\n    const taskFailures = new Map();\n    \n    for (const fp of failurePoints) {\n      agentFailures.set(fp.agentId, (agentFailures.get(fp.agentId) || 0) + 1);\n      taskFailures.set(fp.taskId, (taskFailures.get(fp.taskId) || 0) + 1);\n    }\n    \n    const maxAgentFailures = Math.max(...agentFailures.values());\n    const maxTaskFailures = Math.max(...taskFailures.values());\n    \n    let failureType = 'distributed';\n    if (maxAgentFailures > failurePoints.length * 0.6) {\n      failureType = 'agent-specific';\n    } else if (maxTaskFailures > failurePoints.length * 0.6) {\n      failureType = 'task-specific';\n    }\n    \n    return {\n      type: failureType,\n      severity: failurePoints.length > 3 ? 'high' : 'medium',\n      problematicAgents: Array.from(agentFailures.entries())\n        .filter(([_, count]) => count > 1)\n        .map(([agentId, _]) => agentId),\n      problematicTasks: Array.from(taskFailures.entries())\n        .filter(([_, count]) => count > 1)\n        .map(([taskId, _]) => taskId)\n    };\n  }\n  \n  /**\n   * 重置任务链状态\n   */\n  _resetTaskChain(taskChain, newPath) {\n    // 重置失败的任务\n    for (const task of taskChain.tasks) {\n      if (task.status === 'failed') {\n        task.status = 'pending';\n        task.assignedAgent = null;\n        task.startedAt = null;\n        task.result = null;\n      }\n    }\n    \n    taskChain.failedTasks.clear();\n    taskChain.status = 'pending';\n    taskChain.remappingCount = (taskChain.remappingCount || 0) + 1;\n    \n    console.log(`🔄 Reset task chain for retry with new path`);\n  }\n  \n  /**\n   * 计算链指标\n   */\n  _calculateChainMetrics(taskChain) {\n    const totalTasks = taskChain.tasks.length;\n    const completedTasks = taskChain.completedTasks.size;\n    const failedTasks = taskChain.failedTasks.size;\n    \n    const executionTime = taskChain.completedAt - taskChain.startedAt;\n    const averageHeat = taskChain.heatTrace.reduce((sum, h) => sum + h.heatLevel, 0) / taskChain.heatTrace.length;\n    \n    return {\n      totalTasks,\n      completedTasks,\n      failedTasks,\n      successRate: completedTasks / totalTasks,\n      executionTime,\n      averageHeat,\n      pathStability: this._calculatePathStability(taskChain),\n      remappingCount: taskChain.remappingCount || 0\n    };\n  }\n  \n  /**\n   * 计算路径稳定性\n   */\n  _calculatePathStability(taskChain) {\n    if (taskChain.heatTrace.length < 2) return 1.0;\n    \n    // 基于热度变化计算稳定性\n    const heatLevels = taskChain.heatTrace.map(h => h.heatLevel);\n    const variance = this._calculateVariance(heatLevels);\n    \n    return Math.exp(-variance * 2); // 方差越小，稳定性越高\n  }\n  \n  /**\n   * 计算方差\n   */\n  _calculateVariance(values) {\n    if (values.length === 0) return 0;\n    \n    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;\n    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));\n    \n    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;\n  }\n  \n  /**\n   * 初始化管理器\n   */\n  _initializeManager() {\n    // 定期清理过期数据\n    setInterval(() => {\n      this._cleanupExpiredData();\n    }, 60000); // 每分钟清理一次\n  }\n  \n  /**\n   * 清理过期数据\n   */\n  _cleanupExpiredData() {\n    const now = Date.now();\n    \n    // 清理热场图中的过期数据\n    for (const [agentId, heatData] of this.heatFieldMap) {\n      if (now - heatData.lastUpdate > 300000) { // 5分钟\n        this.heatFieldMap.delete(agentId);\n      }\n    }\n  }\n  \n  /**\n   * 获取系统状态\n   */\n  getStatus() {\n    return {\n      totalChains: this.taskChains.size,\n      activeChains: this.activeChains.size,\n      failedChains: this.failedChains.size,\n      heatMapSize: this.heatFieldMap.size,\n      averageChainLength: this._calculateAverageChainLength(),\n      systemHealth: this._calculateSystemHealth()\n    };\n  }\n  \n  _calculateAverageChainLength() {\n    if (this.taskChains.size === 0) return 0;\n    \n    const totalTasks = Array.from(this.taskChains.values())\n      .reduce((sum, chain) => sum + chain.tasks.length, 0);\n    \n    return totalTasks / this.taskChains.size;\n  }\n  \n  _calculateSystemHealth() {\n    const totalChains = this.taskChains.size;\n    const failedChains = this.failedChains.size;\n    \n    return totalChains > 0 ? (totalChains - failedChains) / totalChains : 1.0;\n  }\n}\n\n/**\n * 扰动路径预测器\n */\nclass PerturbationPathPredictor {\n  async predictPath(taskChain, availableAgents) {\n    // 简化的路径预测逻辑\n    const pathStability = Math.random() * 0.5 + 0.5; // 0.5-1.0\n    const riskFactors = [];\n    \n    // 分析风险因素\n    for (const task of taskChain.tasks) {\n      const suitableAgents = availableAgents.filter(agent => \n        task.requiredCapabilities.every(cap => agent.capabilities.includes(cap))\n      );\n      \n      if (suitableAgents.length === 0) {\n        riskFactors.push(`No suitable agents for task: ${task.name}`);\n      } else if (suitableAgents.length === 1) {\n        riskFactors.push(`Single point of failure for task: ${task.name}`);\n      }\n    }\n    \n    return {\n      stability: pathStability,\n      riskFactors,\n      confidence: riskFactors.length === 0 ? 0.9 : Math.max(0.3, 0.9 - riskFactors.length * 0.1)\n    };\n  }\n}\n\n/**\n * 路径重映射器\n */\nclass PathRemapper {\n  async generateAlternativePath(taskChain, availableAgents, failureAnalysis) {\n    // 简化的路径重映射逻辑\n    const problematicAgents = new Set(failureAnalysis.problematicAgents || []);\n    \n    // 过滤掉有问题的Agent\n    const reliableAgents = availableAgents.filter(agent => \n      !problematicAgents.has(agent.id) && agent.performanceMetrics.successRate > 0.7\n    );\n    \n    if (reliableAgents.length === 0) {\n      return null;\n    }\n    \n    // 计算新路径的可行性\n    let viability = 0.8; // 基础可行性\n    \n    for (const task of taskChain.tasks) {\n      const suitableAgents = reliableAgents.filter(agent => \n        task.requiredCapabilities.every(cap => agent.capabilities.includes(cap))\n      );\n      \n      if (suitableAgents.length === 0) {\n        viability = 0; // 无法完成\n        break;\n      } else {\n        viability *= Math.min(1.0, suitableAgents.length * 0.2 + 0.5); // 候选数量越多，可行性越高\n      }\n    }\n    \n    return {\n      viability,\n      reliableAgents,\n      strategy: failureAnalysis.type === 'agent-specific' ? 'agent-substitution' : 'load-balancing'\n    };\n  }\n}\n\nexport { TaskChainManager, PerturbationPathPredictor, PathRemapper };