import { randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import http from "node:http";
import { dirname, resolve } from "node:path";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";

import { createOpenGuessrProxy } from "./proxy.js";

const SERVER_INFO = { name: "nautilus-openguessr-mcp", version: "0.1.0" };

export async function startOpenGuessrProxyServer({
  upstreamFactory,
  host = "127.0.0.1",
  port = 8931,
  auditLogPath,
} = {}) {
  if (typeof upstreamFactory !== "function") {
    throw new TypeError("upstreamFactory is required.");
  }
  if (!isLoopbackHost(host)) {
    throw new Error("The OpenGuessr MCP must bind to a loopback host.");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new RangeError("port must be an integer between 0 and 65535.");
  }

  let onAuditEvent;
  if (auditLogPath !== undefined) {
    if (typeof auditLogPath !== "string" || !auditLogPath.trim()) {
      throw new TypeError("auditLogPath must be a non-empty file path.");
    }
    const resolvedAuditLogPath = resolve(auditLogPath);
    mkdirSync(dirname(resolvedAuditLogPath), { recursive: true });
    onAuditEvent = (event) => {
      appendFileSync(resolvedAuditLogPath, `${JSON.stringify(event)}\n`, "utf8");
    };
  }

  const sessions = new Map();
  let closing = false;
  const httpServer = http.createServer(async (request, response) => {
    try {
      await routeRequest({ request, response, sessions, upstreamFactory, onAuditEvent });
    } catch (error) {
      if (!response.headersSent) {
        sendJson(response, 500, rpcError(-32603, safeError(error)));
      } else {
        response.destroy(error instanceof Error ? error : undefined);
      }
    }
  });

  await new Promise((resolve, reject) => {
    const onError = (error) => {
      httpServer.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      httpServer.off("error", onError);
      resolve();
    };
    httpServer.once("error", onError);
    httpServer.once("listening", onListening);
    httpServer.listen(port, host);
  });

  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("The OpenGuessr MCP server did not expose a TCP address.");
  }

  return {
    host,
    port: address.port,
    url: `http://${hostForUrl(host)}:${address.port}/mcp`,
    async close() {
      if (closing) return;
      closing = true;
      await Promise.allSettled(
        [...new Set(sessions.values())].map(async (session) => {
          await session.server.close().catch(() => {});
          await disposeSession(session, sessions);
        }),
      );
      await new Promise((resolve) => httpServer.close(resolve));
    },
  };
}

async function routeRequest({ request, response, sessions, upstreamFactory, onAuditEvent }) {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname === "/healthz") {
    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" }).end();
      return;
    }
    sendJson(response, 200, { ok: true, service: SERVER_INFO.name });
    return;
  }
  if (url.pathname !== "/mcp") {
    sendJson(response, 404, { error: "Not found" });
    return;
  }
  if (request.headers.origin) {
    sendJson(response, 403, rpcError(-32000, "Browser-origin requests are not accepted."));
    return;
  }

  const sessionId = singleHeader(request.headers["mcp-session-id"]);
  if (request.method === "POST") {
    const body = await readJsonBody(request);
    if (sessionId && sessions.has(sessionId)) {
      await sessions.get(sessionId).transport.handleRequest(request, response, body);
      return;
    }
    if (sessionId || !isInitializeRequest(body)) {
      sendJson(response, 400, rpcError(-32000, "No valid MCP session was provided."));
      return;
    }

    const session = await createSession({ upstreamFactory, sessions, onAuditEvent });
    try {
      await session.transport.handleRequest(request, response, body);
    } catch (error) {
      await session.server.close().catch(() => {});
      await disposeSession(session, sessions);
      throw error;
    }
    return;
  }

  if (request.method === "GET" || request.method === "DELETE") {
    const session = sessionId ? sessions.get(sessionId) : null;
    if (!session) {
      sendJson(response, 400, rpcError(-32000, "No valid MCP session was provided."));
      return;
    }
    await session.transport.handleRequest(request, response);
    return;
  }

  response.writeHead(405, { Allow: "GET, POST, DELETE" }).end();
}

async function createSession({ upstreamFactory, sessions, onAuditEvent }) {
  const upstream = await upstreamFactory();
  const proxy = createOpenGuessrProxy({ upstream, onAuditEvent });
  let session;
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized(sessionId) {
      sessions.set(sessionId, session);
    },
  });
  const server = createMcpServer(proxy);
  session = { upstream, proxy, transport, server, disposed: false };
  transport.onclose = () => {
    void disposeSession(session, sessions);
  };
  await server.connect(transport);
  return session;
}

function createMcpServer(proxy) {
  const server = new Server(SERVER_INFO, {
    capabilities: { tools: {} },
    instructions:
      "Use visual browser tools to inspect OpenGuessr. Choose geography yourself, then use the OpenGuessr tools only to place, verify, submit, and continue. Hidden answer data is unavailable.",
  });
  server.setRequestHandler(ListToolsRequestSchema, () => proxy.listTools());
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      return await proxy.callTool(request.params);
    } catch (error) {
      return {
        content: [{ type: "text", text: safeError(error) }],
        isError: true,
      };
    }
  });
  return server;
}

async function disposeSession(session, sessions) {
  if (session.disposed) return;
  session.disposed = true;
  for (const [sessionId, candidate] of sessions) {
    if (candidate === session) sessions.delete(sessionId);
  }
  await session.upstream?.close?.().catch(() => {});
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("MCP request body exceeds 1 MiB.");
    chunks.push(chunk);
  }
  if (!chunks.length) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
  });
  response.end(payload);
}

function rpcError(code, message) {
  return { jsonrpc: "2.0", error: { code, message }, id: null };
}

function singleHeader(value) {
  return Array.isArray(value) ? value[0] : value;
}

function safeError(error) {
  return error instanceof Error ? error.message : String(error);
}

function isLoopbackHost(host) {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

function hostForUrl(host) {
  return host.includes(":") ? `[${host}]` : host;
}
