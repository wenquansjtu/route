import RealAICosmicServer from '../src/server-real-ai.js';

// Get or create server instance (singleton pattern for Vercel)
const server = RealAICosmicServer.getOrCreateInstance();

// Export the Express app for Vercel
export default server.app;

// 设置最大执行时间为300秒（5分钟）
export const maxDuration = 300;

// Export a config object for Vercel
export const config = {
  runtime: 'nodejs',
  regions: ['iad1']
};