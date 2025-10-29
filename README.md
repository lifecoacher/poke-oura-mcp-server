# poke-oura-mcp-server

A Model Context Protocol (MCP) server that integrates with the Oura Ring API to monitor sleep patterns and send alerts when sleep quality falls below configured thresholds.

## Purpose

This server provides:
- Real-time sleep data monitoring from Oura Ring
- Configurable thresholds for sleep quality metrics
- Alerting system for poor sleep patterns
- MCP-compatible interface for integration with AI assistants

## Features

- **Sleep Score Monitoring**: Track daily sleep scores
- **Sleep Duration Tracking**: Monitor total sleep time
- **Sleep Latency Analysis**: Track time to fall asleep
- **Streak Detection**: Alert on consecutive poor sleep nights
- **Timezone Support**: Configurable timezone for accurate tracking

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your settings
3. Install dependencies: `npm install`
4. Run the server: `npm start`

## Configuration

See `.env.example` for available configuration options.

## License

MIT
