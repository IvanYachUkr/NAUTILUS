#!/usr/bin/env node

import { parseCliOptions } from "../src/cli-options.js";
import { startOpenGuessrProxyServer } from "../src/http-server.js";
import { connectHttpUpstream } from "../src/upstream-client.js";

const HELP = `Usage: openguessr-mcp [--host 127.0.0.1] [--port 8931] [--upstream URL] [--audit-log FILE]

Runs a benchmark-safe OpenGuessr MCP proxy. The Playwright MCP upstream must
already be listening on a loopback URL (default: http://127.0.0.1:8932/mcp).
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stdout.write(HELP);
} else {
  try {
    const options = parseCliOptions(process.argv.slice(2));
    const server = await startOpenGuessrProxyServer({
      host: options.host,
      port: options.port,
      auditLogPath: options.auditLogPath,
      upstreamFactory: () => connectHttpUpstream(options.upstreamUrl),
    });
    process.stdout.write(
      `NAUTILUS OpenGuessr MCP listening at ${server.url}\nPlaywright MCP upstream: ${options.upstreamUrl}\n`,
    );

    let shuttingDown = false;
    const shutdown = async () => {
      if (shuttingDown) return;
      shuttingDown = true;
      await server.close();
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
