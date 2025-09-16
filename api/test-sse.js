// Vercel serverless function for testing SSE endpoint
export default function handler(request, response) {
  // Set SSE headers
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send a simple test message
  response.write(`data: ${JSON.stringify({ message: 'SSE endpoint is working!' })}\n\n`);
  
  // End the response
  response.end();
}