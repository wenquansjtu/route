import { WebSocketClient } from './web/js/utils/WebSocketClient.js';

async function testConnection() {
  const client = new WebSocketClient();
  
  // Set up event handlers
  client.on('connected', () => {
    console.log('✅ Client connected successfully');
  });
  
  client.on('disconnected', (reason) => {
    console.log(`❌ Client disconnected: ${reason}`);
  });
  
  client.on('error', (error) => {
    console.log('❌ Client error:', error);
  });
  
  try {
    // Try to connect
    await client.connect('http://localhost:8080');
    console.log('🎉 Connection test completed');
    
    // Keep the process running for a bit to test stability
    setTimeout(() => {
      console.log('🔚 Test completed');
      client.disconnect();
      process.exit(0);
    }, 10000);
    
  } catch (error) {
    console.error('💥 Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();