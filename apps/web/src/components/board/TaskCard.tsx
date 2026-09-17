import React from "react";
import { Task } from "@/types/board";

export interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  isDragging = false,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative select-none rounded-xl border bg-slate-900/90 p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
        isDragging
          ? "opacity-50 border-blue-500 shadow-xl shadow-blue-500/20 scale-[1.02] cursor-grabbing"
          : "border-slate-800/80 hover:border-slate-700 hover:bg-slate-850 hover:shadow-md cursor-grab"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-200 leading-snug break-words">
          {task.title}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono text-[11px] text-slate-500">#{task.id}</span>
        <span className="inline-flex items-center rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/50">
          Order: {task.order}
        </span>
      </div>
    </div>
  );
};
