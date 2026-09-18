import { WebSocketServer, WebSocket } from "ws";
import { WSMessage } from "./types.js";
import {
  getBoardState,
  handleMoveTask,
  handleAddTask,
} from "./boardState.js";

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3001;
const wss = new WebSocketServer({ port: PORT });

const clients = new Set<WebSocket>();

function broadcast(message: WSMessage) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function broadcastUserCount() {
  broadcast({
    type: "USER_COUNT",
    payload: clients.size,
  });
}

wss.on("connection", (ws: WebSocket, req) => {
  clients.add(ws);
  const clientIp = req.socket.remoteAddress;
  console.log(`[WS Server] Client connected from ${clientIp}. Total active clients: ${clients.size}`);

  // 1. Send immediate full SYNC_STATE snapshot to the newly connected client
  const currentBoard = getBoardState();
  ws.send(JSON.stringify({
    type: "SYNC_STATE",
    payload: currentBoard,
  }));

  // 2. Broadcast updated user count to all clients
  broadcastUserCount();

  ws.on("message", (raw: string) => {
    try {
      const message: WSMessage = JSON.parse(raw.toString());
      console.log(`[WS Server] Received message: ${message.type}`);

      switch (message.type) {
        case "MOVE_TASK": {
          const updatedState = handleMoveTask(message.payload);
          console.log(`[WS Server] MOVE_TASK applied: task ${message.payload.taskId} -> col ${message.payload.toColumnId} (idx ${message.payload.toIndex})`);
          broadcast({
            type: "SYNC_STATE",
            payload: updatedState,
          });
          break;
        }

        case "ADD_TASK": {
          const updatedState = handleAddTask(message.payload);
          console.log(`[WS Server] ADD_TASK applied: "${message.payload.title}" in ${message.payload.columnId}`);
          broadcast({
            type: "SYNC_STATE",
            payload: updatedState,
          });
          break;
        }

        default:
          console.warn(`[WS Server] Unhandled message type: ${(message as any).type}`);
      }
    } catch (err) {
      console.error("[WS Server] Error parsing or processing incoming message:", err);
    }
  });

  ws.on("close", (code, reason) => {
    clients.delete(ws);
    console.log(`[WS Server] Client disconnected (${code} - ${reason || "no reason"}). Remaining clients: ${clients.size}`);
    broadcastUserCount();
  });

  ws.on("error", (err) => {
    console.error("[WS Server] Client connection error:", err);
  });
});

wss.on("listening", () => {
  console.log(`=======================================================`);
  console.log(`[WS Server] PulseBoard WebSocket Server listening on ws://localhost:${PORT}`);
  console.log(`=======================================================`);
});

wss.on("error", (err) => {
  console.error("[WS Server] Fatal server error:", err);
});
