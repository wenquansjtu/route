# Cosmic Agent Network API 文档

## 概述

Cosmic Agent Network 是一个基于宇宙结构理论的多智能体协作系统，提供完整的API用于创建、管理和协调AI Agent网络。

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动系统

```bash
# 启动Web服务器
npm start

# 运行示例程序
node src/examples/index.js

# 开发模式
npm run dev
```

### 基础使用

```javascript
import { createCosmicSystem, CosmicAgent, Task } from './src/index.js';

// 创建系统实例
const system = createCosmicSystem();

// 创建Agent
const agent = system.createAgent({
  name: 'MyAgent',
  type: 'analysis',
  capabilities: ['data_analysis']
});

// 提交任务
const taskId = system.submitTask({
  name: '数据分析任务',
  type: 'analysis',
  description: '分析用户行为数据'
});
```

## 核心组件 API

### CosmicAgent

智能体基础类，支持语义嵌入、能量管理和任务处理。

```javascript
const agent = new CosmicAgent({
  name: 'Agent名称',
  type: 'agent类型',
  capabilities: ['能力1', '能力2'],
  position: { x: 0, y: 0, z: 0 },
  energy: 100,
  mass: 1.0
});

// 处理任务
const result = await agent.processTask(task);

// 更新语义嵌入
agent.updateSemanticEmbedding(newEmbedding);

// 获取状态摘要
const status = agent.getStatusSummary();
```

### SemanticPerturbationMap (SPM)

语义扰动映射矩阵，用于分析和预测Agent间的协作趋势。

```javascript
const spm = new SemanticPerturbationMap({
  dimensions: 768,
  updateInterval: 100,
  perturbationThreshold: 0.1
});

// 添加Agent
spm.addAgent(agent);

// 创建扰动
const perturbation = spm.createPerturbation(sourceAgentId, targetAgentId, {
  magnitude: 0.8,
  semanticType: 'collaboration'
});

// 获取协作推荐
const recommendations = spm.getRecommendedCollaborators(agentId);

// 获取趋势预测
const prediction = spm.getCollaborationTrendPrediction(agentId, timeHorizon);
```

### TensorCooperationField (TCF)

张量协作力场，量化Agent间的多维度协同效应。

```javascript
const tcf = new TensorCooperationField({
  dimensions: 768,
  fieldResolution: 50,
  updateInterval: 200
});

// 添加Agent
tcf.addAgent(agent);

// 更新Agent状态
tcf.updateAgent(agentId, {
  position: newPosition,
  energy: newEnergy
});

// 获取状态摘要
const status = tcf.getStatusSummary();
```

### TopologyManager

拓扑结构管理器，负责网络结构的动态维护和重构。

```javascript
const topology = new TopologyManager({
  maxNodes: 1000,
  connectionThreshold: 0.3,
  stabilityThreshold: 0.8
});

// 添加节点
topology.addNode(agent);

// 建立连接
topology.addConnection(agentId1, agentId2, {
  weight: 0.8,
  type: 'collaboration'
});

// 获取状态摘要
const status = topology.getStatusSummary();
```

### CollaborationEngine

协作收敛引擎，管理多Agent任务协作和收敛过程。

```javascript
const collaboration = new CollaborationEngine({
  maxConcurrentTasks: 20,
  convergenceThreshold: 0.95
});

// 注册Agent
collaboration.registerAgent(agent);

// 提交任务
const taskId = collaboration.submitTask({
  name: '任务名称',
  type: 'analysis',
  collaborationType: 'parallel',
  requiredCapabilities: ['analysis']
});

// 提交任务链
const chainId = collaboration.submitTaskChain({
  name: '任务链名称',
  tasks: [task1, task2, task3],
  strategy: 'sequential'
});

// 获取状态摘要
const status = collaboration.getStatusSummary();
```

## 事件系统

所有组件都支持事件监听：

```javascript
// SPM事件
spm.on('agent-added', (event) => {
  console.log('Agent已添加:', event.agentId);
});

spm.on('perturbation-created', (event) => {
  console.log('扰动已创建:', event.perturbation.id);
});

spm.on('map-updated', (event) => {
  console.log('映射已更新:', event.statistics);
});

// TCF事件
tcf.on('field-updated', (event) => {
  console.log('力场已更新:', event.collaborationState);
});

// 拓扑事件
topology.on('restructure-needed', (event) => {
  console.log('需要重构:', event.reasons);
});

topology.on('restructure-completed', (event) => {
  console.log('重构完成:', event.reason);
});

// 协作事件
collaboration.on('task-completed', (event) => {
  console.log('任务完成:', event.taskId);
});

collaboration.on('convergence-updated', (event) => {
  console.log('收敛状态更新:', event.convergenceState);
});
```

## Web API

### 系统状态

```http
GET /api/status
```

返回系统整体状态信息。

