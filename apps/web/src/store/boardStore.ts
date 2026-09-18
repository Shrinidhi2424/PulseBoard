import { create } from "zustand";
import { BoardState, Column, Task } from "../types/board";
import { saveBoard, loadBoard, clearBoard } from "../lib/db";

export interface BoardStore extends BoardState {
  moveTask: (taskId: string, toColumnId: string, toIndex: number) => void;
  addTask: (columnId: string, title: string, customId?: string) => void;
  applySyncState: (state: BoardState) => void;
  resetToInitial: () => void;
  hydrateFromStorage: () => Promise<boolean>;
}

export const initialBoardState: BoardState = {
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

export const useBoardStore = create<BoardStore>((set) => ({
  ...initialBoardState,

  moveTask: (taskId: string, toColumnId: string, toIndex: number) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      const fromColumnId = task.columnId;
      const fromColumn = state.columns[fromColumnId];
      const toColumn = state.columns[toColumnId];

      if (!fromColumn || !toColumn) return state;

      const newColumns: Record<string, Column> = { ...state.columns };
      const newTasks: Record<string, Task> = { ...state.tasks };

      if (fromColumnId === toColumnId) {
        // Reordering within the same column
        const newTaskIds = [...fromColumn.taskIds.filter((id) => id !== taskId)];
        const targetIndex = Math.max(0, Math.min(toIndex, newTaskIds.length));
        newTaskIds.splice(targetIndex, 0, taskId);

        newColumns[fromColumnId] = {
          ...fromColumn,
          taskIds: newTaskIds,
        };

        // Update task order property for all tasks in this column
        newTaskIds.forEach((id, index) => {
          if (newTasks[id]) {
            newTasks[id] = { ...newTasks[id], order: index };
          }
        });
      } else {
        // Moving to a different column
        const fromTaskIds = fromColumn.taskIds.filter((id) => id !== taskId);
        const toTaskIds = [...toColumn.taskIds];
        const targetIndex = Math.max(0, Math.min(toIndex, toTaskIds.length));
        toTaskIds.splice(targetIndex, 0, taskId);

        newColumns[fromColumnId] = {
          ...fromColumn,
          taskIds: fromTaskIds,
        };

        newColumns[toColumnId] = {
          ...toColumn,
          taskIds: toTaskIds,
        };

        // Update task's column and order
        newTasks[taskId] = {
          ...task,
          columnId: toColumnId,
          order: targetIndex,
        };

        // Recalculate orders for both columns
        fromTaskIds.forEach((id, index) => {
          if (newTasks[id]) {
            newTasks[id] = { ...newTasks[id], order: index };
          }
        });

        toTaskIds.forEach((id, index) => {
          if (newTasks[id]) {
            newTasks[id] = { ...newTasks[id], order: index };
          }
        });
      }

      return {
        columns: newColumns,
        tasks: newTasks,
      };
    });
  },

  addTask: (columnId: string, title: string, customId?: string) => {
    set((state) => {
      const column = state.columns[columnId];
      if (!column) return state;

      const id =
        customId || `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const order = column.taskIds.length;

      const newTask: Task = {
        id,
        title,
        columnId,
        order,
      };

      return {
        columns: {
          ...state.columns,
          [columnId]: {
            ...column,
            taskIds: [...column.taskIds, id],
          },
        },
        tasks: {
          ...state.tasks,
          [id]: newTask,
        },
      };
    });
  },

  applySyncState: (state: BoardState) => {
    set({
      columns: state.columns,
      tasks: state.tasks,
      columnOrder: state.columnOrder,
    });
  },

  resetToInitial: () => {
    set({ ...initialBoardState });
    clearBoard();
  },

  hydrateFromStorage: async () => {
    try {
      const cachedState = await loadBoard();
      if (cachedState && cachedState.columns && cachedState.tasks && cachedState.columnOrder) {
        set({
          columns: cachedState.columns,
          tasks: cachedState.tasks,
          columnOrder: cachedState.columnOrder,
        });
        return true;
      }
    } catch (err) {
      console.warn("[boardStore] Failed to hydrate board from IndexedDB:", err);
    }
    return false;
  },
}));

// Automatic persistence subscription: debounced snapshot write to IndexedDB to avoid write storm
if (typeof window !== "undefined") {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  useBoardStore.subscribe((state) => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(() => {
      saveBoard({
        columns: state.columns,
        tasks: state.tasks,
        columnOrder: state.columnOrder,
      });
    }, 1000);
  });
}
