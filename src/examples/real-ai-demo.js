import { RealAICollaborationEngine } from '../collaboration/RealAICollaborationEngine.js';
import { ProfSmootAgent } from '../core/ProfSmootAgent.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Real AI Collaboration Demo
 * Demonstrates actual AI agents working together using LLMs
 */
class RealAICollaborationDemo {
  constructor() {
    this.engine = new RealAICollaborationEngine({
      openaiApiKey: process.env.OPENAI_API_KEY
    });
    
    this.testScenarios = [
      {
        name: 'Business Strategy Analysis',
        task: {
          type: 'strategic_analysis',
          description: 'Develop a comprehensive strategy for a tech startup entering the AI-powered healthcare market. Consider market analysis, competitive landscape, technology requirements, regulatory challenges, and go-to-market strategy.',
          priority: 5,
          complexity: 85,
          requiredCapabilities: ['deep_analysis', 'logical_reasoning', 'information_synthesis', 'creative_thinking']
        }
      },
      {
        name: 'Ethical AI Framework',
        task: {
          type: 'ethical_analysis',
          description: 'Design an ethical framework for AI decision-making in autonomous vehicles. Address moral dilemmas, safety priorities, legal implications, and societal acceptance.',
          priority: 5,
          complexity: 90,
          requiredCapabilities: ['logical_reasoning', 'result_validation', 'creative_thinking', 'information_synthesis']
        }
      },
      {
        name: 'Climate Solution Innovation',
        task: {
          type: 'innovation_challenge',
          description: 'Propose innovative technological solutions to reduce carbon emissions in urban transportation. Consider feasibility, cost-effectiveness, implementation challenges, and scalability.',
          priority: 4,
          complexity: 80,
          requiredCapabilities: ['creative_thinking', 'deep_analysis', 'result_validation', 'information_synthesis']
        }
      }
    ];
  }
  
  async runFullDemo() {
    console.log('🤖 === Real AI Collaboration System Demo === 🤖\\n');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
      console.log('Please set your OpenAI API key in a .env file:');
      console.log('OPENAI_API_KEY=your_api_key_here');
      return;
    }
    
