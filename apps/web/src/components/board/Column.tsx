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

export const Column: React.FC<ColumnProps> = React.memo(({
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
      role="region"
      aria-labelledby={`column-heading-${column.id}`}
      aria-label={`Column: ${column.title}, ${tasks.length} tasks`}
      className={`flex flex-col w-80 shrink-0 rounded-2xl bg-slate-900/60 border p-4 max-h-[calc(100vh-10rem)] backdrop-blur-xs transition-colors duration-150 ${
        isOver
          ? "border-blue-500/80 bg-slate-900/80 ring-2 ring-blue-500/20"
          : "border-slate-800/80"
      }`}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <h2
            id={`column-heading-${column.id}`}
            className="text-sm font-semibold text-slate-100 tracking-wide"
          >
            {column.title}
          </h2>
          <span
            aria-label={`${tasks.length} tasks in ${column.title}`}
            className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium text-slate-400 bg-slate-800/80 rounded-full border border-slate-700/50"
          >
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            type="button"
            onClick={() => onAddTask(column.id)}
            aria-label={`Add task to ${column.title}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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

      {/* Task List Container - optimized with browser-native content-visibility virtualization */}
      <div
        role="list"
        aria-label={`Tasks in ${column.title}`}
        className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent min-h-24"
      >
        {tasks.length === 0 ? (
          <div
            role="status"
            aria-label={`No tasks in ${column.title}`}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800/80 rounded-xl text-center select-none bg-slate-950/20"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 mb-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-xs font-medium text-slate-400 mb-0.5">No tasks yet</p>
            <p className="text-[11px] text-slate-500">Drop cards here or click + to add</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              role="listitem"
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: "0 88px",
              }}
            >
              <DraggableTaskCard
                task={task}
                onClick={() => onTaskClick?.(task)}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
});

Column.displayName = "Column";
