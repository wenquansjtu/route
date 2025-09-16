import RealAICosmicServer from '../src/server-real-ai.js';

// Create server instance
const server = new RealAICosmicServer();

// Export the Express app for Vercel
export default server.app;