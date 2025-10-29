import Fastify from 'fastify';

const fastify = Fastify({
  logger: true
});

// Configuration from environment variables
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Health check endpoint
fastify.get('/healthz', async (request, reply) => {
  return { ok: true };
});

// List available MCP tools
fastify.get('/mcp/tools', async (request, reply) => {
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
    sleep_score: sleepScore,
    total_sleep_min: totalSleepMin,
    recommendation: recommendation,
    alert: alert,
    message: alert 
      ? `Low sleep score (${sleepScore}). Consider resting today.` 
      : `Good sleep score (${sleepScore}). Ready to train!`
  };
}

// Handler for oura_sleep_summary tool
function handleOuraSleepSummary(args) {
  // Placeholder weekly summary (would come from Oura API integration)
  return {
    period: 'last_7_days',
    average_sleep_score: 82,
    average_sleep_duration_min: 420,
    total_nights: 7,
    nights_below_threshold: 2,
    summary: 'Week summary stub - placeholder for real Oura API integration'
  };
}

// Start the server
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
