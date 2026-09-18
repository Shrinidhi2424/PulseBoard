"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WSClient } from "@/lib/ws-client";
import { WSMessage } from "@/types/board";
import { useBoardStore } from "@/store/boardStore";

export function useBoardSync() {
  const wsClientRef = useRef<WSClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const setBoard = useBoardStore((state) => state.setBoard);

  const handleMessage = useCallback(
    (message: WSMessage) => {
      switch (message.type) {
        case "SYNC_STATE":
          console.log("[useBoardSync] Received SYNC_STATE from server, reconciling board state.");
          setBoard(message.payload);
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
      onOpen: () => setIsConnected(true),
      onClose: () => setIsConnected(false),
      onError: () => setIsConnected(false),
      onMessage: handleMessage,
    });

    wsClientRef.current = client;
    client.connect();

    return () => {
      client.close();
      wsClientRef.current = null;
    };
  }, [handleMessage]);

  const sendMove = useCallback((taskId: string, toColumnId: string, toIndex: number) => {
    if (wsClientRef.current) {
      wsClientRef.current.send({
        type: "MOVE_TASK",
        payload: { taskId, toColumnId, toIndex },
      });
    }
  }, []);

  const sendAddTask = useCallback((columnId: string, title: string) => {
    if (wsClientRef.current) {
      wsClientRef.current.send({
        type: "ADD_TASK",
        payload: { columnId, title },
      });
    }
  }, []);

  return {
    isConnected,
    userCount,
    sendMove,
    sendAddTask,
  };
}
