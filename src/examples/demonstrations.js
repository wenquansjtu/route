import { CosmicAgent } from '../core/Agent.js';
import { Task } from '../core/Models.js';
import { SemanticPerturbationMap } from '../spm/index.js';
import { TensorCooperationField } from '../tcf/index.js';
import { TopologyManager } from '../topology/index.js';
import { CollaborationEngine } from '../collaboration/index.js';
import ProfSmootDemo from './prof-smoot-demo.js';

/**
 * 基础示例：演示Agent创建和基本协作
 */
export async function basicCollaborationExample() {
  console.log('🚀 开始基础协作示例...');
  
  // 创建协作引擎
  const collaboration = new CollaborationEngine();
  
  // 创建几个不同类型的Agent
  const dataAnalyzer = new CosmicAgent({
    name: 'DataAnalyzer',
    type: 'analysis',
    capabilities: ['data_analysis', 'statistical_processing'],
    position: { x: -100, y: 0, z: 0 }
  });
  
  const reasoningEngine = new CosmicAgent({
    name: 'ReasoningEngine',
    type: 'reasoning',
    capabilities: ['logical_reasoning', 'pattern_recognition'],
    position: { x: 100, y: 0, z: 0 }
  });
  
  const coordinator = new CosmicAgent({
    name: 'Coordinator',
    type: 'coordination',
    capabilities: ['task_coordination', 'resource_management'],
    position: { x: 0, y: 100, z: 0 }
  });
  
  // 注册Agent到协作引擎
  collaboration.registerAgent(dataAnalyzer);
  collaboration.registerAgent(reasoningEngine);
  collaboration.registerAgent(coordinator);
  
  // 创建一个需要协作的任务
  const collaborativeTask = new Task({
    name: '市场趋势分析',
    type: 'analysis',
    description: '分析市场数据并预测趋势',
    collaborationType: 'parallel',
    maxAgents: 2,
    requiredCapabilities: ['data_analysis', 'logical_reasoning'],
    priority: 8
  });
  
  // 提交任务
  const taskId = collaboration.submitTask(collaborativeTask);
  console.log(`📋 提交任务: ${taskId}`);
  
  // 监听任务完成事件
  collaboration.on('task-completed', (event) => {
    console.log(`✅ 任务完成: ${event.taskId}`);
    console.log(`📊 结果:`, event.result);
  });
  
  // 等待任务完成
  await new Promise(resolve => {
    collaboration.on('task-completed', resolve);
    setTimeout(resolve, 10000); // 10秒超时
  });
  
  console.log('✨ 基础协作示例完成');
  
  // 清理资源
  collaboration.destroy();
}

/**
 * 语义扰动映射示例：演示SPM的工作原理
 */
