import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

const WS_PATH = "/ws";
const MAX_PAYLOAD_BYTES = 1024 * 1024;
const HEARTBEAT_INTERVAL_MS = 30000;

const matchSubscribers = new Map();

function subscribeToMatch(matchId, socket) {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }
  matchSubscribers.get(matchId).add(socket);
}

function unsubscribeFromMatch(matchId, socket) {
  if (matchSubscribers.has(matchId)) {
    matchSubscribers.get(matchId).delete(socket);
    if (matchSubscribers.get(matchId).size === 0) {
      matchSubscribers.delete(matchId);
    }
  }
}
function cleanupSubscriptions(socket) {
  for (const matchId of socket.subscriptions) {
    unsubscribeFromMatch(matchId, socket);
  }
}

function broadcastToMatch(matchId, payload) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers || subscribers.size === 0) return;
  const message = JSON.stringify(payload);
  for (const client of subscribers) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(message);
  }
}
function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
}

function handleMessage(socket, data) {
  let message;

  try {
    message = JSON.parse(data.toString());
  } catch {
    sendJson(socket, { type: "error", message: "Invalid message format" });
    return;
  }

  if (!message || typeof message !== "object") {
    sendJson(socket, { type: "error", message: "Invalid message format" });
    return;
  }

  if (message.type !== "subscribe" && message.type !== "unsubscribe") {
    sendJson(socket, { type: "error", message: "Unsupported message type" });
    return;
  }

  if (!Number.isInteger(message.matchId) || message.matchId <= 0) {
    sendJson(socket, { type: "error", message: "Invalid matchId" });
    return;
  }

  if (message.type === "subscribe") {
    subscribeToMatch(message.matchId, socket);
    socket.subscriptions.add(message.matchId);
    sendJson(socket, {
      type: "subscribed",
      matchId: message.matchId,
    });
    return;
  }

  unsubscribeFromMatch(message.matchId, socket);
  socket.subscriptions.delete(message.matchId);
  sendJson(socket, {
    type: "unsubscribed",
    matchId: message.matchId,
  });
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_PAYLOAD_BYTES,
  });

  server.on("upgrade", async (req, socket, head) => {
    const requestUrl = new URL(req.url ?? "", "http://localhost");
    if (requestUrl.pathname !== WS_PATH) {
      socket.destroy();
      return;
    }

    try {
      if (wsArcjet) {
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied) {
          const status = decision.reason.isRateLimit()
            ? "429 Too Many Requests"
            : "403 Forbidden";
          socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
          socket.destroy();
          return;
        }
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } catch (error) {
      console.error("Arcjet WS error:", error);
      socket.write(
        "HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n",
      );
      socket.destroy();
    }
  });

  function broadcastMatchCreated(match) {
    broadcast(wss, {
      type: "match_created",
      data: match,
    });
  }

  function broadcastCommentary(matchId, comment) {
    broadcastToMatch(matchId, { type: "commentary", data: comment });
  }

  // On connection
  wss.on("connection", (socket) => {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    socket.subscriptions = new Set();
    sendJson(socket, {
      type: "connected",
      message: "Welcome to the Match Updates WebSocket!",
    });
    socket.on("message", (data) => {
      handleMessage(socket, data);
    });
    socket.on("error", () => {
      socket.terminate();
    });
    socket.on("close", () => {
      cleanupSubscriptions(socket);
    });
  });
  const interval = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (socket.isAlive === false) {
        return socket.terminate();
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return { broadcastMatchCreated, broadcastCommentary };
}
