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
    ok: true,
    tools: [
      {
        name: 'oura_sleep_check',
        description: 'Check your sleep and get training recommendation',
        inputSchema: {
          type: 'object',
          properties: {
            forceAlert: {
              type: 'boolean',
              description: 'Force an alert for testing purposes',
              default: false
            }
          }
        }
      },
      {
        name: 'oura_sleep_summary',
        description: 'Get a summary of your weekly sleep trends',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  };
});

fastify.get('/mcp/tools', async (request, reply) => {
  return {
    tools: [
      {
        name: 'oura_sleep_check',
        description: 'Check your sleep and get training recommendation'
      },
      {
        name: 'oura_sleep_summary',
        description: 'Get a summary of your weekly sleep trends'
      }
    ]
  };
});

fastify.post('/mcp', async (request, reply) => {
  const { tool, args } = request.body;
  
  switch (tool) {
    case 'oura_sleep_check':
      return handleOuraSleepCheck(args);
    
    case 'oura_sleep_summary':
      return handleOuraSleepSummary(args);
    
    default:
      return reply.code(404).send({ error: `Tool '${tool}' not found` });
  }
});

// SSE endpoint for MCP SSE transport
fastify.get('/mcp/sse', async (request, reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  reply.raw.write('event: endpoint\n');
  reply.raw.write('data: {"endpoint":"/mcp/message"}\n\n');

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    reply.raw.write(': heartbeat\n\n');
  }, 30000);

  // Clean up on disconnect
  request.raw.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Message endpoint for MCP SSE transport
fastify.post('/mcp/message', async (request, reply) => {
  try {
    const { method, params } = request.body;

    // Handle different MCP methods
    switch (method) {
      case 'initialize':
        return {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'oura_mcp_server',
            version: '1.0.0'
          }
        };

      case 'tools/list':
        return {
          tools: [
            {
              name: 'oura_sleep_check',
              description: 'Check your sleep and get training recommendation',
              inputSchema: {
                type: 'object',
                properties: {
                  forceAlert: {
                    type: 'boolean',
                    description: 'Force an alert for testing purposes',
                    default: false
                  }
                }
              }
            },
            {
              name: 'oura_sleep_summary',
              description: 'Get a summary of your weekly sleep trends',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        };

      case 'tools/call':
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};

        switch (toolName) {
          case 'oura_sleep_check':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(handleOuraSleepCheck(toolArgs))
                }
              ]
            };

          case 'oura_sleep_summary':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(handleOuraSleepSummary(toolArgs))
                }
              ]
            };

          default:
            return reply.code(404).send({ error: `Tool '${toolName}' not found` });
        }

      default:
        return reply.code(400).send({ error: `Method '${method}' not supported` });
    }
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
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
