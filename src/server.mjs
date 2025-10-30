import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });

// Register CORS plugin with poke.com origin
await fastify.register(cors, {
  origin: (origin, callback) => {
    const allowedOrigins = ['http://poke.com', 'https://poke.com', 'http://localhost', 'http://localhost:3000', 'http://127.0.0.1', 'http://127.0.0.1:3000'];
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
});

// Configuration from environment variables
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Health check endpoint
fastify.get('/healthz', async (request, reply) => {
  return { ok: true };
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

fastify.get('/.well-known/oauth-protected-resource/mcp', async (request, reply) => {
  return {
    resource: 'https://poke-oura-mcp-server.onrender.com/mcp',
    authorization_servers: ['https://poke-oura-mcp-server.onrender.com'],
    scopes_supported: ['mcp'],
    bearer_methods_supported: ['header'],
    resource_documentation: 'https://poke-oura-mcp-server.onrender.com/mcp'
  };
});

fastify.get('/.well-known/oauth-authorization-server', async (request, reply) => {
  return {
    issuer: 'https://poke-oura-mcp-server.onrender.com',
    token_endpoint: 'https://poke-oura-mcp-server.onrender.com/token',
    scopes_supported: ['mcp'],
    response_types_supported: ['none'],
    grant_types_supported: ['client_credentials']
  };
});

// Health and status endpoints
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Token endpoint for OAuth
fastify.post('/token', async (request, reply) => {
  return {
    access_token: 'mock_token',
    token_type: 'Bearer',
    expires_in: 3600
  };
});

// SSE endpoint for MCP
fastify.get('/sse', async (request, reply) => {
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.write('data: {"type":"connected"}\n\n');
});

// CORS preflight handler
fastify.options('*', async (request, reply) => {
  reply.code(204).send();
});

// Root route
fastify.get('/', async (request, reply) => {
  reply.type('application/json');
  return { ok: true, service: 'oura_mcp_server' };
});

// Main MCP endpoint that lists available tools
fastify.get('/mcp', async (request, reply) => {
  return { ok: true };
});

fastify.post('/mcp', async (request, reply) => {
  return { ok: true };
});

// Endpoint to list available tools
fastify.get('/mcp/tools', async (request, reply) => {
  return [
    {
      name: 'oura_sleep_check',
      description: 'Checks Oura sleep data and provides rest/train recommendation',
      parameters: {
        forceAlert: {
          type: 'boolean',
          description: 'Force an alert regardless of sleep score',
          default: false
        }
      }
    },
    {
      name: 'oura_sleep_summary',
      description: 'Get weekly sleep summary from Oura data',
      parameters: {}
    }
  ];
});

// Tool execution endpoint
fastify.post('/mcp/tools/:tool', async (request, reply) => {
  const { tool } = request.params;
  const args = request.body || {};
  
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
