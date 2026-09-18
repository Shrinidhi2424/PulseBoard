"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { Task } from "@/types/board";
import { useBoardStore } from "@/store/boardStore";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const Board: React.FC = () => {
  const { columns, tasks, columnOrder, moveTask, addTask } = useBoardStore();
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
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
      return;
    }

    // Dropped onto another task card
    const overTask = tasks[overId];
    if (overTask) {
      const toColumnId = overTask.columnId;
      const targetColumn = columns[toColumnId];
      if (targetColumn) {
        const toIndex = targetColumn.taskIds.indexOf(overId);
        moveTask(taskId, toColumnId, toIndex >= 0 ? toIndex : 0);
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleOpenAddTask = (colId: string) => {
    setTargetColumnId(colId);
    setNewTaskTitle("");
    setIsNewTaskModalOpen(true);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(targetColumnId, newTaskTitle.trim());
    setNewTaskTitle("");
    setIsNewTaskModalOpen(false);
  };

  const activeTask = activeTaskId ? tasks[activeTaskId] : null;

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
                Phase 2 DnD + Zustand
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              GPU-accelerated drag-and-drop & optimistic local state
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Local State (Optimistic)</span>
          </div>
          <Button
            variant="primary"
            size="sm"
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
      >
        <main className="flex-1 overflow-x-auto p-8 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
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
              className="w-72 rotate-2 cursor-grabbing shadow-2xl shadow-blue-500/30"
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
