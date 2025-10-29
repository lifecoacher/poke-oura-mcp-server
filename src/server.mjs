import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

// Configuration from environment variables
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Health check endpoint
fastify.get('/healthz', async (request, reply) => {
  return { ok: true };
});

// MCP base endpoint - returns server manifest
fastify.get('/mcp', async (request, reply) => {
  reply.type('application/json');
  return {
    name: 'oura_mcp_server',
    version: '1.0.0',
    description: 'Oura Ring MCP Server for sleep tracking and training recommendations',
    ok: true
  };
});

// List available MCP tools
fastify.get('/mcp/tools', async (request, reply) => {
  reply.type('application/json');
  return {
    tools: [
      {
        name: 'oura_sleep_check',
        description: 'Check sleep data and determine if user should rest or train',
        inputSchema: {
          type: 'object',
          properties: {
            forceAlert: {
              type: 'boolean',
              description: 'Force an alert regardless of sleep score'
            }
          }
        }
      },
      {
        name: 'oura_sleep_summary',
        description: 'Get weekly sleep summary',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  };
});

// Run MCP tool endpoint
fastify.post('/mcp/tools/run', async (request, reply) => {
  const { tool, args = {} } = request.body;

  if (!tool) {
    return reply.code(400).send({ error: 'Tool name is required' });
  }

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
