"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WSClient } from "@/lib/ws-client";
import { syncQueue } from "@/lib/sync-queue";
import { useOnlineStatus } from "./useOnlineStatus";
import { WSMessage } from "@/types/board";
import { useBoardStore } from "@/store/boardStore";
import { ConnectionState } from "@/components/board/ConnectionBadge";

export function useBoardSync() {
  const wsClientRef = useRef<WSClient | null>(null);
  const { isOnline } = useOnlineStatus();

  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>("reconnecting");
  const [userCount, setUserCount] = useState<number>(1);
  const [queuedCount, setQueuedCount] = useState<number>(() => syncQueue.size());
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setBoard = useBoardStore((state) => state.setBoard);
  const hydrateFromStorage = useBoardStore((state) => state.hydrateFromStorage);

  // Hydrate cached board snapshot from IndexedDB on initial mount
  useEffect(() => {
    hydrateFromStorage().then((hydrated) => {
      if (hydrated) {
        console.log("[useBoardSync] Successfully hydrated initial board state from IndexedDB.");
      }
      // Give visual transition or resolve immediately
      setIsLoading(false);
    });
  }, [hydrateFromStorage]);

  const handleMessage = useCallback(
    (message: WSMessage) => {
      switch (message.type) {
        case "SYNC_STATE":
          console.log("[useBoardSync] Received SYNC_STATE from server. Reconciling board state.");
          setBoard(message.payload);
          setIsLoading(false);
          break;
        case "USER_COUNT":
          console.log("[useBoardSync] Active user count updated:", message.payload);
          setUserCount(message.payload);
          break;
        default:
          break;
      }
    },
    [setBoard]
  );

  useEffect(() => {
    const client = new WSClient({
      onMessage: handleMessage,
      onOpen: () => {
        console.log("[useBoardSync] WebSocket connected (Online).");
        setConnectionStatus("online");
        setReconnectAttempt(0);

        // On reconnect (WS onopen): flush queue in FIFO order to replay offline actions
        if (syncQueue.size() > 0) {
          console.log(
            `[useBoardSync] Flusing ${syncQueue.size()} offline queued actions in FIFO order...`
          );
          syncQueue.flush((action) => {
            console.log(`[useBoardSync] Replaying queued action:`, action.type);
            client.send(action);
          });
          setQueuedCount(0);
        }
      },
      onClose: () => {
        if (!navigator.onLine) {
          setConnectionStatus("offline");
        } else {
          setConnectionStatus("reconnecting");
        }
      },
      onError: () => {
        if (!navigator.onLine) {
          setConnectionStatus("offline");
        } else {
          setConnectionStatus("reconnecting");
        }
      },
      onReconnecting: (attempt) => {
        setReconnectAttempt(attempt);
        if (!navigator.onLine) {
          setConnectionStatus("offline");
        } else {
          setConnectionStatus("reconnecting");
        }
      },
    });

    wsClientRef.current = client;
    client.connect();

    return () => {
      client.close();
      wsClientRef.current = null;
    };
  }, [handleMessage]);

  // When browser goes offline or back online
  useEffect(() => {
    if (!isOnline) {
      setConnectionStatus("offline");
    } else {
      if (wsClientRef.current && !wsClientRef.current.isConnected()) {
        setConnectionStatus("reconnecting");
        wsClientRef.current.connect();
      }
    }
  }, [isOnline]);

  const sendMove = useCallback((taskId: string, toColumnId: string, toIndex: number) => {
    const message: WSMessage = {
      type: "MOVE_TASK",
      payload: { taskId, toColumnId, toIndex },
    };

    if (wsClientRef.current && wsClientRef.current.isConnected()) {
      wsClientRef.current.send(message);
    } else {
      console.log("[useBoardSync] Offline or disconnected: Enqueuing MOVE_TASK into SyncQueue.");
      syncQueue.enqueue(message);
      setQueuedCount(syncQueue.size());
    }
  }, []);

  const sendAddTask = useCallback((columnId: string, title: string) => {
    const message: WSMessage = {
      type: "ADD_TASK",
      payload: { columnId, title },
    };

    if (wsClientRef.current && wsClientRef.current.isConnected()) {
      wsClientRef.current.send(message);
    } else {
      console.log("[useBoardSync] Offline or disconnected: Enqueuing ADD_TASK into SyncQueue.");
      syncQueue.enqueue(message);
      setQueuedCount(syncQueue.size());
    }
  }, []);

  return {
    connectionStatus,
    isConnected: connectionStatus === "online",
    userCount,
    queuedCount,
    reconnectAttempt,
    isLoading,
    sendMove,
    sendAddTask,
  };
}
