import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入核心系统
import { CosmicAgent } from './core/Agent.js';
import { Task } from './core/Models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Cosmic Agent Network 服务器 - 简化版本
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
    
    // 数据存储
    this.agents = new Map();
    this.tasks = new Map();
    this.connectedClients = new Set();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.initializeSampleData();
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
        const taskId = this.submitTask(taskData);
        res.json({ success: true, taskId });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });
    
    this.app.get('/api/tasks', (req, res) => {
      res.json(Array.from(this.tasks.values()));
    });
  }
  
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 客户端连接: ${socket.id}`);
      this.connectedClients.add(socket);
      
      // 发送初始状态
      socket.emit('system-status', this.getSystemStatus());
      
      socket.on('get-system-status', () => {
        socket.emit('system-status', this.getSystemStatus());
      });
      
      socket.on('create-task', (taskData) => {
        try {
          const taskId = this.submitTask(taskData);
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
    console.log(`🤖 创建Agent: ${agent.name} (${agent.id})`);
    return agent;
  }
  
  submitTask(taskData) {
    const task = new Task({
      type: taskData.type || 'general',
      description: taskData.description || 'No description',
      priority: taskData.priority || 1,
      complexity: taskData.complexity || 10,
      requiredCapabilities: taskData.requiredCapabilities || [],
      collaborationType: taskData.collaborationType || 'sequential',
      ...taskData
    });
    
    this.tasks.set(task.id, {
      task: task,
      status: 'pending',
      createdAt: Date.now(),
      assignedAgents: [],
      results: []
    });
    
    // 简单的任务分配逻辑
    this.assignTaskToAgent(task.id);
    
    return task.id;
  }
  
  assignTaskToAgent(taskId) {
    const taskInfo = this.tasks.get(taskId);
    if (!taskInfo) return;
    
    // 找到第一个可用的Agent
    const availableAgent = Array.from(this.agents.values())
      .find(agent => agent.status === 'idle');
    
    if (availableAgent) {
      taskInfo.status = 'assigned';
      taskInfo.assignedAgents.push(availableAgent.id);
      
      // 异步执行任务
      availableAgent.processTask(taskInfo.task)
        .then(result => {
          taskInfo.status = 'completed';
          taskInfo.results.push(result);
          taskInfo.completedAt = Date.now();
          
          this.broadcastUpdate('task-completed', {
            taskId: taskId,
            result: result,
            agentId: availableAgent.id
          });
        })
        .catch(error => {
          taskInfo.status = 'failed';
          taskInfo.error = error.message;
          taskInfo.failedAt = Date.now();
          
          this.broadcastUpdate('task-failed', {
            taskId: taskId,
            error: error.message,
            agentId: availableAgent.id
          });
        });
    }
  }
  
  initializeSampleData() {
    console.log('🚀 初始化示例数据...');
    
    // 创建示例Agent
    this.createAgent({
      name: 'Alpha Agent',
      type: 'analyzer',
      capabilities: ['analysis', 'reasoning'],
      position: { x: 100, y: 100, z: 100 }
    });
    
    this.createAgent({
      name: 'Beta Agent',
      type: 'processor',
      capabilities: ['processing', 'calculation'],
      position: { x: -100, y: 100, z: -100 }
    });
    
    this.createAgent({
      name: 'Gamma Agent',
      type: 'synthesizer',
      capabilities: ['synthesis', 'integration'],
      position: { x: 0, y: -100, z: 0 }
    });
    
    console.log(`✅ 创建了 ${this.agents.size} 个示例Agent`);
  }
  
  getSystemStatus() {
    return {
      timestamp: Date.now(),
      agentCount: this.agents.size,
      taskCount: this.tasks.size,
      connectedClients: this.connectedClients.size,
      agents: Array.from(this.agents.values()).map(agent => agent.getStatusSummary()),
      tasks: Array.from(this.tasks.values()),
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
  }
  
  broadcastUpdate(event, data) {
    this.io.emit(event, data);
  }
  
  async start(port = 8080) {
    return new Promise((resolve) => {
      this.server.listen(port, () => {
        console.log(`🌌 Cosmic Agent Network 服务器启动于端口 ${port}`);
        console.log(`📱 Web界面: http://localhost:${port}`);
        console.log(`🔗 WebSocket: ws://localhost:${port}`);
        resolve();
      });
    });
  }
  
  async stop() {
    console.log('🛑 正在关闭服务器...');
    
    // 清理资源
    for (const agent of this.agents.values()) {
      // 清理Agent资源
    }
    
    this.server.close();
    console.log('✅ 服务器已关闭');
  }
}

// 启动服务器
const server = new CosmicAgentServer();
server.start(8080).catch(console.error);

// 优雅退出
process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});

export default CosmicAgentServer;