import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import real AI systems
import { AIAgent } from './core/AIAgent.js';
import { ProfSmootAgent } from './core/ProfSmootAgent.js';
import { RealAICollaborationEngine } from './collaboration/RealAICollaborationEngine.js';
import { Task } from './core/Models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Real AI Cosmic Agent Network Server
 * Integrates actual AI agents with LLM capabilities
 */
class RealAICosmicServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      // Connection limits and stability improvements
      maxHttpBufferSize: 1e8, // 100 MB
      transports: ["websocket", "polling"], // Try websocket first, then polling
      allowEIO3: true,
      pingTimeout: 60000, // Increase ping timeout to 60 seconds
      pingInterval: 25000, // Ping interval of 25 seconds
      upgradeTimeout: 30000, // 30 seconds for upgrade
      // Add transport stability options
      allowUpgrades: true, // Enable upgrades for better connection stability
      cookie: false, // Disable cookie to avoid issues
      // Add connection stability options
      perMessageDeflate: false, // Disable per-message deflate to reduce complexity
      httpCompression: false,   // Disable HTTP compression
      // Additional stability options
      serveClient: false, // Don't serve client files
      path: "/socket.io"  // Explicit path
    });
    
    // Connection management
    this.maxConnections = 100;
    this.currentConnections = 0;
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables');
      console.warn('   Real AI features will be limited. Please set your OpenAI API key.');
    }
    
    // Real AI Collaboration Engine
    this.aiCollaboration = new RealAICollaborationEngine({
      openaiApiKey: process.env.OPENAI_API_KEY
    });
    
    // Listen for task chain events and forward them to clients
    this.aiCollaboration.on('task-chain-execution-step', (data) => {
      console.log('📡 Broadcasting task chain execution step:', data);
      this.broadcastUpdate('task-chain-execution-step', data);
      
      // Store execution steps for completed task chains
      if (!this.taskChainSteps) {
        this.taskChainSteps = new Map();
      }
      
      if (!this.taskChainSteps.has(data.taskChainId)) {
        this.taskChainSteps.set(data.taskChainId, []);
      }
      
      this.taskChainSteps.get(data.taskChainId).push(data);
    });
    
    this.aiCollaboration.on('task-chain-completed', (data) => {
      console.log('📡 Broadcasting task chain completed:', data);
      
      // Add execution steps to the completed task chain data
      if (this.taskChainSteps && this.taskChainSteps.has(data.chainId)) {
        data.executionSteps = this.taskChainSteps.get(data.chainId);
      }
      
      this.broadcastUpdate('task-chain-completed', data);
      
      // Clean up stored steps for this task chain
      if (this.taskChainSteps) {
        this.taskChainSteps.delete(data.chainId);
      }
    });
    
    this.aiCollaboration.on('task-chain-failed', (data) => {
      console.log('📡 Broadcasting task chain failed:', data);
      this.broadcastUpdate('task-chain-failed', data);
      
      // Clean up stored steps for this task chain
      if (this.taskChainSteps) {
        this.taskChainSteps.delete(data.chainId);
      }
    });
    
    // Additional event forwarding for enhanced task chain visualization
    this.aiCollaboration.on('collaboration-completed', (data) => {
      console.log('📡 Broadcasting collaboration completed:', data);
      this.broadcastUpdate('collaboration-completed', data);
    });
    
    // Listen for Prof. Smoot's task allocation events
    this.aiCollaboration.on('task-allocation-by-prof-smoot', (data) => {
      console.log('🎯 Prof. Smoot Task Allocation:', data);
      this.broadcastUpdate('prof-smoot-allocation', data);
    });
    
    this.aiCollaboration.on('task-allocation-by-fallback', (data) => {
      console.log('🔄 Fallback Task Allocation:', data);
      this.broadcastUpdate('fallback-allocation', data);
    });
    
    // Data storage
    this.connectedClients = new Set();
    this.taskHistory = [];
    this.collaborationHistory = [];
    this.processingTasks = new Set(); // Add this line to track processing tasks
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.initializeAIAgents();
  }
  
  setupMiddleware() {
    this.app.use(express.static(path.join(__dirname, '../web')));
    this.app.use(express.json());
    
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }
  
  setupRoutes() {
    // Main interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../web', 'index.html'));
    });
    
    // Real AI API endpoints
    this.app.get('/api/ai-status', (req, res) => {
      res.json(this.getAISystemStatus());
    });
    
    this.app.get('/api/ai-agents', (req, res) => {
      const collaborationStatus = this.aiCollaboration.getCollaborationStatus();
      res.json(collaborationStatus.aiAgents);
    });
    
    this.app.post('/api/ai-agents', async (req, res) => {
      try {
        const agentConfig = req.body;
        const aiAgent = await this.aiCollaboration.createAIAgent(agentConfig);
        res.json({ 
          success: true, 
          agentId: aiAgent.id,
          agent: aiAgent.getAIStatusSummary()
        });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
    
    this.app.post('/api/ai-collaborate', async (req, res) => {
      try {
        const taskData = req.body;
        
        // Generate a unique ID for the task if not provided
        if (!taskData.id) {
          taskData.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Check if we're already processing this task
        if (this.processingTasks && this.processingTasks.has(taskData.id)) {
          console.log(`⚠️ Task ${taskData.id} is already being processed, ignoring duplicate request`);
          return res.status(409).json({ 
            success: false, 
            error: 'Task is already being processed' 
          });
        }
        
        // Mark task as being processed
        if (!this.processingTasks) {
          this.processingTasks = new Set();
        }
        this.processingTasks.add(taskData.id);
        
        console.log('\\n🚀 Received AI collaboration request:', taskData.description);
        
        const result = await this.aiCollaboration.submitCollaborativeTask(taskData);
        
        this.taskHistory.push({
          task: taskData,
          result: result,
          timestamp: Date.now()
        });
        
        // Broadcast result to connected clients
        this.broadcastUpdate('ai-collaboration-completed', result);
        
        // Remove task from processing set
        this.processingTasks.delete(taskData.id);
        
        res.json({ 
          success: true, 
          result: result 
        });
        
      } catch (error) {
        console.error('❌ AI collaboration failed:', error);
        
        // Remove task from processing set even on error
        if (this.processingTasks && req.body.id) {
          this.processingTasks.delete(req.body.id);
        }
        
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
    
    this.app.get('/api/collaborations', (req, res) => {
      res.json(this.aiCollaboration.getCollaborationStatus().recentSessions);
    });
    
    this.app.get('/api/task-history', (req, res) => {
      res.json(this.taskHistory.slice(-10)); // Last 10 tasks
    });
  }
  
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      // Check connection limits
      if (this.currentConnections >= this.maxConnections) {
        console.log(`⚠️  Connection limit reached (${this.maxConnections}), rejecting new connection`);
        socket.emit('error', { message: 'Server connection limit reached' });
        socket.disconnect(true);
        return;
      }
      
      // Check if socket is already connected
      if (!socket.connected) {
        console.log(`⚠️  Socket ${socket.id} is not connected, skipping setup`);
        return;
      }
      
      this.currentConnections++;
      console.log(`🔗 Client connected: ${socket.id} (Total: ${this.currentConnections})`);
      this.connectedClients.add(socket);
      
      // Set up heartbeat to maintain connection
      let heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
        } else {
          // Clean up if socket is no longer connected
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          this.currentConnections--;
          console.log(`🧹 Cleaned up disconnected client: ${socket.id} (Total: ${this.currentConnections})`);
          this.connectedClients.delete(socket);
        }
      }, 20000); // Send ping every 20 seconds
      
      // Send initial AI status
      socket.emit('ai-system-status', this.getAISystemStatus());
      
      socket.on('get-ai-status', () => {
        socket.emit('ai-system-status', this.getAISystemStatus());
      });
      
      socket.on('create-ai-agent', async (agentConfig) => {
        try {
          const aiAgent = await this.aiCollaboration.createAIAgent(agentConfig);
          socket.emit('ai-agent-created', { 
            success: true, 
            agent: aiAgent.getAIStatusSummary()
          });
          this.broadcastUpdate('ai-agent-update', aiAgent.getAIStatusSummary());
        } catch (error) {
          socket.emit('ai-agent-created', { 
            success: false, 
            error: error.message 
          });
        }
      });
      
      socket.on('submit-ai-task', async (taskData) => {
        try {
          // Generate a unique ID for the task if not provided
          if (!taskData.id) {
            taskData.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          }
          
          // Check if we're already processing this task
          if (this.processingTasks && this.processingTasks.has(taskData.id)) {
            console.log(`⚠️ Task ${taskData.id} is already being processed, ignoring duplicate request`);
            socket.emit('ai-task-completed', { 
              success: false, 
              error: 'Task is already being processed' 
            });
            return;
          }
          
          // Mark task as being processed
          if (!this.processingTasks) {
            this.processingTasks = new Set();
          }
          this.processingTasks.add(taskData.id);
          
          console.log(`\n🎯 WebSocket AI task received: ${taskData.description}`);
          
          // Acknowledge task receipt immediately
          socket.emit('ai-task-acknowledged', { 
            taskId: taskData.id,
            message: 'Task received and processing started'
          });
          
          // Process the task asynchronously and send result back to the specific client
          this.aiCollaboration.submitCollaborativeTask(taskData)
            .then(result => {
              // Ensure we're sending a proper response
              const response = {
                success: true, 
                result: result,
                taskId: taskData.id
              };
              
              // Send completion notification to the specific client
              if (socket.connected) {
                socket.emit('ai-task-completed', response);
                console.log(`✅ Task ${taskData.id} completed and result sent to client ${socket.id}`);
              } else {
                console.log(`⚠️ Client ${socket.id} disconnected before task completion`);
              }
              
              // Broadcast update to all clients
              this.broadcastUpdate('ai-collaboration-update', result);
              
              // Remove task from processing set
              if (this.processingTasks) {
                this.processingTasks.delete(taskData.id);
              }
              
              // Add to task history
              this.taskHistory.push({
                task: taskData,
                result: result,
                timestamp: Date.now()
              });
            })
            .catch(error => {
              console.error('❌ WebSocket AI task failed:', error);
              
              // Ensure we're sending a proper error response
              const errorResponse = {
                success: false, 
                error: error.message || 'Unknown error occurred',
                taskId: taskData.id
              };
              
              // Send error notification to the specific client
              if (socket.connected) {
                socket.emit('ai-task-completed', errorResponse);
                console.log(`❌ Task ${taskData.id} failed and error sent to client ${socket.id}`);
              } else {
                console.log(`⚠️ Client ${socket.id} disconnected before task error notification`);
              }
              
              // Remove task from processing set even on error
              if (this.processingTasks) {
                this.processingTasks.delete(taskData.id);
              }
            });
          
        } catch (error) {
          console.error('❌ WebSocket AI task failed:', error);
          
          // Remove task from processing set even on error
          if (this.processingTasks && taskData.id) {
            this.processingTasks.delete(taskData.id);
          }
          
          // Send error notification to the specific client
          const errorResponse = {
            success: false, 
            error: error.message || 'Unknown error occurred',
            taskId: taskData.id
          };
          
          if (socket.connected) {
            socket.emit('ai-task-completed', errorResponse);
            console.log(`❌ Task ${taskData.id} failed and error sent to client ${socket.id}`);
          } else {
            console.log(`⚠️ Client ${socket.id} disconnected before task error notification`);
          }
        }
      });
      
      socket.on('disconnect', (reason) => {
        // Clear heartbeat interval
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        
        this.currentConnections--;
        console.log(`❌ Client disconnected: ${socket.id} (Total: ${this.currentConnections}) Reason: ${reason}`);
        
        // Special handling for transport errors
        if (reason === 'transport error' || reason === 'transport close') {
          console.log(`⚠️  Transport issue detected for client ${socket.id}. This can happen due to network instability or client-side issues.`);
        }
        
        this.connectedClients.delete(socket);
        
        // Log additional information for debugging
        console.log(`📊 Current connection stats - Total: ${this.currentConnections}, Max: ${this.maxConnections}`);
      });
      
      // Handle connection errors
      socket.on('error', (error) => {
        console.log(`❌ Socket error for client ${socket.id}:`, error);
      });
      
      // Handle pong responses
      socket.on('pong', () => {
        console.log(`🏓 Received pong from client ${socket.id}`);
      });
    });
  }
  
  async initializeAIAgents() {
    console.log('\\n🧠 Initializing Real AI Agent Network...');
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  Skipping AI agent creation - no OpenAI API key');
      return;
    }
    
    try {
      // First create Prof. Smoot as the specialized task allocation expert
      try {
        const profSmoot = new ProfSmootAgent({
          openaiApiKey: process.env.OPENAI_API_KEY
        });
        this.aiCollaboration.aiAgents.set(profSmoot.id, profSmoot);
        console.log(`🧠 Created AI Agent: ${profSmoot.name} (${profSmoot.type})`);
        console.log(`   Capabilities: ${profSmoot.capabilities.join(', ')}`);
        console.log(`   Personality: ${profSmoot.personality.traits.join(', ')}`);
        console.log(`   🏆 Nobel Prize Winner: ${profSmoot.nobelPrize.year} - ${profSmoot.nobelPrize.work}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to create Prof. Smoot:`, error.message);
      }
      
      // Create a diverse set of AI agents
      const agentConfigs = [
        {
          name: 'Dr. Analyzer',
          type: 'analyzer',
          capabilities: ['deep_analysis', 'pattern_recognition', 'data_interpretation'],
          personality: ['analytical', 'detail-oriented', 'systematic', 'curious'],
          expertise: ['data_science', 'research_methodology', 'statistical_analysis'],
          systemPrompt: 'You are Dr. Analyzer, an expert in deep data analysis and pattern recognition. You excel at finding hidden insights and identifying key patterns in complex information.',
          position: { x: 0, y: 0, z: 0 },
          mass: 2.0
        },
        {
          name: 'Prof. Reasoner',
          type: 'reasoner',
          capabilities: ['logical_reasoning', 'inference', 'causal_analysis'],
          personality: ['logical', 'methodical', 'rational', 'precise'],
          expertise: ['formal_logic', 'philosophy', 'mathematical_reasoning'],
          systemPrompt: 'You are Prof. Reasoner, a master of logical thinking and causal analysis. You build robust reasoning chains and identify logical connections between concepts.',
          position: { x: 300, y: 200, z: 100 },
          mass: 1.8
        },
        {
          name: 'Ms. Synthesizer',
          type: 'synthesizer',
          capabilities: ['information_synthesis', 'knowledge_integration', 'holistic_thinking'],
          personality: ['creative', 'integrative', 'holistic', 'adaptive'],
          expertise: ['systems_thinking', 'knowledge_management', 'interdisciplinary_research'],
          systemPrompt: 'You are Ms. Synthesizer, an expert at combining diverse information sources into coherent wholes. You excel at seeing the big picture and creating unified understanding.',
          position: { x: -200, y: 300, z: -150 },
          mass: 1.9
        },
        {
          name: 'Dr. Validator',
          type: 'validator',
          capabilities: ['result_validation', 'quality_assessment', 'error_detection'],
          personality: ['critical', 'thorough', 'careful', 'reliable'],
          expertise: ['quality_assurance', 'peer_review', 'verification_methods'],
          systemPrompt: 'You are Dr. Validator, a meticulous expert in quality assurance and validation. You ensure accuracy, identify potential issues, and verify the reliability of conclusions.',
          position: { x: 150, y: -250, z: 200 },
          mass: 1.5
        },
        {
          name: 'Mx. Innovator',
          type: 'innovator',
          capabilities: ['creative_thinking', 'solution_generation', 'breakthrough_insights'],
          personality: ['creative', 'bold', 'experimental', 'visionary'],
          expertise: ['innovation_methods', 'creative_problem_solving', 'future_thinking'],
          systemPrompt: 'You are Mx. Innovator, a creative genius who thinks outside the box. You generate novel solutions, explore unconventional approaches, and push the boundaries of possibility.',
          position: { x: -300, y: -100, z: 250 },
          mass: 1.7
        }
      ];
      
      // Create AI agents
      for (const config of agentConfigs) {
        try {
          await this.aiCollaboration.createAIAgent(config);
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to create ${config.name}:`, error.message);
        }
      }
      
      const status = this.aiCollaboration.getCollaborationStatus();
      console.log(`\\n✅ Created ${status.totalAIAgents} AI agents successfully!`);
    
    } catch (error) {
      console.error('❌ Failed to initialize AI agents:', error);
    }
  }
  
  async runDemonstrationCollaboration() {
    console.log('\\n🎭 Running AI Collaboration Demonstration...');
    
    try {
      const demoTask = {
        type: 'complex_analysis',
        description: 'Analyze the potential impact of artificial intelligence on future society, considering technological, economic, ethical, and social dimensions.',
        priority: 5,
        complexity: 90,
        requiredCapabilities: ['deep_analysis', 'logical_reasoning', 'information_synthesis', 'result_validation', 'creative_thinking']
      };
      
      const result = await this.aiCollaboration.submitCollaborativeTask(demoTask);
      
      console.log('\\n🎉 Demonstration Collaboration Completed!');
      console.log('Final Result Preview:', result.finalResult.substring(0, 200) + '...');
      
      // Broadcast to clients
      this.broadcastUpdate('demo-collaboration-completed', result);
      
    } catch (error) {
      console.error('❌ Demonstration collaboration failed:', error.message);
    }
  }
  
  getAISystemStatus() {
    const collaborationStatus = this.aiCollaboration.getCollaborationStatus();
    
    return {
      timestamp: Date.now(),
      openaiApiKey: !!process.env.OPENAI_API_KEY,
      totalAIAgents: collaborationStatus.totalAIAgents,
      activeCollaborations: collaborationStatus.activeCollaborations,
      totalCollaborations: collaborationStatus.totalCollaborations,
      connectedClients: this.connectedClients.size,
      aiAgents: collaborationStatus.aiAgents,
      recentTasks: this.taskHistory.slice(-5),
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
            this.server.listen(port, '0.0.0.0', () => {  // Changed from default to explicit 0.0.0.0
                console.log(`\n🌌 Real AI Cosmic Agent Network Server started on port ${port}`);
                console.log(`📱 Web Interface: http://localhost:${port}`);
                console.log(`🔗 WebSocket: ws://localhost:${port}`);
                console.log(`🧠 AI Engine: ${process.env.OPENAI_API_KEY ? 'Active' : 'Inactive (no API key)'}`);
                resolve();
            });
        });
    }
  
  async stop() {
    console.log('\\n🛑 Shutting down Real AI server...');
    
    this.aiCollaboration.destroy();
    this.server.close();
    
    console.log('✅ Server shutdown complete');
  }
}

// Start the server
const server = new RealAICosmicServer();
server.start(8080).catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});

export default RealAICosmicServer;