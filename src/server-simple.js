import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入核心系统
import { CosmicAgent } from './core/Agent.js';
import { SemanticPerturbationMap, SPMScheduler } from './spm/index.js';
import { TensorCooperationField } from './tcf/index.js';
import { TopologyManager, TopologyRestructurer } from './topology/index.js';
import { CollaborationEngine } from './collaboration/index.js';
import { Task } from './core/Models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Cosmic Agent Network 服务器
 * 提供Web界面和API服务
 */
class CosmicAgentServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // 系统组件
    this.spm = new SemanticPerturbationMap();
    this.tcf = new TensorCooperationField();
    this.topology = new TopologyManager();
    this.collaboration = new CollaborationEngine();
    this.scheduler = new SPMScheduler(this.spm);
    this.restructurer = new TopologyRestructurer(this.topology);
    
    // 连接系统组件
    this.collaboration.connectSystems(this.spm, this.tcf, this.topology);
    
    // 数据存储
    this.agents = new Map();
    this.connectedClients = new Set();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.initializeSampleData();
    this.startSystemLoop();
  }
  
  setupMiddleware() {
    // 静态文件服务
    this.app.use(express.static(path.join(__dirname, '../web')));
    this.app.use(express.json());
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }
  
  setupRoutes() {
    // 主页
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../web', 'index.html'));
    });
    
    // API路由
    this.app.get('/api/status', (req, res) => {
      res.json(this.getSystemStatus());
    });
    
    this.app.get('/api/agents', (req, res) => {
      res.json(Array.from(this.agents.values()).map(agent => agent.getStatusSummary()));
    });
    
    this.app.post('/api/agents', (req, res) => {
      try {
        const agentConfig = req.body;
        const agent = this.createAgent(agentConfig);
        res.json({ success: true, agentId: agent.id });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });
    
    this.app.post('/api/tasks', (req, res) => {
      try {
        const taskData = req.body;
        const taskId = this.collaboration.submitTask(taskData);
        res.json({ success: true, taskId });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });
    
    this.app.get('/api/topology', (req, res) => {
      res.json(this.topology.getStatusSummary());
    });
    
    this.app.get('/api/tcf', (req, res) => {
      res.json(this.tcf.getStatusSummary());
    });
    
    this.app.get('/api/collaboration', (req, res) => {
      res.json(this.collaboration.getStatusSummary());
    });
  }
  
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 客户端连接: ${socket.id}`);
      this.connectedClients.add(socket);
      
      // 发送初始状态
      socket.emit('system-status', this.getSystemStatus());
      socket.emit('topology-update', this.getTopologyData());
      socket.emit('tcf-update', this.getTCFData());
      
      // 处理客户端消息
      socket.on('get-system-status', () => {
        socket.emit('system-status', this.getSystemStatus());
      });
      
      socket.on('create-task', (taskData) => {
        try {
          const taskId = this.collaboration.submitTask(taskData);
          socket.emit('task-created', { success: true, taskId });
          this.broadcastUpdate('task-update', { taskId, status: 'created' });
        } catch (error) {
          socket.emit('task-created', { success: false, error: error.message });
        }
      });
      
      socket.on('create-agent', (agentConfig) => {
        try {
          const agent = this.createAgent(agentConfig);
          socket.emit('agent-created', { success: true, agentId: agent.id });
          this.broadcastUpdate('agent-update', agent.getStatusSummary());
        } catch (error) {
          socket.emit('agent-created', { success: false, error: error.message });
        }
      });
      
      socket.on('disconnect', () => {
        console.log(`❌ 客户端断开: ${socket.id}`);
        this.connectedClients.delete(socket);
      });
    });
  }
  
  createAgent(config = {}) {
    const agent = new CosmicAgent({
      name: config.name || `Agent-${Date.now()}`,
      type: config.type || 'general',
      capabilities: config.capabilities || ['analysis'],
      position: config.position || {
        x: (Math.random() - 0.5) * 1000,
        y: (Math.random() - 0.5) * 1000,
        z: (Math.random() - 0.5) * 1000
      },
      ...config
    });
    
    this.agents.set(agent.id, agent);
    
    // 注册到系统组件
    this.spm.addAgent(agent);
    this.tcf.addAgent(agent);
    this.topology.addNode(agent);
    this.collaboration.registerAgent(agent);
    
    console.log(`🤖 创建Agent: ${agent.name} (${agent.id})`);
    return agent;
  }
  
  removeAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    
    // 从系统组件中移除
    this.spm.removeAgent(agentId);
    this.tcf.removeAgent(agentId);
    this.topology.removeNode(agentId);
    this.collaboration.unregisterAgent(agentId);
    
    this.agents.delete(agentId);
    
    console.log(`🗑️ 移除Agent: ${agentId}`);
    return true;
  }
  
  initializeSampleData() {
    console.log('🚀 初始化示例数据...');
    
    // 创建示例Agent
    const sampleAgents = [
      {
        name: 'DataAnalyzer-Alpha',
        type: 'analysis',
        capabilities: ['analysis', 'processing'],
        position: { x: -200, y: -100, z: 0 }
      },
      {
        name: 'ReasoningEngine-Beta',
        type: 'reasoning',
        capabilities: ['reasoning', 'logic'],
        position: { x: 200, y: -100, z: 0 }
      },
      {
        name: 'Coordinator-Gamma',
        type: 'coordination',
        capabilities: ['coordination', 'communication'],
        position: { x: 0, y: 100, z: 0 }
      }
    ];
    
    sampleAgents.forEach(config => {
      this.createAgent(config);
    });
    
    console.log('✅ 示例数据初始化完成');
  }
  
  startSystemLoop() {
    // 定期广播系统状态
    setInterval(() => {
      this.broadcastSystemStatus();
    }, 2000);
  }
  
  broadcastSystemStatus() {
    const status = this.getSystemStatus();
    this.broadcastUpdate('system-status', status);
  }
  
  broadcastUpdate(event, data) {
    this.connectedClients.forEach(socket => {
      socket.emit(event, data);
    });
  }
  
  getSystemStatus() {
    return {
      timestamp: Date.now(),
      agents: this.agents.size,
      connectedClients: this.connectedClients.size,
      metrics: {
        networkStability: 0.8,
        collaborationEfficiency: 0.7,
        totalTasksProcessed: 0,
        successfulCollaborations: 0
      }
    };
  }
  
  getTopologyData() {
    return {
      nodes: Array.from(this.agents.values()).map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        position: agent.position,
        energy: agent.energy,
        status: agent.status
      })),
      edges: [],
      summary: { nodes: this.agents.size, edges: 0 }
    };
  }
  
  getTCFData() {
    return {
      agents: Array.from(this.agents.values()),
      forceVectors: [],
      cooperationWaves: [],
      resonanceZones: [],
      singularityPoints: [],
      summary: { agents: this.agents.size }
    };
  }
  
  start(port = 8080) {
    this.server.listen(port, () => {
      console.log(`🌌 Cosmic Agent Network 服务器启动`);
      console.log(`📡 HTTP服务: http://localhost:${port}`);
      console.log(`🔌 WebSocket服务: ws://localhost:${port}`);
      console.log(`🎯 访问Web界面: http://localhost:${port}`);
    });
  }
  
  stop() {
    console.log('🛑 正在关闭服务器...');
    
    // 清理系统组件
    this.spm.destroy();
    this.tcf.destroy();
    this.topology.destroy();
    this.collaboration.destroy();
    
    this.server.close(() => {
      console.log('✅ 服务器已关闭');
    });
  }
}

// 创建并启动服务器
const server = new CosmicAgentServer();
server.start();

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n收到SIGINT信号，正在关闭服务器...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n收到SIGTERM信号，正在关闭服务器...');
  server.stop();
  process.exit(0);
});

export default CosmicAgentServer;