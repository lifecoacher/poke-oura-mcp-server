import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });

// Register CORS plugin with poke.com origin
await fastify.register(cors, {
  origin: '*',
  credentials: false
});

// Configuration from environment variables
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Health check endpoint
fastify.get('/healthz', async (request, reply) => {
  return { ok: true };
});

// Root route for warmup
fastify.get('/', async (request, reply) => {
  return { status: 'ok', service: 'poke-oura-mcp-server' };
});

// OAuth discovery endpoints for Poke integration
fastify.get('/.well-known/oauth-protected-resource', async (request, reply) => {
  return {
    resource: 'https://poke-oura-mcp-server.onrender.com',
    authorization_servers: ['https://poke-oura-mcp-server.onrender.com'],
    scopes_supported: ['mcp'],
    bearer_methods_supported: ['header'],
    resource_documentation: 'https://poke-oura-mcp-server.onrender.com/mcp'
  };
});

fastify.get('/.well-known/oauth-authorization-server', async (request, reply) => {
  return {
    issuer: 'https://poke-oura-mcp-server.onrender.com',
    token_endpoint: 'https://poke-oura-mcp-server.onrender.com/oauth/token',
    authorization_endpoint: 'https://poke-oura-mcp-server.onrender.com/oauth/authorize',
    scopes_supported: ['mcp'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code']
  };
});

// MCP endpoints
fastify.get('/mcp', async (request, reply) => {
  reply.header('Content-Type', 'application/json; charset=utf-8');
  reply.header('Cache-Control', 'no-store');
  return {
    name: 'oura_mcp_server',
    version: '1.0.0',
    description: 'Oura Ring sleep data MCP server for Poke',
    tools: [
      {
        name: 'oura_sleep_check',
        description: 'Check your sleep quality and get a recommendation whether to train or rest today.',
        inputSchema: {
          type: 'object',
          properties: {
            forceAlert: {
              type: 'boolean',
              description: 'Force an alert for testing (default: false)'
            }
          }
        }
      },
      {
        name: 'oura_sleep_summary',
        description: 'Get a weekly summary of your sleep data.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  };
});

fastify.get('/mcp/tools', async (request, reply) => {
  reply.header('Content-Type', 'application/json; charset=utf-8');
  reply.header('Cache-Control', 'no-store');
  return {
    tools: [
      { name: 'oura_sleep_check' },
      { name: 'oura_sleep_summary' }
    ]
  };
});

fastify.post('/mcp', async (request, reply) => {
  const { tool, args } = request.body || {};
  
  switch (tool) {
    case 'oura_sleep_check':
      return handleOuraSleepCheck(args);
    
    case 'oura_sleep_summary':
      return handleOuraSleepSummary(args);
    
    default:
      return reply.code(404).send({ error: `Tool '${tool}' not found` });
  }
});

// Handler for oura_sleep_check tool
function handleOuraSleepCheck(args) {
  const { forceAlert = false } = args;
  
  // Placeholder sleep data (would come from Oura API integration)
  const sleepScore = forceAlert ? 65 : 85;
  const totalSleepMin = forceAlert ? 360 : 450;
  
  // Determine rest or train based on sleep score
  const recommendation = sleepScore >= 70 ? 'train' : 'rest';
  const alert = forceAlert || sleepScore < 70;
  
  return {
    sleepScore,
    totalSleepHours: (totalSleepMin / 60).toFixed(1),
    recommendation,
    alert,
    message: alert 
      ? `⚠️ Sleep score is ${sleepScore}. Consider resting today.`
      : `✅ Sleep score is ${sleepScore}. You're good to train!`
  };
}

// Handler for oura_sleep_summary tool
function handleOuraSleepSummary(args) {
  // Placeholder data (would come from Oura API integration)
  return {
    weeklyAverage: 82,
    trend: 'improving',
    daysWithGoodSleep: 5,
    daysWithPoorSleep: 2,
    message: '📊 Your sleep has been improving this week. Keep it up!'
  };
}

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Server listening on ${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
