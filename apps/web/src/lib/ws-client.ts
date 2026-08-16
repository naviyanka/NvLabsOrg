import { GatewayEventSchema } from "@office/shared";
import { useOfficeStore } from "@/store/office-store";

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let currentUrl: string | null = null;
let currentSessionToken: string | null = null;

// Exponential backoff state
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
let reconnectDelay = RECONNECT_BASE_MS;
let reconnectAttempts = 0;

// Command queue — holds commands sent while disconnected, flushed on reconnect
const MAX_QUEUE_SIZE = 50;
const QUEUE_MAX_AGE_MS = 60000; // drop queued commands older than 60s
interface QueuedCommand {
  command: Record<string, unknown>;
  enqueuedAt: number;
}
let commandQueue: QueuedCommand[] = [];

export function connectToWs(wsUrl: string, sessionToken?: string) {
  // Clean up any existing connection first
  cleanup();
  currentUrl = wsUrl;
  currentSessionToken = sessionToken ?? null;
  reconnectDelay = RECONNECT_BASE_MS;
  reconnectAttempts = 0;
  commandQueue = [];
  doConnect();
}

function cleanup() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    // Remove handlers so close event doesn't trigger reconnect
    ws.onopen = null;
    ws.onmessage = null;
    ws.onclose = null;
    ws.onerror = null;
    ws.close();
    ws = null;
  }
}

function flushQueue() {
  if (!ws || ws.readyState !== WebSocket.OPEN || commandQueue.length === 0) return;

  const now = Date.now();
  // Filter out stale commands
  const valid = commandQueue.filter(q => now - q.enqueuedAt < QUEUE_MAX_AGE_MS);
  const dropped = commandQueue.length - valid.length;
  if (dropped > 0) {
    console.log(`[WS] Dropped ${dropped} stale queued command(s)`);
  }

  for (const q of valid) {
    console.log("[WS] Flushing queued command:", q.command.type);
    ws.send(JSON.stringify(q.command));
  }

  if (valid.length > 0) {
    console.log(`[WS] Flushed ${valid.length} queued command(s)`);
  }

  commandQueue = [];
}

function doConnect() {
  if (!currentUrl) return;

  const socket = new WebSocket(currentUrl);

  socket.onopen = () => {
    console.log(`[WS] Connected (after ${reconnectAttempts} retry attempts)`);
    // Reset backoff on successful connection
    reconnectDelay = RECONNECT_BASE_MS;
    reconnectAttempts = 0;
    // Send AUTH handshake first
    if (socket.readyState === WebSocket.OPEN && currentSessionToken) {
      socket.send(JSON.stringify({ type: "AUTH", sessionToken: currentSessionToken }));
    }
    useOfficeStore.getState().setConnected(true);
    // Send PING to get current agent statuses, then request persisted chat history
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "PING" }));
      socket.send(JSON.stringify({ type: "LOAD_CHAT_HISTORY" }));
      socket.send(JSON.stringify({ type: "LIST_COMMANDS" }));
    }
    // Flush any queued commands
    flushQueue();
  };

  socket.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      // Handle AUTH_FAILED: clear stale connection, redirect to re-pair
      if (msg.type === "AUTH_FAILED") {
        console.log("[WS] AUTH_FAILED — clearing connection and redirecting to /pair");
        cleanup();
        currentUrl = null;
        const { clearConnection } = require("@/lib/storage");
        clearConnection();
        window.location.href = "/pair";
        return;
      }
      const event = GatewayEventSchema.parse(msg);
      useOfficeStore.getState().handleEvent(event);
    } catch (err) {
      console.error("[WS] Invalid event:", err);
    }
  };

  socket.onclose = () => {
    console.log("[WS] Disconnected");
    useOfficeStore.getState().setConnected(false);
    // Only reconnect if this is still the active socket
    if (ws === socket && currentUrl) {
      ws = null;
      reconnectAttempts++;
      console.log(`[WS] Reconnecting in ${Math.round(reconnectDelay / 1000)}s (attempt #${reconnectAttempts})...`);
      reconnectTimer = setTimeout(doConnect, reconnectDelay);
      // Exponential backoff with jitter: 1s → 1.5s → 2.25s → ... → 30s max
      reconnectDelay = Math.min(reconnectDelay * 1.5 + Math.random() * 500, RECONNECT_MAX_MS);
    }
  };

  socket.onerror = () => {
    // Error is always followed by close, so just let onclose handle reconnect
  };

  ws = socket;
}

export function sendWsCommand(command: Record<string, unknown>) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    // Queue the command for delivery on reconnect
    if (commandQueue.length < MAX_QUEUE_SIZE) {
      commandQueue.push({ command, enqueuedAt: Date.now() });
      console.log(`[WS] Queued command (offline): ${command.type} (queue size: ${commandQueue.length})`);
    } else {
      console.warn(`[WS] Queue full (${MAX_QUEUE_SIZE}), dropping command:`, command.type);
    }
    return;
  }
  console.log("[WS] Sending command:", command.type, command);
  ws.send(JSON.stringify(command));
}

export function disconnectWs() {
  currentUrl = null;
  commandQueue = [];
  cleanup();
}

/** Get current connection state info (for debugging) */
export function getWsState(): { connected: boolean; queueSize: number; reconnectAttempts: number } {
  return {
    connected: ws?.readyState === WebSocket.OPEN,
    queueSize: commandQueue.length,
    reconnectAttempts,
  };
}
