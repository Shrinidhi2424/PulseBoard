"use client";

import React, { useState } from "react";
import { BoardState, Task } from "@/types/board";
import { Column } from "./Column";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

const initialStaticBoard: BoardState = {
  columns: {
    "col-1": {
      id: "col-1",
      title: "To Do",
      taskIds: ["task-1", "task-2"],
    },
    "col-2": {
      id: "col-2",
      title: "In Progress",
      taskIds: ["task-3"],
    },
    "col-3": {
      id: "col-3",
      title: "Done",
      taskIds: ["task-4"],
    },
  },
  tasks: {
    "task-1": {
      id: "task-1",
      title: "Research compositor layers & GPU acceleration",
      columnId: "col-1",
      order: 0,
    },
    "task-2": {
      id: "task-2",
      title: "Audit layout reflows during pointer drag",
      columnId: "col-1",
      order: 1,
    },
    "task-3": {
      id: "task-3",
      title: "Implement WebSocket sync engine with ws",
      columnId: "col-2",
      order: 0,
    },
    "task-4": {
      id: "task-4",
      title: "Configure IndexedDB offline hydration with idb",
      columnId: "col-3",
      order: 0,
    },
  },
  columnOrder: ["col-1", "col-2", "col-3"],
};

export const Board: React.FC = () => {
  const [board] = useState<BoardState>(initialStaticBoard);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            P
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              PulseBoard
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Phase 1 Static UI
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Real-time collaborative Kanban board (offline-first)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ready</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedTask({
                id: "demo-task",
                title: "Primitive Component Showcase",
                columnId: "col-1",
                order: 99,
              });
              setIsModalOpen(true);
            }}
          >
            Show Modal
          </Button>
        </div>
      </header>

      {/* Kanban Board Canvas */}
      <main className="flex-1 overflow-x-auto p-8 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
        <div className="flex items-start gap-6 pb-6 min-w-max">
          {board.columnOrder.map((columnId) => {
            const column = board.columns[columnId];
            if (!column) return null;
            const columnTasks = column.taskIds
              .map((id) => board.tasks[id])
              .filter(Boolean);

            return (
              <Column
                key={column.id}
                column={column}
                tasks={columnTasks}
                onTaskClick={handleTaskClick}
                onAddTask={(colId) => {
                  setSelectedTask({
                    id: `new-${Date.now()}`,
                    title: `New task for ${board.columns[colId].title}`,
                    columnId: colId,
                    order: 0,
                  });
                  setIsModalOpen(true);
                }}
              />
            );
          })}
        </div>
      </main>

      {/* Task Detail / Demo Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTask ? selectedTask.title : "Task Details"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Task ID
              </label>
              <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800">
                {selectedTask.id}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Column
              </label>
              <div className="p-2.5 rounded-lg bg-slate-950 text-xs text-slate-300 border border-slate-800">
                {board.columns[selectedTask.columnId]?.title || selectedTask.columnId}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Design System Button Variants
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="primary" size="sm">Primary</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="outline" size="sm">Outline</Button>
                <Button variant="ghost" size="sm">Ghost</Button>
                <Button variant="danger" size="sm">Danger</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
