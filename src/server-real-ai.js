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
    // Only create server and socket.io if not in Vercel environment
    if (!process.env.VERCEL) {
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
    }
    
    // SSE clients
    this.sseClients = new Set();
    
    // Connection management
    this.maxConnections = 100;
    this.currentConnections = 0;
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables');
      console.warn('   Real AI features will be limited. Please set your OpenAI API key.');
    }
    
    // Real AI Collaboration Engine
    console.log('[SERVER] Creating RealAICollaborationEngine');
    this.aiCollaboration = new RealAICollaborationEngine({
      openaiApiKey: process.env.OPENAI_API_KEY
    });
    console.log('[SERVER] RealAICollaborationEngine created');
    
    // Listen for task chain events and forward them to clients
    this.aiCollaboration.on('task-chain-execution-step', (data) => {
      console.log('📡 Broadcasting task chain execution step:', data);
      if (this.broadcastUpdate) this.broadcastUpdate('task-chain-execution-step', data);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('task-chain-execution-step', data);
      
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
      
      if (this.broadcastUpdate) this.broadcastUpdate('task-chain-completed', data);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('task-chain-completed', data);
      
      // Clean up stored steps for this task chain
      if (this.taskChainSteps) {
        this.taskChainSteps.delete(data.chainId);
      }
    });
    
    this.aiCollaboration.on('task-chain-failed', (data) => {
      console.log('📡 Broadcasting task chain failed:', data);
      if (this.broadcastUpdate) this.broadcastUpdate('task-chain-failed', data);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('task-chain-failed', data);
      
      // Clean up stored steps for this task chain
      if (this.taskChainSteps) {
        this.taskChainSteps.delete(data.chainId);
      }
    });
    
    // Additional event forwarding for enhanced task chain visualization
    this.aiCollaboration.on('collaboration-completed', (data) => {
      console.log('📡 Broadcasting collaboration completed:', data);
      if (this.broadcastUpdate) this.broadcastUpdate('collaboration-completed', data);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('collaboration-completed', data);
    });
    
    // Listen for Prof. Smoot's task allocation events
    this.aiCollaboration.on('task-allocation-by-prof-smoot', (data) => {
      console.log('🎯 Prof. Smoot Task Allocation:', data);
      if (this.broadcastUpdate) this.broadcastUpdate('prof-smoot-allocation', data);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('prof-smoot-allocation', data);
    });
    
    this.aiCollaboration.on('task-allocation-by-fallback', (data) => {
      console.log('🔄 Fallback Task Allocation:', data);
      if (this.broadcastUpdate) this.broadcastUpdate('fallback-allocation', data);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('fallback-allocation', data);
    });
    
    // Data storage
    this.connectedClients = new Set();
    this.taskHistory = [];
    this.collaborationHistory = [];
    this.processingTasks = new Set(); // Add this line to track processing tasks
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSSERoutes();
    
    // Only setup socket handlers if not in Vercel environment
    if (!process.env.VERCEL && this.io) {
      this.setupSocketHandlers();
    }
    
    // Initialize AI agents with a promise to track completion
    console.log('[SERVER] Starting agent initialization');
    this.agentInitializationPromise = this.initializeAIAgentsAsync();
    console.log('[SERVER] Agent initialization started');
  }
  
  // Asynchronous version of agent initialization that returns a promise
  async initializeAIAgentsAsync() {
    try {
      console.log('[INIT] Starting agent initialization async function');
      // Initialize AI agents with optimizations for Vercel
      // Use a delayed initialization to avoid cold start issues
      if (process.env.VERCEL) {
        console.log('[INIT] Vercel environment detected, waiting 1 second before initialization');
        // In Vercel, delay initialization to allow for faster cold starts
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('[INIT] Delay completed, starting agent initialization');
      }
      await this.initializeAIAgents();
      console.log('✅ Agent initialization completed');
    } catch (error) {
      console.error('❌ Agent initialization failed:', error);
      console.error('Stack trace:', error.stack);
    }
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
    console.log('[SERVER] Setting up routes');
    
    // Main interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../web', 'index.html'));
    });
    
    // Real AI API endpoints
    this.app.get('/api/ai-status', async (req, res) => {
      console.log('[API] /api/ai-status called');
      // Wait for agent initialization in Vercel environment
      if (process.env.VERCEL && this.agentInitializationPromise) {
        console.log('[API] Waiting for agent initialization to complete');
        await this.agentInitializationPromise;
        console.log('[API] Agent initialization completed, continuing with request');
      }
      res.json(this.getAISystemStatus());
    });
    
    this.app.get('/api/ai-agents', async (req, res) => {
      console.log('[API] /api/ai-agents called');
      // Wait for agent initialization in Vercel environment
      if (process.env.VERCEL && this.agentInitializationPromise) {
        console.log('[API] Waiting for agent initialization to complete');
        await this.agentInitializationPromise;
        console.log('[API] Agent initialization completed, continuing with request');
      }
      const collaborationStatus = this.aiCollaboration.getCollaborationStatus();
      res.json(collaborationStatus.aiAgents);
    });
    
    // Manual initialization endpoint for debugging
    this.app.post('/api/init-agents', async (req, res) => {
      console.log('[API] /api/init-agents called');
      try {
        await this.initializeAIAgents();
        res.json({ success: true, message: 'Agents initialized' });
      } catch (error) {
        console.error('Agent initialization failed:', error);
        res.status(500).json({ success: false, error: error.message });
      }
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
        // Wait for agent initialization in Vercel environment
        if (process.env.VERCEL && this.agentInitializationPromise) {
          await this.agentInitializationPromise;
        }
        
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
        
        console.log('\n🚀 Received AI collaboration request:', taskData.description);
        
        const result = await this.aiCollaboration.submitCollaborativeTask(taskData);
        
        this.taskHistory.push({
          task: taskData,
          result: result,
          timestamp: Date.now()
        });
        
        // Broadcast result to connected clients
        if (this.broadcastUpdate) this.broadcastUpdate('ai-collaboration-completed', result);
        
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
    
    this.app.post('/api/message', async (req, res) => {
      // Wait for agent initialization in Vercel environment
      if (process.env.VERCEL && this.agentInitializationPromise) {
        await this.agentInitializationPromise;
      }
      
      // Handle messages sent from SSE clients via HTTP POST
      const { type, payload } = req.body;
      
      // Process the message based on type
      switch (type) {
        case 'get-ai-status':
          // Send AI status to all SSE clients
          if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-system-status', this.getAISystemStatus());
          break;
        case 'submit-ai-task':
          // Handle task submission
          this.handleTaskSubmission(payload);
          break;
        case 'create-ai-agent':
          // Handle agent creation
          this.handleAgentCreation(payload);
          break;
        default:
          console.log(`📥 Received message via HTTP POST: ${type}`);
      }
      
      res.status(200).json({ success: true });
    });
    
    this.app.get('/api/collaborations', async (req, res) => {
      // Wait for agent initialization in Vercel environment
      if (process.env.VERCEL && this.agentInitializationPromise) {
        await this.agentInitializationPromise;
      }
      res.json(this.aiCollaboration.getCollaborationStatus().recentSessions);
    });
    
    this.app.get('/api/task-history', async (req, res) => {
      // Wait for agent initialization in Vercel environment
      if (process.env.VERCEL && this.agentInitializationPromise) {
        await this.agentInitializationPromise;
      }
      res.json(this.taskHistory.slice(-10)); // Last 10 tasks
    });
  }
  
  setupSSERoutes() {
    console.log('[SERVER] Setting up SSE routes');
    
    // SSE endpoint
    this.app.get('/sse', async (req, res) => {
      console.log('[SSE] /sse endpoint called');
      
      // Wait for agent initialization in Vercel environment
      if (process.env.VERCEL && this.agentInitializationPromise) {
        console.log('[SSE] Waiting for agent initialization to complete');
        await this.agentInitializationPromise;
        console.log('[SSE] Agent initialization completed, continuing with request');
      }
      
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      
      // Send initial connection message
      res.write(`data: ${JSON.stringify({ event: 'connected', data: { message: 'SSE connection established' } })}\n\n`);
      
      // Send initial AI status
      const aiStatus = this.getAISystemStatus();
      res.write(`event: ai-system-status\ndata: ${JSON.stringify(aiStatus)}\n\n`);
      
      // Add client to the set
      this.sseClients.add(res);
      
      // Handle client disconnect
      req.on('close', () => {
        this.sseClients.delete(res);
        console.log('🧹 SSE client disconnected');
      });
      
      // Handle errors
      req.on('error', (err) => {
        // Only log as warning if it's a connection reset (normal when clients disconnect)
        if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
          console.log('ℹ️  SSE client disconnected (normal connection close)');
        } else {
          console.error('❌ SSE connection error:', err);
        }
        this.sseClients.delete(res);
      });
    });
  }
  
  setupSocketHandlers() {
    if (!this.io) return;
    
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
          if (this.broadcastUpdate) this.broadcastUpdate('ai-agent-update', aiAgent.getAIStatusSummary());
          if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-agent-update', aiAgent.getAIStatusSummary());
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
              if (this.broadcastUpdate) this.broadcastUpdate('ai-collaboration-update', result);
              if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-collaboration-update', result);
              
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
    console.log('\n🧠 Initializing Real AI Agent Network...');
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  Skipping AI agent creation - no OpenAI API key');
      return;
    }
    
    console.log(`🔑 OpenAI API Key present: ${!!process.env.OPENAI_API_KEY}`);
    
    try {
      // First create Prof. Smoot as the specialized task allocation expert
      try {
        console.log('Creating Prof. Smoot agent...');
        const profSmoot = new ProfSmootAgent({
          openaiApiKey: process.env.OPENAI_API_KEY
        });
        this.aiCollaboration.aiAgents.set(profSmoot.id, profSmoot);
        console.log(`🧠 Created AI Agent: ${profSmoot.name} (${profSmoot.type})`);
        console.log(`   Capabilities: ${profSmoot.capabilities.join(', ')}`);
        console.log(`   Personality: ${profSmoot.personality.traits.join(', ')}`);
        console.log(`   🏆 Nobel Prize Winner: ${profSmoot.nobelPrize.year} - ${profSmoot.nobelPrize.work}`);
        
        // Very small delay to avoid rate limiting, shorter for Vercel
        await new Promise(resolve => setTimeout(resolve, process.env.VERCEL ? 10 : 100));
      } catch (error) {
        console.error(`Failed to create Prof. Smoot:`, error.message);
        console.error('Stack trace:', error.stack);
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
      
      console.log(`Creating ${agentConfigs.length} additional AI agents...`);
      
      // Create AI agents with optimized delays for Vercel
      for (const [index, config] of agentConfigs.entries()) {
        try {
          console.log(`Creating agent ${index + 1}/${agentConfigs.length}: ${config.name}...`);
          await this.aiCollaboration.createAIAgent(config);
          console.log(`✅ Successfully created ${config.name}`);
          // Very small delay to avoid rate limiting, shorter for Vercel
          await new Promise(resolve => setTimeout(resolve, process.env.VERCEL ? 10 : 100));
        } catch (error) {
          console.error(`Failed to create ${config.name}:`, error.message);
          console.error('Stack trace:', error.stack);
        }
      }
      
      const status = this.aiCollaboration.getCollaborationStatus();
      console.log(`\n✅ Created ${status.totalAIAgents} AI agents successfully!`);
    
    } catch (error) {
      console.error('❌ Failed to initialize AI agents:', error);
      console.error('Stack trace:', error.stack);
    }
  }
  
  async handleTaskSubmission(taskData) {
    try {
      // Generate a unique ID for the task if not provided
      if (!taskData.id) {
        taskData.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Check if we're already processing this task
      if (this.processingTasks && this.processingTasks.has(taskData.id)) {
        console.log(`⚠️ Task ${taskData.id} is already being processed, ignoring duplicate request`);
        if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-task-completed', { 
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
      
      console.log(`\n🎯 SSE AI task received: ${taskData.description}`);
      
      // Acknowledge task receipt immediately
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-task-acknowledged', { 
        taskId: taskData.id,
        message: 'Task received and processing started'
      });
      
      // Process the task asynchronously
      this.aiCollaboration.submitCollaborativeTask(taskData)
        .then(result => {
          // Ensure we're sending a proper response
          const response = {
            success: true, 
            result: result,
            taskId: taskData.id
          };
          
          // Broadcast completion notification to all SSE clients
          if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-task-completed', response);
          console.log(`✅ Task ${taskData.id} completed and result sent to SSE clients`);
          
          // Broadcast update to all clients
          if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-collaboration-update', result);
          
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
          console.error('❌ SSE AI task failed:', error);
          
          // Ensure we're sending a proper error response
          const errorResponse = {
            success: false, 
            error: error.message || 'Unknown error occurred',
            taskId: taskData.id
          };
          
          // Broadcast error notification to all SSE clients
          if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-task-completed', errorResponse);
          console.log(`❌ Task ${taskData.id} failed and error sent to SSE clients`);
          
          // Remove task from processing set even on error
          if (this.processingTasks) {
            this.processingTasks.delete(taskData.id);
          }
        });
      
    } catch (error) {
      console.error('❌ SSE AI task failed:', error);
      
      // Remove task from processing set even on error
      if (this.processingTasks && taskData.id) {
        this.processingTasks.delete(taskData.id);
      }
      
      // Send error notification to all SSE clients
      const errorResponse = {
        success: false, 
        error: error.message || 'Unknown error occurred',
        taskId: taskData.id
      };
      
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-task-completed', errorResponse);
      console.log(`❌ Task ${taskData.id} failed and error sent to SSE clients`);
    }
  }
  
  async handleAgentCreation(agentConfig) {
    try {
      const aiAgent = await this.aiCollaboration.createAIAgent(agentConfig);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-agent-created', { 
        success: true, 
        agent: aiAgent.getAIStatusSummary()
      });
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-agent-update', aiAgent.getAIStatusSummary());
    } catch (error) {
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-agent-created', { 
        success: false, 
        error: error.message 
      });
    }
  }
  
  async runDemonstrationCollaboration() {
    console.log('\n🎭 Running AI Collaboration Demonstration...');
    
    try {
      const demoTask = {
        type: 'complex_analysis',
        description: 'Analyze the potential impact of artificial intelligence on future society, considering technological, economic, ethical, and social dimensions.',
        priority: 5,
        complexity: 90,
        requiredCapabilities: ['deep_analysis', 'logical_reasoning', 'information_synthesis', 'result_validation', 'creative_thinking']
      };
      
      const result = await this.aiCollaboration.submitCollaborativeTask(demoTask);
      
      console.log('\n🎉 Demonstration Collaboration Completed!');
      console.log('Final Result Preview:', result.finalResult.substring(0, 200) + '...');
      
      // Broadcast to clients
      if (this.broadcastUpdate) this.broadcastUpdate('demo-collaboration-completed', result);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('demo-collaboration-completed', result);
      
    } catch (error) {
      console.error('❌ Demonstration collaboration failed:', error.message);
    }
  }
  
  getAISystemStatus() {
    const collaborationStatus = this.aiCollaboration.getCollaborationStatus();
    
    // Log for debugging
    if (process.env.VERCEL) {
      console.log(`[VERCEL] AI System Status - Total Agents: ${collaborationStatus.totalAIAgents}`);
      console.log(`[VERCEL] AI Agents Keys:`, Array.from(collaborationStatus.aiAgents.keys()));
    }
    
    return {
      timestamp: Date.now(),
      openaiApiKey: !!process.env.OPENAI_API_KEY,
      totalAIAgents: collaborationStatus.totalAIAgents,
      activeCollaborations: collaborationStatus.activeCollaborations,
      totalCollaborations: collaborationStatus.totalCollaborations,
      connectedClients: this.connectedClients ? this.connectedClients.size : 0,
      sseClients: this.sseClients ? this.sseClients.size : 0,
      aiAgents: collaborationStatus.aiAgents,
      recentTasks: this.taskHistory ? this.taskHistory.slice(-5) : [],
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        vercel: !!process.env.VERCEL
      }
    };
  }
  
  broadcastUpdate(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
  
  broadcastSSEUpdate(event, data) {
    // Broadcast to all SSE clients
    if (this.sseClients) {
      this.sseClients.forEach(client => {
        try {
          // Check if the client response object is still writable
          if (client.writable) {
            if (event === 'message') {
              // For generic messages, wrap in the expected format
              client.write(`data: ${JSON.stringify({ event: 'message', data: data })}\n\n`);
            } else {
              // For specific events, use the event type
              client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            }
          } else {
            // Client is no longer writable, remove it
            this.sseClients.delete(client);
          }
        } catch (error) {
          // Log the error but don't crash the server
          console.error('❌ Error sending SSE update to client:', error.message);
          // Remove client if there's an error
          this.sseClients.delete(client);
        }
      });
    }
  }
  
  async start(port = 8080) {
    // Only start server if not in Vercel environment
    if (!process.env.VERCEL && this.server) {
      return new Promise((resolve) => {
        this.server.listen(port, '0.0.0.0', () => {  // Changed from default to explicit 0.0.0.0
          console.log(`\n🌌 Real AI Cosmic Agent Network Server started on port ${port}`);
          console.log(`📱 Web Interface: http://localhost:${port}`);
          console.log(`🔗 WebSocket: ws://localhost:${port}`);
          console.log(`📡 SSE Endpoint: http://localhost:${port}/sse`);
          console.log(`🧠 AI Engine: ${process.env.OPENAI_API_KEY ? 'Active' : 'Inactive (no API key)'}`);
          resolve();
        });
      });
    } else {
      console.log('⏭️  Skipping server start in Vercel environment');
      return Promise.resolve();
    }
  }
  
  async stop() {
    console.log('\n🛑 Shutting down Real AI server...');
    
    if (this.aiCollaboration) {
      this.aiCollaboration.destroy();
    }
    
    if (this.server) {
      this.server.close();
    }
    
    console.log('✅ Server shutdown complete');
  }
}

// Only start the server if not in Vercel environment
if (!process.env.VERCEL) {
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
} else {
  // In Vercel environment, we need to handle serverless function lifecycle
  // We'll create a singleton instance that can be reused across requests
  global.__realAIServerInstance = global.__realAIServerInstance || null;
  
  // Export a function to get or create the server instance
  RealAICosmicServer.getOrCreateInstance = function() {
    if (!global.__realAIServerInstance) {
      console.log('Creating new RealAICosmicServer instance for Vercel');
      global.__realAIServerInstance = new RealAICosmicServer();
    }
    return global.__realAIServerInstance;
  };
}

export default RealAICosmicServer;