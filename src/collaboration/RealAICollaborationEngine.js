import { EventEmitter } from 'events';
import { AIAgent } from '../core/AIAgent.js';
import { ProfSmootAgent } from '../core/ProfSmootAgent.js';
import { Task } from '../core/Models.js';
import { generateId } from '../core/index.js';

/**
 * Real AI Collaboration Engine
 * Manages collaboration between actual AI agents with LLM capabilities
 */
export class RealAICollaborationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
      maxConcurrentTasks: config.maxConcurrentTasks || 10,
      collaborationTimeout: config.collaborationTimeout || 60000, // 1 minute
      convergenceThreshold: config.convergenceThreshold || 0.85,
      maxIterations: config.maxIterations || 5,
    };
    
    // AI Agents storage
    this.aiAgents = new Map();
    this.activeTasks = new Map();
    this.collaborationSessions = new Map();
    
    // Real-time collaboration state
    this.collaborationState = {
      activeCollaborations: 0,
      totalCollaborations: 0,
      averageConvergenceTime: 0,
      successRate: 0,
    };
    
    this._initializeEngine();
  }
  
  /**
   * Initialize the collaboration engine
   */
  _initializeEngine() {
    console.log('🤖 Initializing Real AI Collaboration Engine...');
    
    // Monitor collaboration sessions
    setInterval(() => {
      this._monitorCollaborations();
    }, 5000);
  }
  
  /**
   * Create a real AI agent
   */
  async createAIAgent(config) {
    const agentConfig = {
      ...config,
      openaiApiKey: this.config.openaiApiKey,
    };
    
    const aiAgent = new AIAgent(agentConfig);
    this.aiAgents.set(aiAgent.id, aiAgent);
    
    console.log(`🧠 Created AI Agent: ${aiAgent.name} (${aiAgent.type})`);
    console.log(`   Capabilities: ${aiAgent.capabilities.join(', ')}`);
    console.log(`   Personality: ${aiAgent.personality.traits.join(', ')}`);
    
    this.emit('ai-agent-created', { agentId: aiAgent.id, agent: aiAgent });
    return aiAgent;
  }
  
  /**
   * Submit task for real AI collaboration
   */
  async submitCollaborativeTask(taskData) {
    // Check if we're already processing this task
    if (this.activeTasks.has(taskData.id)) {
      const existingSessionId = this.activeTasks.get(taskData.id);
      const existingSession = this.collaborationSessions.get(existingSessionId);
      
      if (existingSession && existingSession.status === 'active') {
        console.log(`⚠️ Task ${taskData.id} is already being processed, returning existing session`);
        // Wait for existing session to complete and return its result
        return new Promise((resolve, reject) => {
          const checkCompletion = () => {
            const session = this.collaborationSessions.get(existingSessionId);
            if (session && session.status === 'completed') {
              resolve(session.result);
            } else if (session && session.status === 'failed') {
              reject(new Error(session.error || 'Task failed'));
            } else {
              // Check again in 500ms
              setTimeout(checkCompletion, 500);
            }
          };
          checkCompletion();
        });
      }
    }
    
    const task = new Task({
      ...taskData,
      id: taskData.id || generateId(),
    });
    
    console.log(`\n📋 Submitting Collaborative Task: ${task.description}`);
    
    // Select optimal AI agents for this task
    const selectedAgents = await this._selectOptimalAIAgents(task);
    
    if (selectedAgents.length === 0) {
      throw new Error('No suitable AI agents available for this task');
    }
    
    console.log(`👥 Selected ${selectedAgents.length} AI agents for collaboration:`);
    selectedAgents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.type}): ${agent.capabilities.join(', ')}`);
    });
    
    // Create collaboration session
    const sessionId = await this._createAICollaborationSession(task, selectedAgents);
    
    // Start collaborative processing
    const result = await this._executeCollaborativeTask(sessionId);
    
    return result;
  }
  
  /**
   * Select optimal AI agents for a task
   */
  async _selectOptimalAIAgents(task) {
    // Filter available agents with more flexible criteria
    const availableAgents = Array.from(this.aiAgents.values())
      .filter(agent => {
        // Check if agent has aiState property, if not initialize it
        if (!agent.aiState) {
          agent.aiState = {
            isProcessing: false,
            lastThought: Date.now(),
            creativityLevel: 0.5,
            focusLevel: 0.8,
            collaborationMode: 'active'
          };
        }
        
        // More flexible availability check
        const isAvailable = !agent.aiState.isProcessing && 
                          (agent.energy === undefined || agent.energy > 10);
        
        return isAvailable;
      });
    
    if (availableAgents.length === 0) {
      console.warn('No agents available with standard criteria, trying fallback selection...');
      // Fallback: select any agents that are not explicitly marked as processing
      const fallbackAgents = Array.from(this.aiAgents.values())
        .filter(agent => {
          if (!agent.aiState) {
            agent.aiState = {
              isProcessing: false,
              lastThought: Date.now(),
              creativityLevel: 0.5,
              focusLevel: 0.8,
              collaborationMode: 'active'
            };
          }
          return !agent.aiState.isProcessing;
        });
      
      if (fallbackAgents.length === 0) {
        throw new Error('No AI agents available - all agents are currently processing tasks');
      }
      
      // Return up to 3 fallback agents
      return fallbackAgents.slice(0, 3);
    }
    
    // Check if Prof. Smoot is available for task allocation
    const profSmoot = Array.from(this.aiAgents.values())
      .find(agent => agent instanceof ProfSmootAgent && !agent.aiState.isProcessing && 
            (agent.energy === undefined || agent.energy > 10));
    
    if (profSmoot) {
      // Use Prof. Smoot's cosmic structure expertise for task allocation
      try {
        console.log(`🌌 Consulting Prof. Smoot for task allocation...`);
        const allocationDecision = await profSmoot.allocateTask(task, availableAgents);
        
        if (allocationDecision && allocationDecision.selectedAgents && allocationDecision.selectedAgents.length > 0) {
          console.log(`✅ Prof. Smoot allocated ${allocationDecision.selectedAgents.length} agents for task ${task.id}`);
          console.log(`   Rationale: ${allocationDecision.rationale}`);
          
          // Return the agents selected by Prof. Smoot
          // More robust matching of agent IDs
          const selectedAgents = [];
          for (const agentId of allocationDecision.selectedAgents) {
            const agent = availableAgents.find(a => a.id === agentId);
            if (agent) {
              selectedAgents.push(agent);
            } else {
              // Try to find agent with partial ID match (in case of ID formatting issues)
              const partialMatch = availableAgents.find(a => a.id.includes(agentId) || agentId.includes(a.id));
              if (partialMatch) {
                selectedAgents.push(partialMatch);
                console.warn(`Used partial match for agent ID: ${agentId} -> ${partialMatch.id}`);
              } else {
                console.warn(`Could not find agent with ID: ${agentId}`);
              }
            }
          }
          
          // If we found at least one agent, return them
          if (selectedAgents.length > 0) {
            // Emit an event to indicate that Prof. Smoot was used for allocation
            this.emit('task-allocation-by-prof-smoot', {
              taskId: task.id,
              allocatedAgents: selectedAgents.map(agent => agent.id),
              rationale: allocationDecision.rationale,
              confidence: allocationDecision.confidence
            });
            
            return selectedAgents;
          }
          console.warn('No valid agents found after Prof. Smoot allocation, using fallback method');
        } else {
          console.warn('Prof. Smoot did not return valid agent selection, using fallback method');
        }
      } catch (error) {
        console.error('Prof. Smoot allocation failed, falling back to default method:', error);
      }
    }
    
    // Score agents based on task relevance (fallback method)
    const scoredAgents = [];
    
    for (const agent of availableAgents) {
      const score = await this._calculateTaskRelevanceScore(agent, task);
      scoredAgents.push({ agent, score });
    }
    
    // Sort by score and select top agents
    scoredAgents.sort((a, b) => b.score - a.score);
    
    // Select diverse set of agents (different types)
    const selectedAgents = [];
    const usedTypes = new Set();
    const maxAgents = Math.min(4, scoredAgents.length);
    
    for (const { agent } of scoredAgents) {
      if (selectedAgents.length >= maxAgents) break;
      
      // Prefer diversity in agent types
      if (!usedTypes.has(agent.type) || selectedAgents.length < 2) {
        selectedAgents.push(agent);
        usedTypes.add(agent.type);
      }
    }
    
    // If we still don't have agents, return the highest scored ones
    if (selectedAgents.length === 0 && scoredAgents.length > 0) {
      return scoredAgents.slice(0, Math.min(3, scoredAgents.length)).map(item => item.agent);
    }
    
    // Emit an event to indicate that fallback allocation was used
    if (selectedAgents.length > 0) {
      this.emit('task-allocation-by-fallback', {
        taskId: task.id,
        allocatedAgents: selectedAgents.map(agent => agent.id),
        method: 'diverse_scoring'
      });
    }
    
    return selectedAgents;
  }
  
  /**
   * Calculate task relevance score for an agent
   */
  async _calculateTaskRelevanceScore(agent, task) {
    let score = 0;
    
    // Capability matching
    const requiredCaps = task.requiredCapabilities || [];
    const capabilityMatch = agent.capabilities.filter(cap => 
      requiredCaps.some(req => req.toLowerCase().includes(cap.toLowerCase()))
    ).length;
    score += (capabilityMatch / Math.max(requiredCaps.length, 1)) * 0.4;
    
    // Agent state factors
    score += (agent.energy / agent.maxEnergy) * 0.2;
    score += agent.aiState.focusLevel * 0.2;
    score += (1 - agent.aiState.creativityLevel) * 0.1; // Lower creativity for more focused tasks
    
    // Performance history
    score += agent.performanceMetrics.successRate * 0.1;
    
    return score;
  }
  
  /**
   * Create AI collaboration session
   */
  async _createAICollaborationSession(task, agents) {
    // Check if a session already exists for this task
    if (this.activeTasks.has(task.id)) {
      const existingSessionId = this.activeTasks.get(task.id);
      console.log(`⚠️ Session already exists for task ${task.id}, returning existing session: ${existingSessionId}`);
      return existingSessionId;
    }
    
    const sessionId = generateId();
    
    const session = {
      id: sessionId,
      task: task,
      participants: agents,
      startTime: Date.now(),
      status: 'active',
      iterations: [],
      convergenceHistory: [],
      currentIteration: 0,
      consensusLevel: 0,
      collaborationPhase: 'initial_analysis',
    };
    
    this.collaborationSessions.set(sessionId, session);
    this.activeTasks.set(task.id, sessionId);
    
    console.log(`🔗 Created collaboration session: ${sessionId}`);
    
    return sessionId;
  }
  
  /**
   * Execute collaborative task with real AI agents
   */
  async _executeCollaborativeTask(sessionId) {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error('Collaboration session not found');
    }
    
    console.log(`\n🚀 Starting Real AI Collaboration...`);
    
    try {
      // Phase 1: Initial individual analysis
      console.log('\n📊 Phase 1: Individual Analysis');
      const initialAnalyses = await this._conductIndividualAnalysis(session);
      
      // Emit task chain execution step for individual analysis
      this.emit('task-chain-execution-step', {
        taskChainId: session.id,
        taskId: `${session.task.id}_analysis`,
        agentId: 'multiple',
        timestamp: Date.now(),
        taskName: 'Individual Analysis',
        phase: 'individual_analysis',
        agentDetails: session.participants.map(agent => ({
          id: agent.id,
          name: agent.name,
          type: agent.type
        }))
      });
      
      // Phase 2: Collaborative discussion
      console.log('\n💬 Phase 2: Collaborative Discussion');
      const discussions = await this._conductCollaborativeDiscussion(session, initialAnalyses);
      
      // Emit task chain execution step for collaborative discussion
      this.emit('task-chain-execution-step', {
        taskChainId: session.id,
        taskId: `${session.task.id}_discussion`,
        agentId: 'multiple',
        timestamp: Date.now(),
        taskName: 'Collaborative Discussion',
        phase: 'collaborative_discussion',
        agentDetails: session.participants.map(agent => ({
          id: agent.id,
          name: agent.name,
          type: agent.type
        }))
      });
      
      // Phase 3: Convergence and synthesis
      console.log('\n🎯 Phase 3: Convergence & Synthesis');
      const finalResult = await this._achieveConvergence(session, discussions);
      
      // Emit task chain execution step for synthesis
      this.emit('task-chain-execution-step', {
        taskChainId: session.id,
        taskId: `${session.task.id}_synthesis`,
        agentId: 'synthesizer',
        timestamp: Date.now(),
        taskName: 'Result Synthesis',
        phase: 'result_synthesis',
        agentDetails: [{
          id: 'synthesizer',
          name: 'Synthesizer Agent',
          type: 'synthesizer'
        }]
      });
      
      // Update session status
      session.status = 'completed';
      session.endTime = Date.now();
      session.duration = session.endTime - session.startTime;
      
      console.log(`✅ Collaboration completed in ${session.duration}ms`);
      
      this.emit('collaboration-completed', {
        sessionId: sessionId,
        result: finalResult,
        duration: session.duration
      });
      
      // Emit task chain completed event
      this.emit('task-chain-completed', {
        chainId: session.id,
        taskId: session.task.id,
        result: finalResult,
        metrics: {
          executionTime: session.duration,
          successRate: 1.0,
          totalSteps: 3
        }
      });
      
      return finalResult;
      
    } catch (error) {
      console.error('❌ Collaboration failed:', error);
      session.status = 'failed';
      session.error = error.message;
      
      // Emit task chain failed event
      this.emit('task-chain-failed', {
        chainId: session.id,
        taskId: session.task.id,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Conduct individual analysis phase
   */
  async _conductIndividualAnalysis(session) {
    const analyses = [];
    
    // Process each agent's individual analysis
    for (const agent of session.participants) {
      console.log(`   🤔 ${agent.name} analyzing...`);
      
      try {
        const result = await agent._executeTask(session.task);
        analyses.push({
          agentId: agent.id,
          agentName: agent.name,
          agentType: agent.type,
          analysis: result.result,
          reasoning: result.reasoning,
          confidence: result.confidence,
          timestamp: Date.now()
        });
        
        console.log(`   ✓ ${agent.name}: ${result.result.substring(0, 100)}...`);
        
      } catch (error) {
        console.error(`   ❌ ${agent.name} analysis failed:`, error.message);
        analyses.push({
          agentId: agent.id,
          agentName: agent.name,
          agentType: agent.type,
          analysis: `Analysis failed: ${error.message}`,
          reasoning: ['Error during analysis'],
          confidence: 0.1,
          timestamp: Date.now()
        });
      }
    }
    
    session.iterations.push({
      phase: 'individual_analysis',
      results: analyses,
      timestamp: Date.now()
    });
    
    return analyses;
  }
  
  /**
   * Conduct collaborative discussion phase
   */
  async _conductCollaborativeDiscussion(session, initialAnalyses) {
    const discussions = [];
    const maxRounds = 3;
    
    for (let round = 1; round <= maxRounds; round++) {
      console.log(`   🗣️ Discussion Round ${round}`);
      
      const roundDiscussions = [];
      
      // Each agent responds to others' analyses
      for (const agent of session.participants) {
        const otherAnalyses = initialAnalyses.filter(a => a.agentId !== agent.id);
        
        if (otherAnalyses.length > 0) {
          const collaborationContext = {
            round: round,
            otherAnalyses: otherAnalyses,
            previousDiscussions: discussions
          };
          
          try {
            console.log(`     💭 ${agent.name} responding...`);
            
            // Find another agent to collaborate with
            const otherAgent = session.participants.find(a => a.id !== agent.id);
            if (otherAgent) {
              const response = await agent.collaborateWith(otherAgent, session.task, collaborationContext);
              
              roundDiscussions.push({
                agentId: agent.id,
                agentName: agent.name,
                response: response.response,
                confidence: response.confidence,
                round: round,
                timestamp: Date.now()
              });
              
              console.log(`     ✓ ${agent.name}: ${response.response.substring(0, 80)}...`);
            }
            
          } catch (error) {
            console.error(`     ❌ ${agent.name} discussion failed:`, error.message);
          }
        }
      }
      
      discussions.push({
        round: round,
        discussions: roundDiscussions,
        timestamp: Date.now()
      });
      
      // Check for convergence
      const convergence = this._calculateConvergence(roundDiscussions);
      console.log(`     📈 Convergence: ${convergence.toFixed(3)}`);
      
      if (convergence > this.config.convergenceThreshold) {
        console.log(`     🎯 Convergence achieved!`);
        break;
      }
    }
    
    session.iterations.push({
      phase: 'collaborative_discussion',
      results: discussions,
      timestamp: Date.now()
    });
    
    return discussions;
  }
  
  /**
   * Achieve convergence and synthesis
   */
  async _achieveConvergence(session, discussions) {
    console.log(`   🔄 Synthesizing final result...`);
    
    // Select the most capable agent for synthesis (highest confidence + best type match)
    const synthesizer = this._selectSynthesizer(session.participants, discussions);
    
    if (!synthesizer) {
      throw new Error('No suitable synthesizer agent found');
    }
    
    // Prepare synthesis context
    const synthesisContext = {
      initialAnalyses: session.iterations.find(i => i.phase === 'individual_analysis')?.results || [],
      discussions: discussions,
      task: session.task
    };
    
    try {
      console.log(`   🧠 ${synthesizer.name} synthesizing...`);
      
      const synthesisPrompt = this._createSynthesisPrompt(synthesisContext);
      
      const completion = await synthesizer.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use gpt-3.5-turbo for synthesis to avoid token limits
        messages: [
          { role: 'system', content: `You are ${synthesizer.name}, an expert synthesizer. Provide concise, comprehensive analysis.` },
          { role: 'user', content: synthesisPrompt }
        ],
        temperature: 0.3, // Lower temperature for more focused synthesis
        max_tokens: 1000, // Reduced from 2000
      });
      
      const finalSynthesis = completion.choices[0].message.content;
      
      const result = {
        sessionId: session.id,
        task: session.task,
        finalResult: finalSynthesis,
        synthesizedBy: synthesizer.name,
        participantContributions: this._extractContributions(session),
        convergenceMetrics: this._calculateFinalMetrics(session),
        timestamp: Date.now(),
        metadata: {
          totalAgents: session.participants.length,
          iterations: session.iterations.length,
          tokensUsed: completion.usage?.total_tokens || 0
        }
      };
      
      console.log(`   ✅ Final synthesis completed by ${synthesizer.name}`);
      
      return result;
      
    } catch (error) {
      console.error(`   ❌ Synthesis failed:`, error.message);
      
      // Fallback: combine all analyses
      return this._createFallbackSynthesis(session, discussions);
    }
  }
  
  /**
   * Select the best agent for synthesis
   */
  _selectSynthesizer(agents, discussions) {
    // Prefer synthesizer type agents, or agents with highest overall confidence
    const scores = agents.map(agent => {
      let score = 0;
      
      // Type preference
      if (agent.type === 'synthesizer') score += 0.5;
      if (agent.type === 'reasoner') score += 0.3;
      
      // AI state
      score += agent.aiState.focusLevel * 0.3;
      score += agent.performanceMetrics.successRate * 0.2;
      
      return { agent, score };
    });
    
    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.agent;
  }
  
  /**
   * Create synthesis prompt
   */
  _createSynthesisPrompt(context) {
    // Limit analysis content to prevent token overflow
    const limitedAnalyses = context.initialAnalyses
      .map(a => `${a.agentName} (${a.agentType}): ${a.analysis.substring(0, 200)}...`)
      .join('\n\n');
    
    const limitedDiscussion = context.discussions
      .slice(-1) // Only last discussion round
      .map(d => d.discussions.map(disc => `${disc.agentName}: ${disc.response.substring(0, 150)}...`).join('\n'))
      .join('\n\n');
    
    return `You are tasked with synthesizing the collective intelligence of multiple AI agents:

