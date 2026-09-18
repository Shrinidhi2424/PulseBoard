import { BoardState, Column, Task } from "./types.js";

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

// In-memory state
let currentBoardState: BoardState = JSON.parse(JSON.stringify(initialBoardState));

export function getBoardState(): BoardState {
  return currentBoardState;
}

export function handleMoveTask(payload: {
  taskId: string;
  toColumnId: string;
  toIndex: number;
}): BoardState {
  const { taskId, toColumnId, toIndex } = payload;
  const task = currentBoardState.tasks[taskId];
  if (!task) return currentBoardState;

  const fromColumnId = task.columnId;
  const fromColumn = currentBoardState.columns[fromColumnId];
  const toColumn = currentBoardState.columns[toColumnId];

  if (!fromColumn || !toColumn) return currentBoardState;

  const newColumns: Record<string, Column> = { ...currentBoardState.columns };
  const newTasks: Record<string, Task> = { ...currentBoardState.tasks };

  if (fromColumnId === toColumnId) {
    // Reorder within same column
    const newTaskIds = [...fromColumn.taskIds.filter((id) => id !== taskId)];
    const targetIndex = Math.max(0, Math.min(toIndex, newTaskIds.length));
    newTaskIds.splice(targetIndex, 0, taskId);

    newColumns[fromColumnId] = {
      ...fromColumn,
      taskIds: newTaskIds,
    };

    newTaskIds.forEach((id, index) => {
      if (newTasks[id]) {
        newTasks[id] = { ...newTasks[id], order: index };
      }
    });
  } else {
    // Move to different column
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

    newTasks[taskId] = {
      ...task,
      columnId: toColumnId,
      order: targetIndex,
    };

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

  currentBoardState = {
    ...currentBoardState,
    columns: newColumns,
    tasks: newTasks,
  };

  return currentBoardState;
}

export function handleAddTask(payload: {
  columnId: string;
  title: string;
}): BoardState {
  const { columnId, title } = payload;
  const column = currentBoardState.columns[columnId];
  if (!column) return currentBoardState;

  const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const order = column.taskIds.length;

  const newTask: Task = {
    id,
    title,
    columnId,
    order,
  };

  currentBoardState = {
    ...currentBoardState,
    columns: {
      ...currentBoardState.columns,
      [columnId]: {
        ...column,
        taskIds: [...column.taskIds, id],
      },
    },
    tasks: {
      ...currentBoardState.tasks,
      [id]: newTask,
    },
  };

  return currentBoardState;
}

export function resetBoardState(): void {
  currentBoardState = JSON.parse(JSON.stringify(initialBoardState));
}
