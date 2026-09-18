import { WSMessage } from "../types/board";

export interface WSClientOptions {
  url?: string;
  onMessage?: (message: WSMessage) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onReconnecting?: (attempt: number, delayMs: number) => void;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

export class WSClient {
  private socket: WebSocket | null = null;
  private url: string;
  private options: WSClientOptions;
  private isExplicitlyClosed = false;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly initialDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly backoffFactor: number;

  constructor(options: WSClientOptions = {}) {
    this.options = options;
    this.initialDelayMs = options.initialDelayMs ?? 1000;
    this.maxDelayMs = options.maxDelayMs ?? 16000;
    this.backoffFactor = options.backoffFactor ?? 2;

    const defaultUrl =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:3001`
        : "ws://localhost:3001";
    this.url = options.url || defaultUrl;
  }

  public connect(): void {
    if (typeof window === "undefined") return;
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.clearReconnectTimer();

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log(`[WSClient] Connected to WebSocket server at ${this.url}`);
        this.reconnectAttempts = 0;
        this.options.onOpen?.();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.options.onMessage?.(message);
        } catch (err) {
          console.error("[WSClient] Error parsing incoming WebSocket message:", err, event.data);
        }
      };

      this.socket.onclose = (event: CloseEvent) => {
        console.log(
          `[WSClient] Disconnected from WebSocket server (code: ${event.code}, reason: ${event.reason || "none"})`
        );
        this.options.onClose?.(event);

        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (event: Event) => {
        console.warn("[WSClient] WebSocket encountered an error event:", event);
        this.options.onError?.(event);
      };
    } catch (err) {
      console.error("[WSClient] Failed to instantiate WebSocket:", err);
      if (!this.isExplicitlyClosed) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    // Exponential backoff calculation: min(initialDelay * (factor ^ attempts), maxDelay)
    const delay = Math.min(
      this.initialDelayMs * Math.pow(this.backoffFactor, this.reconnectAttempts),
      this.maxDelayMs
    );
    this.reconnectAttempts++;

    console.log(
      `[WSClient] Exponential Backoff: Reconnecting in ${delay}ms (attempt #${this.reconnectAttempts})...`
    );
    this.options.onReconnecting?.(this.reconnectAttempts, delay);

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  public send(message: WSMessage): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    console.warn(
      `[WSClient] Cannot send message, socket is not open. ReadyState: ${this.socket?.readyState}`
    );
    return false;
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  public close(): void {
    this.isExplicitlyClosed = true;
    this.clearReconnectTimer();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
