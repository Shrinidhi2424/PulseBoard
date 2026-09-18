import { WSMessage } from "@/types/board";

export interface WSClientOptions {
  url?: string;
  onMessage?: (message: WSMessage) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

export class WSClient {
  private socket: WebSocket | null = null;
  private url: string;
  private options: WSClientOptions;
  private isExplicitlyClosed = false;

  constructor(options: WSClientOptions = {}) {
    this.options = options;
    const defaultUrl =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:3001`
        : "ws://localhost:3001";
    this.url = options.url || defaultUrl;
  }

  public connect(): void {
    if (typeof window === "undefined") return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log("[WSClient] Connected to WebSocket server at", this.url);
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
        console.log("[WSClient] Disconnected from WebSocket server:", event.code, event.reason);
        this.options.onClose?.(event);
      };

      this.socket.onerror = (event: Event) => {
        console.warn("[WSClient] WebSocket connection error:", event);
        this.options.onError?.(event);
      };
    } catch (err) {
      console.error("[WSClient] Failed to instantiate WebSocket:", err);
    }
  }

  public send(message: WSMessage): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    console.warn("[WSClient] Cannot send message, socket is not open. ReadyState:", this.socket?.readyState);
    return false;
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public close(): void {
    this.isExplicitlyClosed = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
