"use client";

import React from "react";

export type ConnectionState = "online" | "reconnecting" | "offline";

export interface ConnectionBadgeProps {
  status: ConnectionState;
  userCount?: number;
  queuedCount?: number;
  reconnectAttempt?: number;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  status,
  userCount = 1,
  queuedCount = 0,
  reconnectAttempt = 0,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 shadow-xs ${
        status === "online"
          ? "bg-slate-900/90 border-emerald-500/30 text-emerald-300"
          : status === "reconnecting"
          ? "bg-amber-950/40 border-amber-500/40 text-amber-300 animate-pulse"
          : "bg-rose-950/40 border-rose-500/40 text-rose-300"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
          status === "online"
            ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
            : status === "reconnecting"
            ? "bg-amber-500 shadow-sm shadow-amber-500/50"
            : "bg-rose-500 shadow-sm shadow-rose-500/50"
        }`}
      />

      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {status === "online" && (
          <span>
            <strong className="font-semibold text-emerald-400">Online</strong> •{" "}
            {userCount} {userCount === 1 ? "user" : "users"}
          </span>
        )}

        {status === "reconnecting" && (
          <span>
            <strong className="font-semibold text-amber-400">Reconnecting</strong>
            {reconnectAttempt > 0 ? ` (attempt #${reconnectAttempt})` : "..."}
            {queuedCount > 0 && ` • ${queuedCount} queued`}
          </span>
        )}

        {status === "offline" && (
          <span>
            <strong className="font-semibold text-rose-400">Offline</strong>
            {queuedCount > 0 ? ` • ${queuedCount} actions queued` : " • changes local"}
          </span>
        )}
      </div>
    </div>
  );
};
