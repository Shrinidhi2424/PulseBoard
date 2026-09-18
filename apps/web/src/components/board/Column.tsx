"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Column as ColumnType, Task } from "@/types/board";
import { DraggableTaskCard } from "./TaskCard";

export interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: (columnId: string) => void;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  tasks,
  onTaskClick,
  onAddTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  return (
    <section
      ref={setNodeRef}
      aria-label={`Column: ${column.title}`}
      className={`flex flex-col w-80 shrink-0 rounded-2xl bg-slate-900/60 border p-4 max-h-[calc(100vh-10rem)] backdrop-blur-xs transition-colors duration-150 ${
        isOver
          ? "border-blue-500/80 bg-slate-900/80 ring-2 ring-blue-500/20"
          : "border-slate-800/80"
      }`}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
            {column.title}
          </h2>
          <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium text-slate-400 bg-slate-800/80 rounded-full border border-slate-700/50">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={() => onAddTask(column.id)}
            aria-label={`Add task to ${column.title}`}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent min-h-24">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-800/60 rounded-xl text-xs text-slate-500 select-none">
            Drop tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))
        )}
      </div>
    </section>
  );
};
