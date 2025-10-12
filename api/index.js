import RealAICosmicServer from '../src/server-real-ai.js';

// Get or create server instance (singleton pattern for Vercel)
const server = RealAICosmicServer.getOrCreateInstance();

// Export the Express app for Vercel
export default server.app;

// 设置最大执行时间为120秒（2分钟），与vercel.json中的配置保持一致
export const maxDuration = 120;

// Export a config object for Vercel
export const config = {
  runtime: 'nodejs',
  regions: ['iad1']
};