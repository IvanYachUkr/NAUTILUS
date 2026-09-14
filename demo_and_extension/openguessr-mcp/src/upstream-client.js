import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export async function connectHttpUpstream(value) {
  const url = value instanceof URL ? value : new URL(value);
  if (!isLoopbackHostname(url.hostname)) {
    throw new Error("The Playwright MCP upstream must use a loopback URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("The Playwright MCP upstream must use HTTP or HTTPS.");
  }

  let connection = await openConnection(url);
  let closed = false;
  let resetPromise = null;

  async function resetAfterTimeout(staleConnection) {
    if (closed || connection !== staleConnection) return;
    if (!resetPromise) {
      resetPromise = (async () => {
        await staleConnection.client.close().catch(() => {});
        if (!closed && connection === staleConnection) {
          connection = await openConnection(url);
        }
      })().finally(() => {
        resetPromise = null;
      });
    }
    await resetPromise;
  }

  return {
    listTools: () => connection.client.listTools(),
    async callTool(request, options = {}) {
      const activeConnection = connection;
      try {
        return await activeConnection.client.callTool(request, undefined, {
          timeout: options.timeout,
          maxTotalTimeout: options.maxTotalTimeout,
        });
      } catch (error) {
        if (isRequestTimeout(error)) {
          await resetAfterTimeout(activeConnection);
        }
        throw error;
      }
    },
    async close() {
      if (closed) return;
      closed = true;
      await resetPromise?.catch(() => {});
      await connection.client.close();
    },
  };
}

async function openConnection(url) {
  const client = new Client({
    name: "nautilus-openguessr-mcp-proxy",
    version: "0.1.0",
  });
  const transport = new StreamableHTTPClientTransport(url);
  await client.connect(transport);
  return { client, transport };
}

function isRequestTimeout(error) {
  const message = error instanceof Error ? error.message : String(error);
  return error?.code === -32001 || /Request\s*timed?\s*out|RequestTimeout/i.test(message);
}

function isLoopbackHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}