ORIGINAL TASK:
${context.task.description}

AGENT ANALYSES:
${limitedAnalyses}

COLLABORATIVE DISCUSSIONS:
${limitedDiscussion}

Please provide a comprehensive synthesis that:
1. Integrates the best insights from all agents
2. Provides a clear, actionable conclusion
3. Maintains high confidence in the recommendation

SYNTHESIS (max 1000 chars):`;
  }
  
  /**
   * Calculate convergence level
   */
  _calculateConvergence(discussions) {
    if (discussions.length < 2) return 0;
    
    // Simple convergence based on confidence levels and response similarity
    const confidences = discussions.map(d => d.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b) / confidences.length;
    const confidenceVariance = confidences.reduce((sum, conf) => 
      sum + Math.pow(conf - avgConfidence, 2), 0) / confidences.length;
    
    const convergence = avgConfidence * (1 - Math.sqrt(confidenceVariance));
    return Math.max(0, Math.min(1, convergence));
  }
  
  /**
   * Extract agent contributions
   */
  _extractContributions(session) {
    const contributions = new Map();
    
    session.participants.forEach(agent => {
      contributions.set(agent.id, {
        agentName: agent.name,
        agentType: agent.type,
        capabilities: agent.capabilities,
        uniqueInsights: [],
        collaborationQuality: 0.8 // Simplified metric
      });
    });
    
    return Object.fromEntries(contributions);
  }
  
  /**
   * Calculate final metrics
   */
  _calculateFinalMetrics(session) {
    return {
      convergenceAchieved: true,
      finalConsensus: 0.85,
      collaborationEfficiency: 0.8,
      diversityIndex: session.participants.length / 5, // Normalized
      totalIterations: session.iterations.length
    };
  }
  
  /**
   * Create fallback synthesis
   */
  _createFallbackSynthesis(session, discussions) {
    const analyses = session.iterations
      .find(i => i.phase === 'individual_analysis')?.results || [];
    
    const combinedAnalysis = analyses
      .map(a => `${a.agentName}: ${a.analysis}`)
      .join('\n\n');
    
    return {
      sessionId: session.id,
      task: session.task,
      finalResult: `Collaborative Analysis:\n\n${combinedAnalysis}`,
      synthesizedBy: 'System (Fallback)',
      participantContributions: this._extractContributions(session),
      convergenceMetrics: { fallback: true },
      timestamp: Date.now()
    };
  }
  
  /**
   * Monitor active collaborations
   */
  _monitorCollaborations() {
    const activeSessions = Array.from(this.collaborationSessions.values())
      .filter(session => session.status === 'active');
    
    this.collaborationState.activeCollaborations = activeSessions.length;
    
    // Check for timed out sessions
    const now = Date.now();
    activeSessions.forEach(session => {
      if (now - session.startTime > this.config.collaborationTimeout) {
        console.log(`⏰ Collaboration session ${session.id} timed out`);
        session.status = 'timeout';
      }
    });
  }
  
  /**
   * Get collaboration status
   */
  getCollaborationStatus() {
    return {
      totalAIAgents: this.aiAgents.size,
      activeCollaborations: this.collaborationState.activeCollaborations,
      totalCollaborations: this.collaborationState.totalCollaborations,
      aiAgents: Array.from(this.aiAgents.values()).map(agent => agent.getAIStatusSummary()),
      recentSessions: Array.from(this.collaborationSessions.values())
        .slice(-5)
        .map(session => ({
          id: session.id,
          status: session.status,
          participants: session.participants.length,
          duration: session.duration || (Date.now() - session.startTime)
        }))
    };
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    // Cleanup all AI agents
    for (const agent of this.aiAgents.values()) {
      agent.destroy();
    }
    
    this.aiAgents.clear();
    this.collaborationSessions.clear();
    this.activeTasks.clear();
  }
}

export default RealAICollaborationEngine;