    try {
      // Create AI agent network
      await this.createAINetwork();
      
      // Run collaboration scenarios
      for (const scenario of this.testScenarios) {
        await this.runCollaborationScenario(scenario);
        console.log('\\n' + '='.repeat(80) + '\\n');
      }
      
      // Display final summary
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      this.engine.destroy();
    }
  }
  
  async createAINetwork() {
    console.log('🌐 Creating Real AI Agent Network...\\n');
    
    // First create Prof. Smoot as the specialized task allocation expert
    try {
      const profSmoot = new ProfSmootAgent({
        openaiApiKey: this.engine.config.openaiApiKey
      });
      this.engine.aiAgents.set(profSmoot.id, profSmoot);
      console.log(`✅ Created: ${profSmoot.name}`);
      console.log(`🏆 Nobel Prize Winner: ${profSmoot.nobelPrize.year} - ${profSmoot.nobelPrize.work}`);
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Failed to create Prof. Smoot:`, error.message);
    }
    
    const agentConfigs = [
      {
        name: 'Strategic Analyst AI',
        type: 'analyzer',
        capabilities: ['market_analysis', 'competitive_intelligence', 'data_interpretation'],
        expertise: ['business_strategy', 'market_research', 'financial_analysis'],
        systemPrompt: 'You are a strategic business analyst AI with deep expertise in market analysis and competitive intelligence. You excel at analyzing complex business environments and identifying strategic opportunities.'
      },
      {
        name: 'Ethics Reasoner AI',
        type: 'reasoner',
        capabilities: ['ethical_reasoning', 'philosophical_analysis', 'logical_argumentation'],
        expertise: ['ethics', 'philosophy', 'legal_frameworks'],
        systemPrompt: 'You are an ethics-focused AI specializing in moral reasoning and ethical frameworks. You analyze complex ethical dilemmas and provide well-reasoned moral guidance.'
      },
      {
        name: 'Innovation Synthesizer AI',
        type: 'synthesizer',
        capabilities: ['creative_synthesis', 'cross_domain_thinking', 'solution_integration'],
        expertise: ['innovation_management', 'design_thinking', 'technology_integration'],
        systemPrompt: 'You are an innovation-focused AI that excels at synthesizing ideas across domains and creating novel solutions. You combine diverse perspectives into coherent innovative approaches.'
      },
      {
        name: 'Technical Validator AI',
        type: 'validator',
        capabilities: ['technical_validation', 'feasibility_assessment', 'risk_analysis'],
        expertise: ['engineering', 'technology_assessment', 'implementation_planning'],
        systemPrompt: 'You are a technical validation AI with strong engineering and implementation expertise. You assess the feasibility and risks of proposed solutions.'
      },
      {
        name: 'Creative Vision AI',
        type: 'innovator',
        capabilities: ['breakthrough_thinking', 'future_visioning', 'disruptive_innovation'],
        expertise: ['futurism', 'emerging_technologies', 'paradigm_shifts'],
        systemPrompt: 'You are a visionary AI focused on breakthrough innovations and future possibilities. You think beyond conventional boundaries and envision transformative solutions.'
      }
    ];
    
    for (const config of agentConfigs) {
      try {
        const agent = await this.engine.createAIAgent(config);
        console.log(`✅ Created: ${agent.name}`);
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Failed to create ${config.name}:`, error.message);
      }
    }
    
    const status = this.engine.getCollaborationStatus();
    console.log(`\\n🎯 AI Network Ready: ${status.totalAIAgents} agents active\\n`);
  }
  
  async runCollaborationScenario(scenario) {
    console.log(`🎭 Scenario: ${scenario.name}`);
    console.log(`📋 Challenge: ${scenario.task.description}\\n`);
    
    const startTime = Date.now();
    
    try {
      const result = await this.engine.submitCollaborativeTask(scenario.task);
      const duration = Date.now() - startTime;
      
      console.log(`\\n🎉 Collaboration Completed in ${duration}ms\\n`);
      
      this.displayCollaborationResult(result, scenario.name);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Scenario '${scenario.name}' failed:`, error.message);
      return null;
    }
  }
  
  displayCollaborationResult(result, scenarioName) {
    console.log(`📊 === ${scenarioName} Results ===\\n`);
    
    console.log('🤝 Participating Agents:');
    Object.entries(result.participantContributions).forEach(([agentId, contribution]) => {
      console.log(`   • ${contribution.agentName} (${contribution.agentType})`);
      console.log(`     Capabilities: ${contribution.capabilities.join(', ')}`);
    });
    
    console.log(`\\n🧠 Synthesized by: ${result.synthesizedBy}`);
    console.log(`⚡ Processing tokens: ${result.metadata.tokensUsed}`);
    console.log(`🔄 Iterations: ${result.metadata.iterations}`);
    
    console.log(`\\n📝 Final Collaborative Analysis:`);
    console.log('━'.repeat(60));
    console.log(result.finalResult);
    console.log('━'.repeat(60));
    
    console.log(`\\n📈 Collaboration Metrics:`);
    const metrics = result.convergenceMetrics;
    if (metrics.convergenceAchieved) {
      console.log(`   ✅ Convergence: Achieved`);
      console.log(`   🎯 Consensus Level: ${(metrics.finalConsensus * 100).toFixed(1)}%`);
      console.log(`   ⚡ Efficiency: ${(metrics.collaborationEfficiency * 100).toFixed(1)}%`);
      console.log(`   🌈 Diversity Index: ${metrics.diversityIndex.toFixed(2)}`);
    } else {
      console.log(`   ⚠️ Convergence: Partial`);
    }
  }
  
  displaySummary() {
    console.log('📊 === Real AI Collaboration Demo Summary ===\\n');
    
    const status = this.engine.getCollaborationStatus();
    
    console.log('🎯 System Performance:');
    console.log(`   • Total AI Agents: ${status.totalAIAgents}`);
    console.log(`   • Collaborations Completed: ${status.recentSessions.length}`);
    console.log(`   • Success Rate: ${status.recentSessions.filter(s => s.status === 'completed').length}/${status.recentSessions.length}`);
    
    console.log('\\n🧠 AI Agent Performance:');
    status.aiAgents.forEach(agent => {
      console.log(`   • ${agent.name}:`);
      console.log(`     Status: ${agent.status}`);
      console.log(`     Energy: ${agent.energy}/${agent.maxEnergy}`);
      console.log(`     Focus: ${(agent.ai.focusLevel * 100).toFixed(1)}%`);
      console.log(`     Memory Load: ${agent.ai.memoryLoad.shortTerm}/${agent.ai.memoryLoad.longTerm}`);
      if (agent.specialization) {
        console.log(`     Specialization: ${agent.specialization}`);
      }
    });
    
    console.log('\\n✨ Key Achievements:');
    console.log('   • ✅ Real LLM-powered AI agents with unique personalities');
    console.log('   • ✅ Multi-phase collaboration (Analysis → Discussion → Synthesis)');
    console.log('   • ✅ Automatic convergence detection and consensus building');
    console.log('   • ✅ Dynamic agent selection based on task requirements');
    console.log('   • ✅ Real semantic embeddings and intelligent memory management');
    console.log('   • ✅ Structured reasoning chains and confidence tracking');
    console.log('   • ✅ Prof. George Smoot as specialized task allocation expert');
    
    console.log('\\n🌌 Prof. Smoot\'s Contributions:');
    console.log('   • Nobel Prize in Physics (2006) for cosmic microwave background radiation');
    console.log('   • Expertise in gravitational anisotropy and cosmic structure theory');
    console.log('   • Application of cosmic principles to AI network optimization');
    console.log('   • Leadership in multi-agent collaboration optimization');
    
    console.log('\\n🌟 This demonstrates a fully functional real AI multi-agent');
    console.log('   collaboration system based on cosmic structure theory!');
  }
}

// Run the demo
async function main() {
  const demo = new RealAICollaborationDemo();
  await demo.runFullDemo();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n👋 Demo interrupted by user');
  process.exit(0);
});

// Start demo
main().catch(console.error);

export default RealAICollaborationDemo;