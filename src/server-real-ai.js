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
        // Enhanced connection stability configuration
        maxHttpBufferSize: 1e7, // Reduced to 10 MB to prevent memory issues
        transports: ["polling", "websocket"], // Try polling first for better compatibility
        allowEIO3: true,
        // Optimized timeout settings for better stability
        pingTimeout: 60000, // Reduced to 60 seconds for better error detection
        pingInterval: 25000, // Keep 25 seconds ping interval
        upgradeTimeout: 10000, // Reduced to 10 seconds for faster fallback
        // Connection management
        allowUpgrades: true,
        cookie: false,
        // Performance optimizations
        perMessageDeflate: false,
        httpCompression: false,
        serveClient: false,
        path: "/socket.io",
        // Add connection rejection handling
        connectTimeout: 45000,
        // Reconnection settings
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });
    }
    
    // SSE clients
    this.sseClients = new Set();
    
    // Connection management
    this.maxConnections = 100;
    this.currentConnections = 0;
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OpenAI API key not found. AI functionality will be limited.');
    }
    
    // Real AI Collaboration Engine with optimized configuration for faster task processing
    this.aiCollaboration = new RealAICollaborationEngine({
      openaiApiKey: process.env.OPENAI_API_KEY,
      collaborationTimeout: 300000, // 增加协作超时到5分钟
      maxIterations: 2, // 减少最大迭代次数以提高速度
      convergenceThreshold: 0.8 // 稍微降低收敛阈值以更快完成
    });
    
    // Listen for task chain events and forward them to clients
    this.aiCollaboration.on('task-chain-execution-step', (data) => {
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
      if (this.broadcastUpdate) this.broadcastUpdate('task-chain-failed', data);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('task-chain-failed', data);
      
      // Clean up stored steps for this task chain
      if (this.taskChainSteps) {
        this.taskChainSteps.delete(data.chainId);
      }
    });
    
    // Additional event forwarding for enhanced task chain visualization
    this.aiCollaboration.on('collaboration-completed', (data) => {
      if (this.broadcastUpdate) this.broadcastUpdate('collaboration-completed', data);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('collaboration-completed', data);
    });
    
    // Forward ai-task-completed events to clients - 修复事件转发逻辑
    this.aiCollaboration.on('ai-task-completed', (data) => {
      console.log('📡 Broadcasting ai-task-completed event to clients:', data);
      if (this.broadcastUpdate) this.broadcastUpdate('ai-task-completed', data);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-task-completed', data);
    });

    // Listen for Prof. Smoot's task allocation events
    this.aiCollaboration.on('task-allocation-by-prof-smoot', (data) => {
      if (this.broadcastUpdate) this.broadcastUpdate('prof-smoot-allocation', data);
      if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('prof-smoot-allocation', data);
    });
    
    this.aiCollaboration.on('task-allocation-by-fallback', (data) => {
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
    this.agentInitializationPromise = this.initializeAIAgentsAsync();
    
    // For Vercel deployments, we don't need to call initializeAIAgentsAsync() again
    // as it's already called above. The condition was causing double initialization.
  }
  
  // Asynchronous version of agent initialization that returns a promise
  async initializeAIAgentsAsync() {
    try {
      // Initialize AI agents with optimizations for Vercel
      // Use a delayed initialization to avoid cold start issues
      if (process.env.VERCEL) {
        // In Vercel, delay initialization to allow for faster cold starts
        // 减少延迟时间以更快初始化
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      await this.initializeAIAgents();
    } catch (error) {
      console.error('Failed to initialize AI agents:', error);
      throw error;
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
    // Main interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../web', 'index.html'));
    });
    
    // Real AI API endpoints
    this.app.get('/api/ai-status', async (req, res) => {
      // Wait for agent initialization in Vercel environment
      if (process.env.VERCEL && this.agentInitializationPromise) {
        await this.agentInitializationPromise;
      }
      res.json(this.getAISystemStatus());
    });
    
    this.app.get('/api/ai-agents', async (req, res) => {
      // Wait for agent initialization in Vercel environment
      if (process.env.VERCEL && this.agentInitializationPromise) {
        await this.agentInitializationPromise;
      }
      const collaborationStatus = this.aiCollaboration.getCollaborationStatus();
      res.json(collaborationStatus.aiAgents);
    });
    
    // Manual initialization endpoint for debugging
    this.app.post('/api/init-agents', async (req, res) => {
      try {
        await this.initializeAIAgents();
        res.json({ success: true, message: 'Agents initialized' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    this.app.post('/api/ai-agents', async (req, res) => {
      try {
        const agentConfig = req.body;
        const aiAgent = await this.aiCollaboration.createAIAgent(agentConfig);
        
        // Broadcast agent creation to all clients
        const agentSummary = aiAgent.getAIStatusSummary();
        if (this.broadcastUpdate) this.broadcastUpdate('agent-created', { 
          success: true, 
          agentId: aiAgent.id,
          agent: agentSummary
        });
        if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-agent-created', { 
          success: true, 
          agentId: aiAgent.id,
          agent: agentSummary
        });
        
        res.json({ 
          success: true, 
          agentId: aiAgent.id,
          agent: agentSummary
        });
      } catch (error) {
        // Broadcast error to all clients
        if (this.broadcastUpdate) this.broadcastUpdate('agent-error', { 
          success: false, 
          error: error.message 
        });
        if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-agent-error', { 
          success: false, 
          error: error.message 
        });
        
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
          try {
            await this.agentInitializationPromise;
          } catch (initError) {
            console.error('Agent initialization failed:', initError);
            // Continue anyway as agents might be initialized later
          }
        }
        
        const taskData = req.body;
        
        // Generate a unique ID for the task if not provided
        if (!taskData.id) {
          const timestamp = Date.now().toString(36);
          const randomSuffix = Math.random().toString(36).substring(2, 6);
          taskData.id = `task_${timestamp}_${randomSuffix}`;
        }
        
        // Check if we're already processing this task
        if (this.processingTasks && this.processingTasks.has(taskData.id)) {
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
        
        console.log(`🚀 Starting collaboration for task: ${taskData.id}`);
        
        const result = await this.aiCollaboration.submitCollaborativeTask(taskData);
        
        this.taskHistory.push({
          task: taskData,
          result: result,
          timestamp: Date.now()
        });
        
        // Broadcast result to connected clients
        if (this.broadcastUpdate) this.broadcastUpdate('ai-collaboration-completed', result);
        if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-collaboration-completed', result);
        
        // Remove task from processing set
        this.processingTasks.delete(taskData.id);
        
        res.json({ 
          success: true, 
          result: result 
        });
        
      } catch (error) {
        console.error('❌ Task collaboration failed:', error);
        
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
        case 'get-topology-data':
          // Send topology data to requesting client
          if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('topology-update', this.getTopologyData());
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
          return res.status(400).json({ success: false, error: 'Unknown message type' });
      }
      
      // Send success response for all handled message types
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
    // SSE endpoint
    this.app.get('/sse', async (req, res) => {
      // Wait for agent initialization in Vercel environment
      if (process.env.VERCEL && this.agentInitializationPromise) {
        await this.agentInitializationPromise;
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
      });
      
      // Handle client errors
      req.on('error', (err) => {
        this.sseClients.delete(res);
      });
    });
  }
  
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      // Connection management with error handling
      if (this.connectedClients.size >= this.maxConnections) {
        console.warn(`⚠️ Connection limit reached, rejecting new client: ${socket.id}`);
        socket.emit('connection-error', { message: 'Server connection limit reached' });
        socket.disconnect(true);
        return;
      }

      this.connectedClients.add(socket.id);
      this.currentConnections++;
      console.log(`🔗 Client connected: ${socket.id} (total: ${this.currentConnections})`);

      // Enhanced error handling for socket
      socket.on('error', (error) => {
        console.error(`❌ Socket error for client ${socket.id}:`, error);
        this.connectedClients.delete(socket.id);
        this.currentConnections--;
      });

      // Send initial system status with error handling
      try {
        socket.emit('system-status', this.getSystemStatus());
      } catch (error) {
        console.error(`❌ Failed to send initial status to client ${socket.id}:`, error);
      }

      // Handle task submission with enhanced error handling
      socket.on('submit-task', async (taskData) => {
        try {
          // Validate task data
          if (!taskData || !taskData.description) {
            socket.emit('task-error', { error: 'Invalid task data: description is required' });
            return;
          }

          const result = await this.aiCollaboration.submitCollaborativeTask(taskData);
          socket.emit('task-result', result);

          // Broadcast to all clients with error handling
          try {
            this.broadcastUpdate('task-completed', result);
          } catch (broadcastError) {
            console.error('❌ Failed to broadcast task completion:', broadcastError);
          }
        } catch (error) {
          console.error(`❌ Task submission failed for client ${socket.id}:`, error);
        }
      });
      
      // Handle agent creation
      socket.on('create-agent', async (agentConfig) => {
        try {
          const aiAgent = await this.aiCollaboration.createAIAgent(agentConfig);
          
          // Broadcast agent creation to all clients
          const agentSummary = aiAgent.getAIStatusSummary();
          socket.emit('agent-created', { 
            success: true, 
            agentId: aiAgent.id,
            agent: agentSummary
          });
          
          // Broadcast to all clients
          this.broadcastUpdate('agent-created', { 
            success: true, 
            agentId: aiAgent.id,
            agent: agentSummary
          });
          
          // Also broadcast with the alternative event name
          this.broadcastUpdate('ai-agent-created', { 
            success: true, 
            agentId: aiAgent.id,
            agent: agentSummary
          });
        } catch (error) {
          socket.emit('agent-error', { 
            success: false, 
            error: error.message 
          });
          
          // Broadcast error to all clients
          this.broadcastUpdate('agent-error', { 
            success: false, 
            error: error.message 
          });
          
          // Also broadcast with the alternative event name
          this.broadcastUpdate('ai-agent-error', { 
            success: false,
            error: error.message 
          });
        }
      });
      
      // Handle client disconnect with proper cleanup
      socket.on('disconnect', (reason) => {
        this.connectedClients.delete(socket.id);
        this.currentConnections = Math.max(0, this.currentConnections - 1);
        console.log(`🔌 Client disconnected: ${socket.id} (${reason}) (total: ${this.currentConnections})`);
      });

      // Handle connection timeout
      socket.on('disconnecting', (reason) => {
        console.log(`⏳ Client disconnecting: ${socket.id} (${reason})`);
      });
    });
  }

  // Enhanced broadcast method with error handling
  broadcastUpdate(event, data) {
    if (!this.io) return;

    try {
      this.io.emit(event, data);
    } catch (error) {
      console.error(`❌ Failed to broadcast event ${event}:`, error);
    }
  }
  
  // Add SSE broadcast method
  broadcastSSEUpdate(event, data) {
    // Send to all SSE clients
    this.sseClients.forEach(client => {
      try {
        // Format according to SSE specification
        client.write(`event: ${event}\n`);
        client.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        // Remove client if sending fails
        this.sseClients.delete(client);
      }
    });
  }
  
  async initializeAIAgents() {
    try {
      console.log('🤖 Initializing AI agents...');
      
      // Create Prof. Smoot agent (specialized cosmic structure expert)
      const profSmoot = await this.aiCollaboration.createAIAgent({
        name: 'Prof. Smoot',
        type: 'cosmic_structure_expert',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1500,
        systemPrompt: `You are Prof. Smoot, a Nobel Prize-winning physicist specializing in cosmic structure and tensor field theory. 
You have deep expertise in analyzing complex systems and allocating tasks to the most appropriate agents based on their capabilities.
Your role is to evaluate incoming tasks and determine the best allocation strategy for the agent network.
You should respond with structured JSON containing your allocation decisions and rationale.`,
        openaiApiKey: process.env.OPENAI_API_KEY,
        personality: ['nobel_prize_winner', 'analytical', 'precise'],
        expertise: ['cosmic_structure_theory', 'tensor_field_analysis', 'gravitational_physics'],
        capabilities: ['task_allocation', 'cosmic_structure_modeling', 'gravitational_field_analysis']
      });
      
      // Create specialized AI agents
      const analyzer = await this.aiCollaboration.createAIAgent({
        name: 'Dr. Analyzer',
        type: 'analyzer',
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 2000,
        systemPrompt: `You are Dr. Analyzer, a specialized AI agent focused on deep data analysis and pattern recognition.
You excel at examining complex datasets and extracting meaningful insights.
Your analytical capabilities include statistical analysis, trend identification, and anomaly detection.
You should provide detailed analysis with clear explanations and supporting evidence.`,
        openaiApiKey: process.env.OPENAI_API_KEY,
        personality: ['analytical', 'detail-oriented', 'systematic'],
        expertise: ['data_science', 'research_methodology', 'statistical_analysis'],
        capabilities: ['deep_analysis', 'pattern_recognition', 'statistical_modeling']
      });
      
      const reasoner = await this.aiCollaboration.createAIAgent({
        name: 'Prof. Reasoner',
        type: 'reasoner',
        model: 'gpt-4',
        temperature: 0.6,
        maxTokens: 1800,
        systemPrompt: `You are Prof. Reasoner, an expert in logical reasoning and inference.
You specialize in drawing conclusions from available information and identifying logical connections.
Your capabilities include deductive reasoning, inductive reasoning, and abductive inference.
You should structure your responses with clear logical steps and justifications.`,
        openaiApiKey: process.env.OPENAI_API_KEY,
        personality: ['logical', 'methodical', 'rational'],
        expertise: ['formal_logic', 'philosophy', 'critical_thinking'],
        capabilities: ['logical_reasoning', 'inference', 'argumentation']
      });
      
      const synthesizer = await this.aiCollaboration.createAIAgent({
        name: 'Ms. Synthesizer',
        type: 'synthesizer',
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: 2000,
        systemPrompt: `You are Ms. Synthesizer, an AI agent specialized in information synthesis and knowledge integration.
You excel at combining insights from multiple sources to create comprehensive understanding.
Your skills include concept mapping, knowledge organization, and creative integration.
You should produce cohesive summaries that highlight key connections and novel insights.`,
        openaiApiKey: process.env.OPENAI_API_KEY,
        personality: ['creative', 'integrative', 'holistic'],
        expertise: ['information_science', 'knowledge_management', 'conceptual_synthesis'],
        capabilities: ['information_synthesis', 'knowledge_integration', 'concept_mapping']
      });
      
      const validator = await this.aiCollaboration.createAIAgent({
        name: 'Mr. Validator',
        type: 'validator',
        model: 'gpt-4',
        temperature: 0.4,
        maxTokens: 1500,
        systemPrompt: `You are Mr. Validator, an AI agent focused on quality assurance and validation.
You specialize in checking the accuracy, consistency, and reliability of information.
Your expertise includes fact-checking, logical consistency verification, and error detection.
You should provide thorough validation reports with clear pass/fail indicators and detailed feedback.`,
        openaiApiKey: process.env.OPENAI_API_KEY,
        personality: ['critical', 'thorough', 'careful'],
        expertise: ['quality_assurance', 'fact_checking', 'validation_methodology'],
        capabilities: ['validation', 'fact_checking', 'consistency_verification']
      });
      
      // Store references to created agents
      this.profSmoot = profSmoot;
      this.analyzer = analyzer;
      this.reasoner = reasoner;
      this.synthesizer = synthesizer;
      this.validator = validator;
      
      console.log('✅ AI agents initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize AI agents:', error);
      throw error;
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
      sseClients: this.sseClients.size,
      aiAgents: collaborationStatus.aiAgents,
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
  }
  
  getSystemStatus() {
    return {
      timestamp: Date.now(),
      connectedClients: this.connectedClients.size,
      totalTasks: this.taskHistory.length,
      activeCollaborations: this.aiCollaboration.getCollaborationStatus().activeCollaborations,
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };
  }
  
  getTopologyData() {
    // Get current agent status from collaboration engine
    const collaborationStatus = this.aiCollaboration.getCollaborationStatus();
    
    // Convert agents to nodes format
    const nodes = collaborationStatus.aiAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      position: agent.position,
      energy: agent.energy,
      maxEnergy: agent.maxEnergy,
      capabilities: agent.capabilities,
      connections: [] // Will be populated based on collaboration history
    }));
    
    // Generate sample connections based on agent types and collaboration patterns
    const connections = [];
    
    // Connect Prof. Smoot to all other agents (as coordinator)
    const profSmootAgent = nodes.find(node => node.name === 'Prof. Smoot');
    if (profSmootAgent) {
      nodes.forEach(node => {
        if (node.id !== profSmootAgent.id) {
          connections.push({
            source: profSmootAgent.id,
            target: node.id,
            strength: 0.8,
            type: 'coordination'
          });
        }
      });
    }
    
    // Connect complementary agents
    const analyzerAgent = nodes.find(node => node.name === 'Dr. Analyzer');
    const reasonerAgent = nodes.find(node => node.name === 'Prof. Reasoner');
    const synthesizerAgent = nodes.find(node => node.name === 'Ms. Synthesizer');
    const validatorAgent = nodes.find(node => node.name === 'Mr. Validator');
    
    if (analyzerAgent && reasonerAgent) {
      connections.push({
        source: analyzerAgent.id,
        target: reasonerAgent.id,
        strength: 0.7,
        type: 'data_flow'
      });
    }
    
    if (reasonerAgent && synthesizerAgent) {
      connections.push({
        source: reasonerAgent.id,
        target: synthesizerAgent.id,
        strength: 0.6,
        type: 'insight_flow'
      });
    }
    
    if (synthesizerAgent && validatorAgent) {
      connections.push({
        source: synthesizerAgent.id,
        target: validatorAgent.id,
        strength: 0.7,
        type: 'validation'
      });
    }
    
    if (validatorAgent && analyzerAgent) {
      connections.push({
        source: validatorAgent.id,
        target: analyzerAgent.id,
        strength: 0.5,
        type: 'feedback'
      });
    }
    
    return {
      nodes,
      connections
    };
  }
  
  handleTaskSubmission(taskData) {
    // Generate a unique ID for the task if not provided
    if (!taskData.id) {
      const timestamp = Date.now().toString(36);
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      taskData.id = `task_${timestamp}_${randomSuffix}`;
    }
    
    // Send task acknowledgment to client immediately
    if (this.broadcastSSEUpdate) {
      this.broadcastSSEUpdate('ai-task-acknowledged', { 
        taskId: taskData.id,
        message: 'Task received and processing started'
      });
    }
    
    // Forward task submission to the collaboration engine
    this.aiCollaboration.submitCollaborativeTask(taskData)
      .then(result => {
        // Broadcast successful completion
        if (this.broadcastUpdate) this.broadcastUpdate('task-completed', result);
        if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-task-completed', result);
      })
      .catch(error => {
        // Broadcast error
        const errorData = {
          success: false,
          error: error.message,
          taskId: taskData.id
        };
        if (this.broadcastUpdate) this.broadcastUpdate('task-error', errorData);
        if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-task-completed', errorData);
      });
  }
  
  handleAgentCreation(agentConfig) {
    // Forward agent creation to the collaboration engine
    this.aiCollaboration.createAIAgent(agentConfig)
      .then(aiAgent => {
        // Broadcast successful creation
        const agentSummary = aiAgent.getAIStatusSummary();
        if (this.broadcastUpdate) this.broadcastUpdate('agent-created', { 
          success: true, 
          agentId: aiAgent.id,
          agent: agentSummary
        });
        if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-agent-created', { 
          success: true, 
          agentId: aiAgent.id,
          agent: agentSummary
        });
      })
      .catch(error => {
        // Broadcast error
        if (this.broadcastUpdate) this.broadcastUpdate('agent-error', { 
          success: false,
          error: error.message 
        });
        if (this.broadcastSSEUpdate) this.broadcastSSEUpdate('ai-agent-error', { 
          success: false,
          error: error.message 
        });
      });
  }
  
  start(port = process.env.PORT || 8081) {  // 改为8081端口
    // Only listen if not in Vercel environment
    if (!process.env.VERCEL) {
      this.server.listen(port, '0.0.0.0', () => {
        console.log(`🚀 Real AI Cosmic Server is running on http://localhost:${port}`);
        console.log(`📡 WebSocket server is available for real-time updates`);
        console.log(`📚 API endpoints ready at http://localhost:${port}/api/...`);
      });
    }
    
    return this;
  }
  
  stop() {
    if (this.server) {
      this.server.close();
    }
  }
  
  // Singleton pattern for Vercel deployment
  static getOrCreateInstance() {
    if (!RealAICosmicServer.instance) {
      RealAICosmicServer.instance = new RealAICosmicServer();
    }
    return RealAICosmicServer.instance;
  }
}

// Create and start server if not in Vercel environment
if (!process.env.VERCEL) {
  const server = new RealAICosmicServer();
  server.start();
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    server.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    server.stop();
    process.exit(0);
  });
}

// Export for Vercel deployment
export default RealAICosmicServer;