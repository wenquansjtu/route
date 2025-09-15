/**
 * Cosmic Agent Network 主入口文件
 * 统一导出所有核心模块
 */

// 核心模块
export { CosmicAgent } from './core/Agent.js';
export { TensorPerturbation, SemanticVector, Task } from './core/Models.js';
export * from './core/index.js';

// SPM模块
export { SemanticPerturbationMap, SPMScheduler } from './spm/index.js';

// TCF模块
export { TensorCooperationField, TCFFieldCalculator, TCFWaveDetector, TCFResonanceDetector } from './tcf/index.js';

// 拓扑模块
export { TopologyManager, TopologyRestructurer, ClusterManager } from './topology/index.js';

// 协作模块
export { CollaborationEngine, CollaborationProcessor, TaskChainProcessor } from './collaboration/index.js';

// 示例和演示
export * from './examples/demonstrations.js';

// 版本信息
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

/**
 * 创建完整的Cosmic Agent Network系统实例
 */
export function createCosmicSystem(config = {}) {
  const {
    spmConfig = {},
    tcfConfig = {},
    topologyConfig = {},
    collaborationConfig = {}
  } = config;
  
  // 创建核心组件
  const spm = new SemanticPerturbationMap(smpConfig);
  const tcf = new TensorCooperationField(tcfConfig);
  const topology = new TopologyManager(topologyConfig);
  const collaboration = new CollaborationEngine(collaborationConfig);
  
  // 连接系统组件
  collaboration.connectSystems(spm, tcf, topology);
  
  // 创建调度器和重构器
  const scheduler = new SPMScheduler(spm);
  const restructurer = new TopologyRestructurer(topology);
  
  return {
    spm,
    tcf,
    topology,
    collaboration,
    scheduler,
    restructurer,
    
    // 便捷方法
    createAgent: (config) => {
      const agent = new CosmicAgent(config);
      
      // 注册到所有系统
      spm.addAgent(agent);
      tcf.addAgent(agent);
      topology.addNode(agent);
      collaboration.registerAgent(agent);
      
      return agent;
    },
    
    submitTask: (taskData) => {
      return collaboration.submitTask(taskData);
    },
    
    submitTaskChain: (chainData) => {
      return collaboration.submitTaskChain(chainData);
    },
    
    getSystemStatus: () => {
      return {
        spm: spm.getStatusSummary(),
        tcf: tcf.getStatusSummary(),
        topology: topology.getStatusSummary(),
        collaboration: collaboration.getStatusSummary()
      };
    },
    
    destroy: () => {
      spm.destroy();
      tcf.destroy();
      topology.destroy();
      collaboration.destroy();
    }
  };
}", "original_text": "", "replace_all": false}]