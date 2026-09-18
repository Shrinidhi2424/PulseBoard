"use client";

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  type Announcements,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Task } from "@/types/board";
import { useBoardStore } from "@/store/boardStore";
import { useBoardSync } from "@/hooks/useBoardSync";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { ConnectionBadge } from "./ConnectionBadge";
import { BoardSkeleton } from "./BoardSkeleton";
import { Button } from "../ui/Button";

// Code-split heavy Modal dialogs so they are not included in the initial page bundle
const Modal = dynamic(
  () => import("../ui/Modal").then((mod) => mod.Modal),
  { ssr: false }
);

export const Board: React.FC = () => {
  const { columns, tasks, columnOrder, moveTask, addTask } = useBoardStore();
  const {
    connectionStatus,
    userCount,
    queuedCount,
    reconnectAttempt,
    isLoading,
    sendMove,
    sendAddTask,
  } = useBoardSync();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [targetColumnId, setTargetColumnId] = useState<string>("col-1");
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to trigger drag; clicks pass through cleanly
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    if (taskId === overId) return;

    // Dropped directly onto a column container
    if (columnOrder.includes(overId) || columns[overId]) {
      const toColumnId = overId;
      const toIndex = columns[toColumnId].taskIds.length;
      moveTask(taskId, toColumnId, toIndex);
      sendMove(taskId, toColumnId, toIndex);
      return;
    }

    // Dropped onto another task card
    const overTask = tasks[overId];
    if (overTask) {
      const toColumnId = overTask.columnId;
      const targetColumn = columns[toColumnId];
      if (targetColumn) {
        const toIndex = targetColumn.taskIds.indexOf(overId);
        const finalIndex = toIndex >= 0 ? toIndex : 0;
        moveTask(taskId, toColumnId, finalIndex);
        sendMove(taskId, toColumnId, finalIndex);
      }
    }
  }, [columnOrder, columns, tasks, moveTask, sendMove]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  const handleOpenAddTask = useCallback((colId: string) => {
    setTargetColumnId(colId);
    setNewTaskTitle("");
    setIsNewTaskModalOpen(true);
  }, []);

  const handleCreateTask = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    addTask(targetColumnId, title);
    sendAddTask(targetColumnId, title);
    setNewTaskTitle("");
    setIsNewTaskModalOpen(false);
  }, [addTask, newTaskTitle, sendAddTask, targetColumnId]);

  const announcements: Announcements = {
    onDragStart({ active }) {
      const task = tasks[active.id as string];
      return `Picked up task "${task?.title || active.id}". Use arrow keys to move between columns and positions. Press Space or Enter to drop, Escape to cancel.`;
    },
    onDragOver({ active, over }) {
      if (!over) return undefined;
      const task = tasks[active.id as string];
      if (columnOrder.includes(over.id as string)) {
        const col = columns[over.id as string];
        return `Task "${task?.title || active.id}" is over column "${col?.title}".`;
      }
      const overTask = tasks[over.id as string];
      if (overTask) {
        const col = columns[overTask.columnId];
        return `Task "${task?.title || active.id}" is over task "${overTask.title}" in column "${col?.title}".`;
      }
      return undefined;
    },
    onDragEnd({ active, over }) {
      const task = tasks[active.id as string];
      if (!over) {
        return `Dropped task "${task?.title || active.id}". Movement cancelled.`;
      }
      return `Dropped task "${task?.title || active.id}".`;
    },
    onDragCancel({ active }) {
      const task = tasks[active.id as string];
      return `Cancelled drag for task "${task?.title || active.id}".`;
    },
  };

  const activeTask = activeTaskId ? tasks[activeTaskId] : null;

  if (isLoading) {
    return <BoardSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Accessible Skip Link */}
      <a
        href="#kanban-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
      >
        Skip to Kanban board
      </a>

      {/* Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-8 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20"
          >
            P
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              PulseBoard
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Phase 9 E2E & Visual Polish
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Playwright E2E testing, loading skeleton, and column empty states
            </p>
          </div>
        </div>

        {/* Keyboard Navigation Helper Pill */}
        <div
          aria-label="Keyboard shortcuts guide"
          role="note"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300"
        >
          <span className="font-semibold text-slate-400">Keyboard:</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">
              Tab
            </kbd>{" "}
            focus
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">
              Space
            </kbd>{" "}
            pick up / drop
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-200">
              ← → ↑ ↓
            </kbd>{" "}
            move
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time Connection & Active Users Indicator */}
          <ConnectionBadge
            status={connectionStatus}
            userCount={userCount}
            queuedCount={queuedCount}
            reconnectAttempt={reconnectAttempt}
          />

          <Button
            variant="primary"
            size="sm"
            aria-label="Add new task to board"
            onClick={() => handleOpenAddTask("col-1")}
          >
            + Add Task
          </Button>
        </div>
      </header>

      {/* DndContext & Kanban Canvas */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTaskId(null)}
        accessibility={{ announcements }}
      >
        <main
          id="kanban-main"
          tabIndex={-1}
          aria-label="Kanban board columns"
          className="flex-1 overflow-x-auto p-8 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 outline-none"
        >
          <div className="flex items-start gap-6 pb-6 min-w-max">
            {columnOrder.map((columnId) => {
              const column = columns[columnId];
              if (!column) return null;
              const columnTasks = column.taskIds
                .map((id) => tasks[id])
                .filter(Boolean);

              return (
                <Column
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  onTaskClick={handleTaskClick}
                  onAddTask={handleOpenAddTask}
                />
              );
            })}
          </div>
        </main>

        {/* Drag Overlay — Uses CSS transform on GPU compositor layer without layout reflows */}
        <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {activeTask ? (
            <div
              style={{
                transform: "translate3d(0, 0, 0)",
                willChange: "transform",
              }}
              className="w-72 rotate-2 cursor-grabbing shadow-2xl shadow-blue-500/30 ring-2 ring-blue-500"
            >
              <TaskCard task={activeTask} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTask ? selectedTask.title : "Task Details"}
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsModalOpen(false)}
          >
            Close
          </Button>
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
                {columns[selectedTask.columnId]?.title || selectedTask.columnId}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Order in Column
              </label>
              <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800">
                {selectedTask.order}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title={`Add Task to ${columns[targetColumnId]?.title || "Column"}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim()}
            >
              Create Task
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label
              htmlFor="new-task-title"
              className="text-xs font-medium text-slate-400 block mb-1"
            >
              Task Title
            </label>
            <input
              id="new-task-title"
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Write comprehensive unit tests"
              autoFocus
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-sm"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
