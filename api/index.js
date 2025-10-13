import RealAICosmicServer from '../src/server-real-ai.js';

// Get or create server instance (singleton pattern for Vercel)
const server = RealAICosmicServer.getOrCreateInstance();

// Export the Express app for Vercel
export default server.app;

// 设置最大执行时间为90秒，与代码中的超时设置保持一致
export const maxDuration = 90;

// Export a config object for Vercel
export const config = {
  runtime: 'nodejs',
  maxDuration: 90,
};