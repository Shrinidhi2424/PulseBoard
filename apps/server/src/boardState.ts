import { BoardState } from "./types.js";

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