### Agent管理

```http
# 获取所有Agent
GET /api/agents

# 创建Agent
POST /api/agents
Content-Type: application/json

{
  \"name\": \"Agent名称\",
  \"type\": \"analysis\",
  \"capabilities\": [\"data_analysis\"]
}
```

### 任务管理

```http
# 创建任务
POST /api/tasks
Content-Type: application/json

{
  \"name\": \"任务名称\",
  \"type\": \"analysis\",
  \"description\": \"任务描述\",
  \"collaborationType\": \"parallel\",
  \"requiredCapabilities\": [\"analysis\"]
}
```

### 拓扑信息

```http
GET /api/topology
```

### TCF信息

```http
GET /api/tcf
```

### 协作信息

```http
GET /api/collaboration
```

## WebSocket 事件

连接到 `ws://localhost:8080` 接收实时更新：

```javascript
const socket = new WebSocket('ws://localhost:8080');

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'system-status':
      console.log('系统状态:', data.payload);
      break;
    case 'agent-update':
      console.log('Agent更新:', data.payload);
      break;
    case 'task-update':
      console.log('任务更新:', data.payload);
      break;
    case 'topology-update':
      console.log('拓扑更新:', data.payload);
      break;
    case 'tcf-update':
      console.log('TCF更新:', data.payload);
      break;
  }
};

// 发送消息
socket.send(JSON.stringify({
  type: 'create-task',
  payload: {
    name: '新任务',
    type: 'analysis'
  }
}));
```

## 配置选项

### SPM配置

```javascript
const spmConfig = {
  dimensions: 768,                    // 语义向量维度
  maxAgents: 1000,                   // 最大Agent数量
  updateInterval: 100,               // 更新间隔(ms)
  perturbationThreshold: 0.1,        // 扰动阈值
  propagationSpeed: 1.0,             // 传播速度
  dampingFactor: 0.05,               // 阻尼因子
  resonanceAmplification: 1.5        // 共振放大
};
```

### TCF配置

```javascript
const tcfConfig = {
  dimensions: 768,                    // 张量维度
  fieldResolution: 50,               // 力场分辨率
  updateInterval: 200,               // 更新间隔(ms)
  semanticDim: 0.4,                  // 语义权重
  noveltyDim: 0.25,                  // 新颖度权重
  coherenceDim: 0.25,                // 相干性权重
  entropyDim: 0.1,                   // 熵权重
  attractionStrength: 1.0,           // 吸引强度
  repulsionStrength: 0.3,            // 排斥强度
  resonanceThreshold: 0.8,           // 共振阈值
  convergenceThreshold: 0.95,        // 收敛阈值
  divergenceThreshold: 0.2           // 发散阈值
};
```

### 拓扑配置

```javascript
const topologyConfig = {
  maxNodes: 1000,                     // 最大节点数
  updateInterval: 500,               // 更新间隔(ms)
  stabilityThreshold: 0.8,           // 稳定性阈值
  connectionThreshold: 0.3,          // 连接阈值
  isolationThreshold: 0.1,           // 孤立阈值
  clusterThreshold: 0.6,             // 集群阈值
  rebalanceThreshold: 0.5,           // 重平衡阈值
  maxConnectionsPerNode: 10,         // 每节点最大连接数
  minClusterSize: 3                  // 最小集群大小
};
```

### 协作配置

```javascript
const collaborationConfig = {
  maxConcurrentTasks: 20,            // 最大并发任务数
  convergenceThreshold: 0.95,        // 收敛阈值
  maxIterations: 100,                // 最大迭代次数
  taskTimeout: 30000,                // 任务超时(ms)
  consensusWeight: 0.4,              // 共识权重
  specializationWeight: 0.3,         // 专业化权重
  redundancyWeight: 0.2,             // 冗余权重
  explorationWeight: 0.1             // 探索权重
};
```

## 错误处理

```javascript
try {
  const agent = system.createAgent(config);
} catch (error) {
  if (error.message === 'Maximum agents limit reached') {
    console.log('Agent数量已达上限');
  }
}

// 监听错误事件
system.collaboration.on('task-failed', (event) => {
  console.error('任务失败:', event.taskId, event.error);
});
```

## 性能优化

1. **批量操作**: 使用批量API减少通信开销
2. **事件过滤**: 只监听需要的事件类型
3. **更新频率**: 根据需求调整组件更新间隔
4. **内存管理**: 定期清理过期数据
5. **连接限制**: 合理设置Agent连接数上限

## 最佳实践

1. **Agent设计**: 给Agent明确的能力和职责
2. **任务分解**: 将复杂任务分解为可管理的子任务
3. **资源监控**: 定期检查系统资源使用情况
4. **错误恢复**: 实现任务重试和错误恢复机制
5. **扩展性**: 使用模块化设计便于系统扩展", "original_text": "", "replace_all": false}]