import { ProfSmootAgent } from '../core/ProfSmootAgent.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Simple test to verify Prof. Smoot agent creation
 */
async function testProfSmoot() {
  console.log('Testing Prof. Smoot Agent Creation...\n');
  
  try {
    // Create Prof. Smoot agent
    const profSmoot = new ProfSmootAgent({
      openaiApiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('✅ Prof. Smoot Agent created successfully!');
    console.log(`Name: ${profSmoot.name}`);
    console.log(`Type: ${profSmoot.type}`);
    console.log(`Capabilities: ${profSmoot.capabilities.join(', ')}`);
    console.log(`Nobel Prize: ${profSmoot.nobelPrize.year} - ${profSmoot.nobelPrize.work}`);
    
    // Test specialized status method
    const status = profSmoot.getSpecializedStatus();
    console.log('\n📊 Prof. Smoot Status:');
    console.log(`Specialization: ${status.specialization}`);
    console.log(`Expertise: ${status.expertise.join(', ')}`);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProfSmoot().catch(console.error);