export async function semanticPerturbationExample() {
  console.log('🌊 开始语义扰动映射示例...');
  
  // 创建SPM系统
  const spm = new SemanticPerturbationMap();
  
  // 创建具有不同语义特征的Agent
  const agents = [
    new CosmicAgent({
      name: 'TextProcessor',
      type: 'nlp',
      capabilities: ['text_processing', 'language_analysis'],
      semanticEmbedding: Array(768).fill(0).map(() => Math.random() * 0.5) // NLP特征向量
    }),
    new CosmicAgent({
      name: 'ImageAnalyzer',
      type: 'vision',
      capabilities: ['image_processing', 'computer_vision'],
      semanticEmbedding: Array(768).fill(0).map(() => 0.5 + Math.random() * 0.5) // 视觉特征向量
    }),
    new CosmicAgent({
      name: 'AudioProcessor',
      type: 'audio',
      capabilities: ['audio_processing', 'speech_recognition'],
      semanticEmbedding: Array(768).fill(0).map(() => Math.random()) // 音频特征向量
    })
  ];
  
  // 添加Agent到SPM
  for (const agent of agents) {
    smp.addAgent(agent);
  }
  
  // 创建语义扰动
  console.log('🔄 创建语义扰动...');
  const perturbation1 = spm.createPerturbation(agents[0].id, agents[1].id, {
    semanticType: 'information',
    magnitude: 0.8
  });
  
  const perturbation2 = spm.createPerturbation(agents[1].id, agents[2].id, {
    semanticType: 'collaboration',
    magnitude: 0.6
  });
  
  console.log(`📡 创建扰动: ${perturbation1.id}`);
  console.log(`📡 创建扰动: ${perturbation2.id}`);
  
  // 监听SPM更新
  spm.on('map-updated', (event) => {
    const status = spm.getStatusSummary();
    console.log(`📈 SPM状态更新:`);
    console.log(`  - Agent数量: ${status.agents}`);
    console.log(`  - 活跃扰动: ${status.activePerturbations}`);
    console.log(`  - 平均相干性: ${(status.averageCoherence * 100).toFixed(1)}%`);
    console.log(`  - 网络熵: ${status.networkEntropy.toFixed(3)}`);
  });
  
  // 等待扰动传播
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 获取协作推荐
  const recommendations = spm.getRecommendedCollaborators(agents[0].id);
  console.log('🤝 协作推荐:');
  recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. Agent ${rec.agentId.slice(0, 8)} (分数: ${rec.score.toFixed(3)})`);
  });
  
  console.log('✨ 语义扰动映射示例完成');
  
  // 清理资源
  spm.destroy();
}

/**
 * 张量协作力场示例：演示TCF的动态行为
 */
export async function tensorCooperationFieldExample() {
  console.log('⚡ 开始张量协作力场示例...');
  
  // 创建TCF系统
  const tcf = new TensorCooperationField();
  
  // 创建具有不同能量和位置的Agent
  const agents = [
    new CosmicAgent({
      name: 'HighEnergyAgent',
      energy: 90,
      mass: 1.5,
      position: { x: -200, y: 0, z: 0 },
      memoryEntropy: 0.2
    }),
    new CosmicAgent({
      name: 'MediumEnergyAgent',
      energy: 60,
      mass: 1.0,
      position: { x: 0, y: 150, z: 0 },
      memoryEntropy: 0.5
    }),
    new CosmicAgent({
      name: 'LowEnergyAgent',
      energy: 30,
      mass: 0.8,
      position: { x: 200, y: 0, z: 0 },
      memoryEntropy: 0.8
    })
  ];
  
  // 添加Agent到TCF
  for (const agent of agents) {
    tcf.addAgent(agent);
  }
  
  // 监听力场更新
  tcf.on('field-updated', (event) => {
    const status = event.collaborationState;
    console.log(`⚡ TCF状态更新:`);
    console.log(`  - 全局相干性: ${(status.globalCoherence * 100).toFixed(1)}%`);
    console.log(`  - 共振级别: ${(status.resonanceLevel * 100).toFixed(1)}%`);
    console.log(`  - 收敛状态: ${status.convergenceStatus}`);
    console.log(`  - 波动幅度: ${status.waveAmplitude.toFixed(3)}`);
  });
  
  // 模拟Agent移动和交互
  console.log('🔄 模拟Agent动态交互...');
  
  for (let i = 0; i < 10; i++) {
    // 随机更新Agent位置
    for (const agent of agents) {
      const newPosition = {
        x: agent.position.x + (Math.random() - 0.5) * 20,
        y: agent.position.y + (Math.random() - 0.5) * 20,
        z: agent.position.z + (Math.random() - 0.5) * 20
      };
      
      tcf.updateAgent(agent.id, { position: newPosition });
      agent.position = newPosition;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 获取最终状态
  const finalStatus = tcf.getStatusSummary();
  console.log('📊 最终TCF状态:');
  console.log(`  - 协作波动: ${finalStatus.cooperationWaves}`);
  console.log(`  - 共振区域: ${finalStatus.resonanceZones}`);
  console.log(`  - 奇点数量: ${finalStatus.singularityPoints}`);
  
  console.log('✨ 张量协作力场示例完成');
  
  // 清理资源
  tcf.destroy();
}

/**
 * 拓扑重构示例：演示网络动态重构
 */
export async function topologyRestructuringExample() {
  console.log('🕸️ 开始拓扑重构示例...');
  
  // 创建拓扑管理器
  const topology = new TopologyManager();
  
  // 创建多个Agent形成初始网络
  const agents = [];
  for (let i = 0; i < 8; i++) {
    const agent = new CosmicAgent({
      name: `Agent-${i + 1}`,
      type: ['analysis', 'processing', 'reasoning', 'coordination'][i % 4],
      capabilities: [`capability_${i}`, `shared_capability`],
      position: {
        x: Math.cos(i * Math.PI / 4) * 200,
        y: Math.sin(i * Math.PI / 4) * 200,
        z: 0
      }
    });
    
    agents.push(agent);
    topology.addNode(agent);
  }
  
  // 建立初始连接（环形网络）
  for (let i = 0; i < agents.length; i++) {
    const nextIndex = (i + 1) % agents.length;
    topology.addConnection(agents[i].id, agents[nextIndex].id, {
      weight: 0.5 + Math.random() * 0.5,
      type: 'initial'
    });
  }
  
  console.log('📊 初始网络状态:');
  let status = topology.getStatusSummary();
  console.log(`  - 节点数: ${status.nodes}`);
  console.log(`  - 边数: ${status.edges}`);
  console.log(`  - 连通分量: ${status.connectedComponents}`);
  
  // 监听重构事件
  topology.on('restructure-needed', (event) => {
    console.log(`⚠️ 需要重构: ${event.reasons.join(', ')}`);
  });
  
  topology.on('restructure-completed', (event) => {
    console.log(`✅ 重构完成: ${event.reason}`);
  });
  
  // 模拟网络问题：移除一些连接创建孤岛
  console.log('🔧 模拟网络分裂...');
  const edgesToRemove = Math.floor(agents.length / 3);
  for (let i = 0; i < edgesToRemove; i++) {
    const agent1 = agents[i];
    const agent2 = agents[(i + 1) % agents.length];
    topology.removeConnection(agent1.id, agent2.id);
  }
  
  // 等待系统检测并重构
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 检查重构后的状态
  status = topology.getStatusSummary();
  console.log('📈 重构后网络状态:');
  console.log(`  - 节点数: ${status.nodes}`);
  console.log(`  - 边数: ${status.edges}`);
  console.log(`  - 连通分量: ${status.connectedComponents}`);
  console.log(`  - 孤立节点: ${status.isolatedNodes}`);
  
  console.log('✨ 拓扑重构示例完成');
  
  // 清理资源
  topology.destroy();
}

/**
 * 复杂任务链示例：演示多Agent协作完成复杂任务
 */
export async function complexTaskChainExample() {
  console.log('🔗 开始复杂任务链示例...');
  
  // 创建协作引擎
  const collaboration = new CollaborationEngine();
  
  // 创建专业化Agent团队
  const team = [
    new CosmicAgent({
      name: 'DataCollector',
      type: 'data_collection',
      capabilities: ['data_collection', 'web_scraping', 'api_integration']
    }),
    new CosmicAgent({
      name: 'DataProcessor',
      type: 'data_processing',
      capabilities: ['data_cleaning', 'data_transformation', 'feature_engineering']
    }),
    new CosmicAgent({
      name: 'ModelTrainer',
      type: 'machine_learning',
      capabilities: ['model_training', 'hyperparameter_tuning', 'validation']
    }),
    new CosmicAgent({
      name: 'ResultAnalyzer',
      type: 'analysis',
      capabilities: ['result_analysis', 'statistical_testing', 'visualization']
    }),
    new CosmicAgent({
      name: 'ReportGenerator',
      type: 'reporting',
      capabilities: ['report_generation', 'documentation', 'presentation']
    })
  ];
  
  // 注册所有Agent
  for (const agent of team) {
    collaboration.registerAgent(agent);
  }
  
  // 创建依赖任务链
  const tasks = [
    new Task({
      id: 'task_001',
      name: '数据收集',
      type: 'data_collection',
      description: '从多个数据源收集原始数据',
      requiredCapabilities: ['data_collection'],
      dependencies: [],
      priority: 10
    }),
    new Task({
      id: 'task_002',
      name: '数据预处理',
      type: 'data_processing',
      description: '清洗和转换收集的数据',
      requiredCapabilities: ['data_cleaning', 'data_transformation'],
      dependencies: ['task_001'],
      priority: 9
    }),
    new Task({
      id: 'task_003',
      name: '模型训练',
      type: 'machine_learning',
      description: '训练机器学习模型',
      requiredCapabilities: ['model_training'],
      dependencies: ['task_002'],
      priority: 8
    }),
    new Task({
      id: 'task_004',
      name: '结果分析',
      type: 'analysis',
      description: '分析模型结果和性能',
      requiredCapabilities: ['result_analysis'],
      dependencies: ['task_003'],
      priority: 7
    }),
    new Task({
      id: 'task_005',
      name: '报告生成',
      type: 'reporting',
      description: '生成最终分析报告',
      requiredCapabilities: ['report_generation'],
      dependencies: ['task_004'],
      priority: 6
    })
  ];
  
  // 提交任务链
  const chainId = collaboration.submitTaskChain({
    name: '端到端数据分析流水线',
    tasks: tasks,
    strategy: 'sequential'
  });
  
  console.log(`📋 提交任务链: ${chainId}`);
  
  // 监听任务链事件
  let completedTasks = 0;
  collaboration.on('chain-task-completed', (event) => {
    completedTasks++;
    console.log(`✅ 任务完成 (${completedTasks}/${tasks.length}): ${event.taskId}`);
  });
  
  collaboration.on('task-chain-completed', (event) => {
    console.log(`🎉 任务链完成: ${event.chainId}`);
    console.log(`📊 总进度: ${(event.chain.progress * 100).toFixed(1)}%`);
  });
  
  // 等待任务链完成
  await new Promise(resolve => {
    collaboration.on('task-chain-completed', resolve);
    setTimeout(() => {
      console.log('⏱️ 任务链执行超时');
      resolve();
    }, 30000); // 30秒超时
  });
  
  // 获取最终状态
  const finalStatus = collaboration.getStatusSummary();
  console.log('📈 最终协作状态:');
  console.log(`  - 活跃Agent: ${finalStatus.agents}`);
  console.log(`  - 已完成任务: ${finalStatus.tasks.completed}`);
  console.log(`  - 任务链数: ${finalStatus.taskChains}`);
  
  console.log('✨ 复杂任务链示例完成');
  
  // 清理资源
  collaboration.destroy();
}

/**
 * Prof. Smoot Specialized Agent Demo
 */
export async function profSmootSpecializedDemo() {
  console.log('🌌 开始Prof. Smoot专业化Agent示例...\n');
  
  try {
    const demo = new ProfSmootDemo();
    await demo.runFullDemo();
    
    console.log('\n✨ Prof. Smoot专业化Agent示例完成！');
    
  } catch (error) {
    console.error('❌ Prof. Smoot示例执行出错:', error);
  }
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('🌌 开始运行Cosmic Agent Network示例集合\n');
  
  try {
    await basicCollaborationExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await semanticPerturbationExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await tensorCooperationFieldExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await topologyRestructuringExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await complexTaskChainExample();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    await profSmootSpecializedDemo();
    
    console.log('\n🎊 所有示例执行完成！');
    
  } catch (error) {
    console.error('❌ 示例执行出错:', error);
  }
}