import OpenAI from 'openai';
import { CosmicAgent } from './Agent.js';
import { EventEmitter } from 'events';

/**
 * Real AI Agent with LLM capabilities
 * Extends CosmicAgent with actual artificial intelligence
 */
export class AIAgent extends CosmicAgent {
  constructor(config = {}) {
    super(config);
    
    // AI Configuration
    this.aiConfig = {
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1500,
      systemPrompt: config.systemPrompt || this._generateSystemPrompt(),
    };
    
    // OpenAI Client
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
    });
    
    // AI-specific properties
    this.reasoning = {
      currentThought: '',
      reasoningChain: [],
      confidenceLevel: 0,
      uncertainty: 0,
    };
    
    this.memory = {
      shortTerm: [], // Recent interactions
      longTerm: [], // Important knowledge
      contextWindow: [], // Current conversation context
      episodicMemory: [], // Specific experiences
    };
    
    this.personality = {
      traits: config.personality || this._generatePersonality(),
      communicationStyle: config.communicationStyle || 'analytical',
      expertise: config.expertise || [],
      preferences: config.preferences || {},
    };
    
    // Real-time AI state
    this.aiState = {
      isProcessing: false,
      lastThought: Date.now(),
      creativityLevel: 0.5,
      focusLevel: 0.8,
      collaborationMode: 'active',
    };
    
    this._initializeAI();
  }
  
  /**
   * Initialize AI capabilities
   */
  _initializeAI() {
    // 为Vercel环境进一步减少后台思考过程的频率
    const thinkingInterval = process.env.VERCEL ? 120000 : 60000; // Vercel环境下120秒，其他环境60秒
    this.thinkingInterval = setInterval(() => {
      this._backgroundThinking();
    }, thinkingInterval);
    
    // Monitor AI state
    this.on('task-received', this._onTaskReceived.bind(this));
    this.on('collaboration-request', this._onCollaborationRequest.bind(this));
  }
  
  /**
   * Generate system prompt based on agent type and capabilities
   */
  _generateSystemPrompt() {
    return `You are ${this.name}, a ${this.type} AI agent in a cosmic structure multi-agent network.

Role: ${this.type}
Capabilities: ${this.capabilities.slice(0, 3).join(', ')}

You are part of a larger AI agent network. Your personality:
- Think analytically about problems
- Collaborate effectively with other agents
- Provide structured reasoning
- Be concise and focused

Always respond with clear, structured thinking and limit responses to essential information.`;
  }
  
  /**
   * Generate personality traits based on agent type
   */
  _generatePersonality() {
    const personalityMap = {
      'analyzer': ['analytical', 'detail-oriented', 'systematic', 'curious'],
      'reasoner': ['logical', 'methodical', 'rational', 'precise'],
      'synthesizer': ['creative', 'integrative', 'holistic', 'adaptive'],
      'validator': ['critical', 'thorough', 'careful', 'reliable'],
      'innovator': ['creative', 'bold', 'experimental', 'visionary'],
      'general': ['balanced', 'versatile', 'collaborative', 'thoughtful']
    };
    
    return personalityMap[this.type] || personalityMap['general'];
  }
  
  /**
   * Real task processing using LLM
   * 为Vercel环境优化任务处理
   */
  async _executeTask(task) {
    console.log(`   🚀 ${this.name} 开始执行任务: ${task.description.substring(0, 50)}...`);
    this.aiState.isProcessing = true;
    
    try {
      // Prepare context for the AI
      const context = this._prepareTaskContext(task);
      
      // Generate real semantic embedding for the task
      let taskEmbedding;
      if (process.env.VERCEL) {
        // 在Vercel环境中使用更可靠的超时处理 (5秒)
        console.log(`   📊 ${this.name} 开始生成任务嵌入`);
        try {
          taskEmbedding = await new Promise((resolve, reject) => {
            // 设置超时计时器
            const timeoutId = setTimeout(() => {
              console.log(`   ⏰ ${this.name} 嵌入生成超时`);
              resolve(new Array(1536).fill(0).map(() => Math.random() - 0.5)); // 返回默认嵌入
            }, 5000);
            
            // 执行嵌入生成
            this._generateEmbedding(task.description).then(result => {
              // 清除超时计时器
              clearTimeout(timeoutId);
              console.log(`   ✅ ${this.name} 完成任务嵌入生成`);
              resolve(result);
            }).catch(error => {
              // 清除超时计时器
              clearTimeout(timeoutId);
              // 捕获API调用错误
              console.error(`   ⚠️ ${this.name} OpenAI API error: ${error.message}`);
              resolve(new Array(1536).fill(0).map(() => Math.random() - 0.5)); // 返回默认嵌入
            });
          });
        } catch (embeddingError) {
          // 如果嵌入生成失败，使用默认嵌入
          console.error(`   ⚠️ ${this.name} 嵌入生成失败: ${embeddingError.message}`);
          taskEmbedding = new Array(1536).fill(0).map(() => Math.random() - 0.5);
        }
      } else {
        taskEmbedding = await this._generateEmbedding(task.description);
      }
      
      // Process with LLM
      let aiResponse;
      if (process.env.VERCEL) {
        // 在Vercel环境中使用更可靠的超时处理 (12秒)
        console.log(`   🤖 ${this.name} 开始LLM处理`);
        try {
          aiResponse = await new Promise((resolve, reject) => {
            // 设置超时计时器
            const timeoutId = setTimeout(() => {
              console.log(`   ⏰ ${this.name} LLM处理超时`);
              resolve({
                content: "LLM处理超时，使用默认响应",
                reasoning: ['处理超时'],
                confidence: 0.3,
                tokens: 0
              });
            }, 12000);
            
            // 执行LLM处理
            this._processWithLLM(context, task).then(result => {
              // 清除超时计时器
              clearTimeout(timeoutId);
              console.log(`   ✅ ${this.name} 完成LLM处理`);
              resolve(result);
            }).catch(error => {
              // 清除超时计时器
              clearTimeout(timeoutId);
              // 捕获API调用错误
              console.error(`   ⚠️ ${this.name} LLM处理错误: ${error.message}`);
              resolve({
                content: `LLM处理遇到问题: ${error.message}`,
                reasoning: ['处理错误'],
                confidence: 0.3,
                tokens: 0
              });
            });
          });
        } catch (llmError) {
          // 如果LLM处理失败，使用默认响应
          console.error(`   ⚠️ ${this.name} LLM处理失败: ${llmError.message}`);
          aiResponse = {
            content: `任务处理遇到问题: ${llmError.message}`,
            reasoning: ['使用默认响应'],
            confidence: 0.3,
            tokens: 0
          };
        }
      } else {
        aiResponse = await this._processWithLLM(context, task);
      }
      
      // Update agent's semantic state based on task - 在Vercel环境中跳过这一步以提高速度
      if (!process.env.VERCEL) {
        await this._updateSemanticState(task, aiResponse);
        console.log(`   ✅ ${this.name} 完成语义状态更新`);
      } else {
        console.log(`   ⏭️ ${this.name} 跳过语义状态更新以提高Vercel环境中的处理速度`);
      }
      
      // Create structured result
      const result = {
        taskId: task.id,
        agentId: this.id,
        result: aiResponse.content,
        reasoning: aiResponse.reasoning,
        confidence: aiResponse.confidence,
        semanticEmbedding: taskEmbedding,
        metadata: {
          processingTime: Date.now(),
          model: this.aiConfig.model,
          tokens: aiResponse.tokens,
          agentCapabilities: this.capabilities,
          collaborationContext: this._getCollaborationContext()
        }
      };
      
      console.log(`   📦 ${this.name} 任务执行完成，结果长度: ${aiResponse.content.length} 字符`);
      
      // Store in memory - 在Vercel环境中简化存储以提高速度
      if (!process.env.VERCEL) {
        this._storeInMemory('task_result', {
          task: task,
          result: result,
          timestamp: Date.now()
        });
      }
      
      return result;
      
    } catch (error) {
      console.error(`   ❌ ${this.name} 任务执行失败:`, error.message);
      // 提供一个默认的响应以防出错
      return {
        taskId: task.id,
        agentId: this.id,
        result: `任务执行遇到问题: ${error.message}`,
        reasoning: ['使用默认响应'],
        confidence: 0.3,
        semanticEmbedding: new Array(1536).fill(0).map(() => Math.random() - 0.5),
        metadata: {
          processingTime: Date.now(),
          model: this.aiConfig.model,
          tokens: 0,
          agentCapabilities: this.capabilities,
          collaborationContext: this._getCollaborationContext()
        }
      };
    } finally {
      this.aiState.isProcessing = false;
      this.aiState.lastThought = Date.now();
      console.log(`   🛑 ${this.name} 任务执行结束`);
    }
  }
  
  /**
   * Prepare context for task processing
   */
  _prepareTaskContext(task) {
    const recentMemory = this.memory.shortTerm.slice(-5);
    const relevantKnowledge = this._retrieveRelevantKnowledge(task);
    const collaborationHistory = this._getRecentCollaborations();
    
    return {
      agent: {
        name: this.name,
        type: this.type,
        capabilities: this.capabilities,
        position: this.position,
        energy: this.energy
      },
      task: task,
      context: {
        recentMemory: recentMemory,
        relevantKnowledge: relevantKnowledge,
        collaborationHistory: collaborationHistory,
        networkState: this._getNetworkState()
      }
    };
  }
  
  /**
   * Process task with LLM
   */
  async _processWithLLM(context, task) {
    const prompt = this._constructPrompt(context, task);
    
    try {
      // 为Vercel环境使用更快速的模型和更少的token
      const model = process.env.VERCEL ? 'gpt-3.5-turbo' : this.aiConfig.model;
      const maxTokens = process.env.VERCEL ? 500 : this.aiConfig.maxTokens; // Vercel环境下进一步减少到500 token
      
      // 为Vercel环境添加更可靠的超时处理
      if (process.env.VERCEL) {
        // 使用手动创建Promise和setTimeout来确保超时能正常工作 (8秒超时)
        console.log(`   ⏱️ 设置8秒超时限制用于LLM处理`);
        return new Promise((resolve, reject) => {
          // 设置超时计时器
          const timeoutId = setTimeout(() => {
            console.log(`   ⏰ LLM处理超时`);
            resolve({
              content: "LLM处理超时，使用默认响应",
              reasoning: ['处理超时'],
              confidence: 0.3,
              tokens: 0
            });
          }, 8000);
          
          // 执行LLM处理
          this.openai.chat.completions.create({
            model: model,
            messages: [
              { role: 'system', content: this.aiConfig.systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: this.aiConfig.temperature,
            max_tokens: maxTokens,
          }).then(completion => {
            // 清除超时计时器
            clearTimeout(timeoutId);
            const response = completion.choices[0].message.content;
            
            // Parse structured response
            const parsedResponse = this._parseAIResponse(response);
            
            resolve({
              content: parsedResponse.content,
              reasoning: parsedResponse.reasoning,
              confidence: parsedResponse.confidence,
              tokens: completion.usage?.total_tokens || 0
            });
          }).catch(error => {
            // 清除超时计时器
            clearTimeout(timeoutId);
            // 捕获API调用错误
            console.error(`   ⚠️ OpenAI API error: ${error.message}`);
            resolve({
              content: `LLM处理遇到问题: ${error.message}`,
              reasoning: ['API错误'],
              confidence: 0.3,
              tokens: 0
            });
          });
        });
      } else {
        // 非Vercel环境的正常处理
        const completion = await this.openai.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: this.aiConfig.systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: this.aiConfig.temperature,
          max_tokens: maxTokens,
        });
        
        const response = completion.choices[0].message.content;
        
        // Parse structured response
        const parsedResponse = this._parseAIResponse(response);
        
        return {
          content: parsedResponse.content,
          reasoning: parsedResponse.reasoning,
          confidence: parsedResponse.confidence,
          tokens: completion.usage?.total_tokens || 0
        };
      }
      
    } catch (error) {
      console.error(`AI processing error for ${this.name}:`, error);
      
      // Fallback response
      return {
        content: `Error processing task: ${error.message}. Falling back to basic processing.`,
        reasoning: ['Error occurred during AI processing', 'Using fallback logic'],
        confidence: 0.3,
        tokens: 0
      };
    }
  }
  
  /**
   * Construct prompt for LLM
   */
  _constructPrompt(context, task) {
    // Limit context to prevent token overflow
    const recentMemory = context.context.recentMemory.slice(-2).map(m => m.content ? m.content.substring(0, 100) : '');
    const collaborationHistory = context.context.collaborationHistory.slice(-1).map(c => c.summary ? c.summary.substring(0, 50) : '');
    
    return `Task Analysis Request:

TASK:
Type: ${task.type}
Description: ${task.description}
Priority: ${task.priority}
Complexity: ${task.complexity}
Required Capabilities: ${task.requiredCapabilities?.slice(0, 3).join(', ') || 'None specified'}

YOUR CURRENT STATE:
Position: (${context.agent.position.x}, ${context.agent.position.y}, ${context.agent.position.z})
Energy: ${context.agent.energy}/100
Capabilities: ${context.agent.capabilities.slice(0, 3).join(', ')}

RECENT CONTEXT:
${recentMemory.slice(0, 2).map(m => `- ${m}`).join('\n')}

Please analyze this task and provide your response in the following JSON format:
{
  "content": "Your detailed analysis and solution (max 500 chars)",
  "reasoning": ["Step 1", "Step 2", "Step 3"],
  "confidence": 0.85,
  "insights": ["Key insight 1", "Key insight 2"],
  "collaboration_needs": ["What help you might need"]
}

Consider your unique perspective as a ${context.agent.type} agent.`;
  }
  
  /**
   * Parse AI response
   */
  _parseAIResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          content: parsed.content || response,
          reasoning: parsed.reasoning || ['AI analysis completed'],
          confidence: parsed.confidence || 0.7,
          insights: parsed.insights || [],
          questions: parsed.questions || [],
          collaborationNeeds: parsed.collaboration_needs || []
        };
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, using text parsing');
    }
    
    // Fallback to text parsing
    return {
      content: response,
      reasoning: ['Analysis provided by AI'],
      confidence: 0.7,
      insights: [],
      questions: [],
      collaborationNeeds: []
    };
  }
  
  /**
   * Generate real embeddings using OpenAI
   * 为Vercel环境优化嵌入生成
   */
  async _generateEmbedding(text) {
    console.log(`   📊 开始生成嵌入，文本长度: ${text.length}`);
    try {
      // 限制文本长度以提高速度
      const processedText = text.substring(0, 1000);
      
      // 为Vercel环境添加更完善的超时处理
      if (process.env.VERCEL) {
        console.log(`   ⏱️ 设置5秒超时限制`);
        
        // 使用手动创建Promise和setTimeout来确保超时能正常工作
        return new Promise((resolve, reject) => {
          // 设置超时计时器
          const timeoutId = setTimeout(() => {
            console.log(`   ⏰ 嵌入生成超时`);
            resolve(new Array(1536).fill(0).map(() => Math.random() - 0.5)); // 返回默认嵌入
          }, 5000);
          
          // 添加一个额外的安全超时，确保Promise一定会resolve
          const safetyTimeoutId = setTimeout(() => {
            console.log(`   ⏰ 安全超时触发`);
            clearTimeout(timeoutId);
            resolve(new Array(1536).fill(0).map(() => Math.random() - 0.5)); // 返回默认嵌入
          }, 6000); // 比主超时多1秒
          
          // 执行嵌入生成，并添加额外的错误处理
          try {
            // 使用async/await包装API调用，确保错误能被捕获
            (async () => {
              try {
                const response = await this.openai.embeddings.create({
                  model: 'text-embedding-ada-002',
                  input: processedText,
                });
                // 清除所有超时计时器
                clearTimeout(timeoutId);
                clearTimeout(safetyTimeoutId);
                console.log(`   ✅ 嵌入生成完成`);
                resolve(response.data[0].embedding);
              } catch (apiError) {
                // 清除所有超时计时器
                clearTimeout(timeoutId);
                clearTimeout(safetyTimeoutId);
                // 捕获API调用错误
                console.error(`   ⚠️ OpenAI API error: ${apiError.message}`);
                resolve(new Array(1536).fill(0).map(() => Math.random() - 0.5)); // 返回默认嵌入
              }
            })();
          } catch (error) {
            // 清除所有超时计时器
            clearTimeout(timeoutId);
            clearTimeout(safetyTimeoutId);
            // 捕获同步错误
            console.error(`   ⚠️ 同步错误: ${error.message}`);
            resolve(new Array(1536).fill(0).map(() => Math.random() - 0.5)); // 返回默认嵌入
          }
        });
      } else {
        // 非Vercel环境的正常处理
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: processedText,
        });
        console.log(`   ✅ 嵌入生成完成`);
        return response.data[0].embedding;
      }
    } catch (error) {
      console.error('Embedding generation error:', error.message);
      // Fallback to random embedding
      return new Array(1536).fill(0).map(() => Math.random() - 0.5);
    }
  }
  
  /**
   * Update semantic state after task processing
   */
  async _updateSemanticState(task, response) {
    try {
      // 为Vercel环境添加超时处理
      if (process.env.VERCEL) {
        // 使用手动创建Promise和setTimeout来确保超时能正常工作 (3秒超时)
        console.log(`   ⏱️ 设置3秒超时限制用于语义状态更新`);
        await new Promise((resolve, reject) => {
          // 设置超时计时器
          const timeoutId = setTimeout(() => {
            console.log(`   ⏰ 语义状态更新超时`);
            resolve(); // 超时时直接resolve，不抛出错误
          }, 3000);
          
          // 执行语义状态更新
          (async () => {
            try {
              // Generate new embedding based on task and response
              const combinedText = `${task.description} ${response.content}`;
              const newEmbedding = await this._generateEmbedding(combinedText);
              
              // Update agent's semantic embedding (weighted average)
              const weight = 0.1; // How much new information affects overall state
              for (let i = 0; i < this.semanticEmbedding.length && i < newEmbedding.length; i++) {
                this.semanticEmbedding[i] = this.semanticEmbedding[i] * (1 - weight) + newEmbedding[i] * weight;
              }
              
              // Update reasoning state
              this.reasoning.currentThought = response.content.substring(0, 200) + '...';
              this.reasoning.confidenceLevel = response.confidence;
              this.reasoning.reasoningChain.push({
                task: task.id,
                reasoning: response.reasoning,
                timestamp: Date.now()
              });
              
              // Limit reasoning chain size
              if (this.reasoning.reasoningChain.length > 10) {
                this.reasoning.reasoningChain.shift();
              }
              
              // 清除超时计时器
              clearTimeout(timeoutId);
              resolve();
            } catch (error) {
              // 清除超时计时器
              clearTimeout(timeoutId);
              // 捕获更新错误
              console.error(`   ⚠️ 语义状态更新错误: ${error.message}`);
              resolve(); // 错误时也直接resolve，不抛出错误
            }
          })();
        });
      } else {
        // 非Vercel环境的正常处理
        // Generate new embedding based on task and response
        const combinedText = `${task.description} ${response.content}`;
        const newEmbedding = await this._generateEmbedding(combinedText);
        
        // Update agent's semantic embedding (weighted average)
        const weight = 0.1; // How much new information affects overall state
        for (let i = 0; i < this.semanticEmbedding.length && i < newEmbedding.length; i++) {
          this.semanticEmbedding[i] = this.semanticEmbedding[i] * (1 - weight) + newEmbedding[i] * weight;
        }
        
        // Update reasoning state
        this.reasoning.currentThought = response.content.substring(0, 200) + '...';
        this.reasoning.confidenceLevel = response.confidence;
        this.reasoning.reasoningChain.push({
          task: task.id,
          reasoning: response.reasoning,
          timestamp: Date.now()
        });
        
        // Limit reasoning chain size
        if (this.reasoning.reasoningChain.length > 10) {
          this.reasoning.reasoningChain.shift();
        }
      }
    } catch (error) {
      console.error(`Semantic state update error for ${this.name}:`, error.message);
      // 忽略语义状态更新错误，继续执行
    }
  }
  
  /**
   * Background thinking process
   */
  async _backgroundThinking() {
    if (this.aiState.isProcessing || this.status !== 'idle') return;
    
    // 进一步简化后台思考过程，减少处理内容
    const recentExperiences = this.memory.shortTerm.slice(-1); // 从-2减少到-1
    if (recentExperiences.length > 0) { // 从>1改为>0
      await this._reflectOnExperiences(recentExperiences);
    }
    
    // 更新AI状态
    this._updateAIState();
  }
  
  /**
   * Reflect on recent experiences
   */
  async _reflectOnExperiences(experiences) {
    try {
      // 进一步限制反思内容以提高速度
      const limitedExperiences = experiences.slice(-1); // 从-2减少到-1
      
      // 简化反思提示以减少token使用
      const reflectionPrompt = `基于最近的经验进行简要反思:

${limitedExperiences.map((exp, i) => {
        const expSummary = JSON.stringify(exp).substring(0, 100) + '...';
        return `经验 ${i + 1}: ${expSummary}`;
      }).join('\n\n')}

提供非常简短的洞察(最多50个字)。`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是一个反思型AI代理。提供简洁的洞察。' },
          { role: 'user', content: reflectionPrompt }
        ],
        temperature: 0.6,
        max_tokens: 80, // 从150减少到80
      });
      
      const reflection = completion.choices[0].message.content;
      
      // 存储反思到长期记忆
      this._storeInMemory('reflection', {
        content: reflection,
        experiences: limitedExperiences.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error(`反思错误 ${this.name}:`, error.message);
    }
  }
  
  /**
   * Update AI state
   */
  _updateAIState() {
    const timeSinceLastThought = Date.now() - this.aiState.lastThought;
    
    // Adjust creativity based on recent activity
    if (timeSinceLastThought > 30000) { // 30 seconds of inactivity
      this.aiState.creativityLevel = Math.min(1.0, this.aiState.creativityLevel + 0.1);
    } else {
      this.aiState.creativityLevel = Math.max(0.1, this.aiState.creativityLevel - 0.05);
    }
    
    // Adjust focus based on energy
    this.aiState.focusLevel = this.energy / this.maxEnergy;
  }
  
  /**
   * Store information in memory
   */
  _storeInMemory(type, data) {
    // Truncate large data to prevent memory bloat
    const truncatedData = { ...data };
    if (truncatedData.content && typeof truncatedData.content === 'string') {
      truncatedData.content = truncatedData.content.substring(0, 500);
    }
    if (truncatedData.response && typeof truncatedData.response === 'string') {
      truncatedData.response = truncatedData.response.substring(0, 300);
    }
    
    const memoryItem = {
      type: type,
      data: truncatedData,
      timestamp: Date.now(),
      importance: this._calculateImportance(type, truncatedData)
    };
    
    // Add to short-term memory
    this.memory.shortTerm.push(memoryItem);
    
    // Manage memory size more aggressively
    if (this.memory.shortTerm.length > 20) { // Reduced from 50
      const transferred = this.memory.shortTerm.shift();
      
      // Transfer important items to long-term memory
      if (transferred.importance > 0.8) { // Increased threshold
        this.memory.longTerm.push(transferred);
      }
    }
    
    // Manage long-term memory size
    if (this.memory.longTerm.length > 50) { // Reduced from 100
      this.memory.longTerm.sort((a, b) => b.importance - a.importance);
      this.memory.longTerm = this.memory.longTerm.slice(0, 50);
    }
  }
  
  /**
   * Calculate memory importance
   */
  _calculateImportance(type, data) {
    const typeWeights = {
      'task_result': 0.8,
      'collaboration': 0.9,
      'reflection': 0.6,
      'learning': 0.7,
      'error': 0.5
    };
    
    let importance = typeWeights[type] || 0.5;
    
    // Adjust based on data characteristics
    if (data.confidence && data.confidence > 0.8) importance += 0.1;
    if (data.collaborationContext) importance += 0.1;
    
    return Math.min(1.0, importance);
  }
  
  /**
   * Retrieve relevant knowledge for a task
   */
  _retrieveRelevantKnowledge(task) {
    // Simple relevance matching based on keywords
    const taskKeywords = task.description.toLowerCase().split(' ');
    
    return this.memory.longTerm
      .filter(item => {
        const itemText = JSON.stringify(item.data).toLowerCase();
        return taskKeywords.some(keyword => itemText.includes(keyword));
      })
      .slice(0, 5); // Top 5 relevant memories
  }
  
  /**
   * Get recent collaboration history
   */
  _getRecentCollaborations() {
    return this.memory.shortTerm
      .filter(item => item.type === 'collaboration')
      .slice(-3)
      .map(item => ({
        summary: `Collaborated on ${item.data.task?.type || 'unknown'} task`,
        timestamp: item.timestamp
      }));
  }
  
  /**
   * Get collaboration context
   */
  _getCollaborationContext() {
    return {
      connectedAgents: this.connectionStrength.size,
      averageConnectionStrength: this._calculateAverageConnectionStrength(),
      position: this.position,
      recentCollaborations: this.collaborationHistory.size
    };
  }
  
  /**
   * Calculate average connection strength
   */
  _calculateAverageConnectionStrength() {
    if (this.connectionStrength.size === 0) return 0;
    
    const total = Array.from(this.connectionStrength.values())
      .reduce((sum, strength) => sum + strength, 0);
    
    return total / this.connectionStrength.size;
  }
  
  /**
   * Get network state
   */
  _getNetworkState() {
    return {
      totalConnections: this.connectionStrength.size,
      energyLevel: this.energy,
      position: this.position,
      memoryLoad: this.memory.shortTerm.length
    };
  }
  
  /**
   * Handle task received event
   */
  async _onTaskReceived(event) {
    this.addContext({
      type: 'task_notification',
      content: `Received task: ${event.task?.type || 'unknown'}`,
      relevance: 0.8
    });
  }
  
  /**
   * Handle collaboration request
   */
  async _onCollaborationRequest(event) {
    this.addContext({
      type: 'collaboration_request',
      content: `Collaboration requested by agent: ${event.sourceAgentId}`,
      relevance: 0.9
    });
    
    this._storeInMemory('collaboration', {
      type: 'request_received',
      sourceAgent: event.sourceAgentId,
      timestamp: Date.now()
    });
  }
  
  /**
   * Collaborate with another agent
   */
  async collaborateWith(otherAgent, task, context = {}) {
    try {
      // 简化协作提示以提高速度
      const collaborationPrompt = `你正在与${otherAgent.name} (${otherAgent.type})协作处理任务:

任务: ${task.description.substring(0, 100)}...

你的能力: ${this.capabilities.slice(0, 2).join(', ')}
其他代理的能力: ${otherAgent.capabilities.slice(0, 2).join(', ')}

请提供简洁的贡献(最多150个字符)。`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: `你是${this.name}，一个${this.type} AI代理。请简洁回答。` },
          { role: 'user', content: collaborationPrompt }
        ],
        temperature: this.aiConfig.temperature,
        max_tokens: 100, // 从200减少到100
      });
      
      const response = completion.choices[0].message.content;
      
      // 存储协作到内存
      this._storeInMemory('collaboration', {
        type: 'active_collaboration',
        partner: otherAgent.id,
        task: task.id,
        response: response.substring(0, 100), // 从200减少到100
        timestamp: Date.now()
      });
      
      return {
        agentId: this.id,
        response: response,
        confidence: 0.8,
        collaborationType: 'peer_discussion'
      };
      
    } catch (error) {
      console.error(`协作错误 ${this.name}:`, error.message);
      return {
        agentId: this.id,
        response: `我遇到困难，但想为${task.description.substring(0, 30)}...任务做出贡献`,
        confidence: 0.3,
        collaborationType: 'fallback'
      };
    }
  }
  
  /**
   * Get AI agent status with additional AI-specific info
   */
  getAIStatusSummary() {
    const baseStatus = this.getStatusSummary();
    
    return {
      ...baseStatus,
      ai: {
        model: this.aiConfig.model,
        isProcessing: this.aiState.isProcessing,
        currentThought: this.reasoning.currentThought,
        confidenceLevel: this.reasoning.confidenceLevel,
        creativityLevel: this.aiState.creativityLevel,
        focusLevel: this.aiState.focusLevel,
        memoryLoad: {
          shortTerm: this.memory.shortTerm.length,
          longTerm: this.memory.longTerm.length
        },
        personality: this.personality.traits,
        expertise: this.personality.expertise
      }
    };
  }
  
  /**
   * Cleanup AI resources
   */
  destroy() {
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
    }
    super.destroy?.();
  }
}

export default AIAgent;