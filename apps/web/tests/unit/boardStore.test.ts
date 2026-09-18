import { describe, it, expect, beforeEach } from "vitest";
import { useBoardStore } from "@/store/boardStore";
import { BoardState } from "@/types/board";

describe("boardStore unit tests", () => {
  beforeEach(() => {
    useBoardStore.getState().resetToInitial();
  });

  it("moveTask moves a task from one column to another", () => {
    const store = useBoardStore.getState();
    expect(store.tasks["task-1"].columnId).toBe("col-1");
    expect(store.columns["col-1"].taskIds).toContain("task-1");
    expect(store.columns["col-2"].taskIds).not.toContain("task-1");

    store.moveTask("task-1", "col-2", 0);

    const updated = useBoardStore.getState();
    expect(updated.tasks["task-1"].columnId).toBe("col-2");
    expect(updated.columns["col-1"].taskIds).not.toContain("task-1");
    expect(updated.columns["col-2"].taskIds[0]).toBe("task-1");
  });

  it("moveTask reorders tasks within the same column", () => {
    const store = useBoardStore.getState();
    expect(store.columns["col-1"].taskIds).toEqual(["task-1", "task-2"]);

    // Move task-1 to index 1 (swapping order with task-2)
    store.moveTask("task-1", "col-1", 1);

    const updated = useBoardStore.getState();
    expect(updated.columns["col-1"].taskIds).toEqual(["task-2", "task-1"]);
    expect(updated.tasks["task-2"].order).toBe(0);
    expect(updated.tasks["task-1"].order).toBe(1);
  });

  it("addTask appends a new task with a unique id", () => {
    const store = useBoardStore.getState();
    const initialCol1Count = store.columns["col-1"].taskIds.length;

    store.addTask("col-1", "Unit Test New Task Title");

    const updated = useBoardStore.getState();
    expect(updated.columns["col-1"].taskIds.length).toBe(initialCol1Count + 1);

    const newTaskId = updated.columns["col-1"].taskIds[initialCol1Count];
    expect(newTaskId).toBeDefined();

    const newTask = updated.tasks[newTaskId];
    expect(newTask).toBeDefined();
    expect(newTask.title).toBe("Unit Test New Task Title");
    expect(newTask.columnId).toBe("col-1");
    expect(newTask.order).toBe(initialCol1Count);
  });

  it("applying a SYNC_STATE message replaces the entire board state", () => {
    const freshState: BoardState = {
      columns: {
        "col-custom": {
          id: "col-custom",
          title: "Custom Column",
          taskIds: ["task-custom-1"],
        },
      },
      tasks: {
        "task-custom-1": {
          id: "task-custom-1",
          title: "Custom Task for Sync State",
          columnId: "col-custom",
          order: 0,
        },
      },
      columnOrder: ["col-custom"],
    };

    useBoardStore.getState().applySyncState(freshState);

    const updated = useBoardStore.getState();
    expect(updated.columnOrder).toEqual(["col-custom"]);
    expect(updated.columns).toEqual(freshState.columns);
    expect(updated.tasks).toEqual(freshState.tasks);
  });
});
