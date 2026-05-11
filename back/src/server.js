import { randomUUID } from "node:crypto";
import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const heartbeatIntervalMs = 10000;
const heartbeatTimeoutMs = 30000;
const maxTextLength = 500;
const maxPayloadBytes = 2048;

// Rate limiting: sliding window, max 3 messages per second
const rateLimitWindowMs = 1000;
const rateLimitMax = 3;

// Connection limits
const maxConnectionsTotal = 500;
const maxConnectionsPerIp = 10;
const ipConnectionCount = new Map();
const ipMessageTimestamps = new Map();
let todayCountKey = getTodayKey();
let todayBoatCount = 0;

// Origin allowlist — set ALLOWED_ORIGINS=http://example.com,https://example.com in production
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS;
const allowedOrigins = rawAllowedOrigins
  ? new Set(rawAllowedOrigins.split(",").map((o) => o.trim()))
  : null; // null = allow all (dev mode)

/**
 * Resolve the client IP used for connection caps and rate limiting.
 *
 * Nginx supplies X-Real-IP in Docker/production; local development falls back
 * to the direct socket address.
 */
function getClientIp(req) {
  return (
    req.headers["x-real-ip"] ??
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ??
    req.socket.remoteAddress ??
    "unknown"
  );
}

/**
 * Return the UTC calendar key for daily counts.
 *
 * The count is intentionally in-memory: it resets on date change or process
 * restart, and message text is never persisted.
 */
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Read today's boat count, resetting the in-memory counter when the day rolls over.
 */
function getTodayBoatCount() {
  const currentKey = getTodayKey();
  if (currentKey !== todayCountKey) {
    todayCountKey = currentKey;
    todayBoatCount = 0;
  }

  return todayBoatCount;
}

/**
 * Increment and return the backend-owned daily boat count.
 */
function incrementTodayBoatCount() {
  getTodayBoatCount();
  todayBoatCount += 1;
  return todayBoatCount;
}

const server = http.createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, {
      "content-type": "application/json",
      "x-content-type-options": "nosniff",
      "cache-control": "no-store",
    });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  response.writeHead(404);
  response.end();
});

const wss = new WebSocketServer({
  server,
  path: "/ws",
  maxPayload: maxPayloadBytes,
  verifyClient: ({ origin, req }, callback) => {
    // Reject cross-site WebSocket hijacking attempts when production origins are configured.
    if (allowedOrigins && (!origin || !allowedOrigins.has(origin))) {
      callback(false, 403, "Forbidden origin");
      return;
    }

    // Reject when server is overloaded
    if (wss.clients.size >= maxConnectionsTotal) {
      callback(false, 503, "Server overloaded");
      return;
    }

    // Per-IP connection cap
    const ip = getClientIp(req);
    const count = ipConnectionCount.get(ip) ?? 0;
    if (count >= maxConnectionsPerIp) {
      callback(false, 429, "Too many connections from your IP");
      return;
    }

    callback(true);
  },
});

/**
 * Broadcast a realtime protocol message to every currently open WebSocket.
 *
 * Payloads are transient; this server does not store boat messages after send.
 */
function broadcast(payload) {
  const data = JSON.stringify(payload);

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

/**
 * Publish the number of currently connected WebSocket clients.
 */
function broadcastViewerCount() {
  broadcast({
    type: "viewer:count",
    count: wss.clients.size,
  });
}

/**
 * Parse an incoming WebSocket payload as JSON.
 *
 * Malformed client messages are ignored instead of logged, so user-entered
 * text does not leak into server logs.
 */
function parseMessage(rawMessage) {
  try {
    return JSON.parse(rawMessage.toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Normalize user text before broadcasting it to connected clients.
 *
 * Control and directional formatting characters are stripped to avoid invisible
 * payload tricks, then text is capped to the public UI limit.
 */
function sanitizeText(raw) {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .normalize("NFC")
    .trim()
    .slice(0, maxTextLength);
}

wss.on("connection", (socket, request) => {
  const ip = getClientIp(request);
  ipConnectionCount.set(ip, (ipConnectionCount.get(ip) ?? 0) + 1);

  socket.lastPongAt = Date.now();

  socket.send(
    JSON.stringify({
      type: "boat:count",
      count: getTodayBoatCount(),
      date: todayCountKey,
    }),
  );

  socket.send(
    JSON.stringify({
      type: "viewer:count",
      count: wss.clients.size,
    }),
  );

  broadcastViewerCount();

  socket.on("pong", () => {
    socket.lastPongAt = Date.now();
  });

  socket.on("close", () => {
    const count = ipConnectionCount.get(ip) ?? 1;
    if (count <= 1) {
      ipConnectionCount.delete(ip);
      ipMessageTimestamps.delete(ip);
    } else {
      ipConnectionCount.set(ip, count - 1);
    }

    broadcastViewerCount();
  });

  socket.on("message", (rawMessage) => {
    const now = Date.now();

    // Sliding window rate limit per IP — aggregates across all connections from same IP
    const timestamps = (ipMessageTimestamps.get(ip) ?? []).filter(
      (t) => now - t < rateLimitWindowMs,
    );

    if (timestamps.length >= rateLimitMax) {
      socket.send(
        JSON.stringify({
          type: "error",
          code: "RATE_LIMITED",
          message: "Messages can be sent at most 3 times per second.",
        }),
      );
      return;
    }

    const message = parseMessage(rawMessage);
    if (!message || typeof message !== "object") return;

    const { type, text } = message;
    if (type !== "boat:add" || typeof text !== "string") return;

    const sanitized = sanitizeText(text);
    if (!sanitized) return;

    timestamps.push(now);
    ipMessageTimestamps.set(ip, timestamps);

    const count = incrementTodayBoatCount();

    broadcast({
      type: "boat:add",
      id: randomUUID(),
      text: sanitized,
      createdAt: new Date().toISOString(),
      todayCount: count,
    });
  });
});

const heartbeatTimer = setInterval(() => {
  const now = Date.now();

  for (const client of wss.clients) {
    if (now - client.lastPongAt > heartbeatTimeoutMs) {
      client.terminate();
      continue;
    }

    if (client.readyState === WebSocket.OPEN) {
      client.ping();
    }
  }
}, heartbeatIntervalMs);

wss.on("close", () => {
  clearInterval(heartbeatTimer);
});

function shutdown() {
  clearInterval(heartbeatTimer);
  wss.close(() => server.close(() => process.exit(0)));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(port, () => {
  console.log(`flow realtime server listening on ws://localhost:${port}/ws`);
});
