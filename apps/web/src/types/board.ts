export type Task = {
  id: string;
  title: string;
  columnId: string;
  order: number;
};

export type Column = {
  id: string;
  title: string;
  taskIds: string[];
};

export type BoardState = {
  columns: Record<string, Column>;
  tasks: Record<string, Task>;
  columnOrder: string[];
};

export type WSMessage =
  | { type: "SYNC_STATE"; payload: BoardState }
  | { type: "MOVE_TASK"; payload: { taskId: string; toColumnId: string; toIndex: number } }
  | { type: "ADD_TASK"; payload: { columnId: string; title: string } }
  | { type: "USER_COUNT"; payload: number };
