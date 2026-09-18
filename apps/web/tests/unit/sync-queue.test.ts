import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncQueue } from "@/lib/sync-queue";
import { WSMessage } from "@/types/board";

describe("sync-queue unit tests", () => {
  let queue: SyncQueue;

  beforeEach(() => {
    queue = new SyncQueue();
  });

  it("enqueue adds an action to the queue when offline", () => {
    expect(queue.size()).toBe(0);

    const message: WSMessage = {
      type: "ADD_TASK",
      payload: { columnId: "col-1", title: "Offline Task" },
    };

    queue.enqueue(message);

    expect(queue.size()).toBe(1);
    expect(queue.getQueue()[0]).toEqual(message);
  });

  it("flush sends all queued actions in FIFO order", () => {
    const msg1: WSMessage = {
      type: "MOVE_TASK",
      payload: { taskId: "task-1", toColumnId: "col-2", toIndex: 0 },
    };
    const msg2: WSMessage = {
      type: "ADD_TASK",
      payload: { columnId: "col-2", title: "Second Task" },
    };
    const msg3: WSMessage = {
      type: "MOVE_TASK",
      payload: { taskId: "task-2", toColumnId: "col-3", toIndex: 1 },
    };

    queue.enqueue(msg1);
    queue.enqueue(msg2);
    queue.enqueue(msg3);

    const dispatched: WSMessage[] = [];
    const sendFn = vi.fn((action: WSMessage) => {
      dispatched.push(action);
    });

    queue.flush(sendFn);

    expect(sendFn).toHaveBeenCalledTimes(3);
    expect(dispatched[0]).toEqual(msg1);
    expect(dispatched[1]).toEqual(msg2);
    expect(dispatched[2]).toEqual(msg3);
  });

  it("flush clears the queue after successful send", () => {
    queue.enqueue({
      type: "ADD_TASK",
      payload: { columnId: "col-1", title: "Task to flush" },
    });
    expect(queue.size()).toBe(1);

    const sendFn = vi.fn();
    queue.flush(sendFn);

    expect(sendFn).toHaveBeenCalledTimes(1);
    expect(queue.size()).toBe(0);
    expect(queue.getQueue()).toEqual([]);
  });

  it("queue persists correctly if flush is called with zero items (no-op)", () => {
    expect(queue.size()).toBe(0);

    const sendFn = vi.fn();
    queue.flush(sendFn);

    expect(sendFn).not.toHaveBeenCalled();
    expect(queue.size()).toBe(0);
    expect(queue.getQueue()).toEqual([]);
  });

  it("flush retains actions in queue if sendFn returns false", () => {
    const msg1: WSMessage = {
      type: "ADD_TASK",
      payload: { columnId: "col-1", title: "Action 1" },
    };
    const msg2: WSMessage = {
      type: "ADD_TASK",
      payload: { columnId: "col-1", title: "Action 2" },
    };
    queue.enqueue(msg1);
    queue.enqueue(msg2);

    const sendFn = vi.fn((action: WSMessage) => {
      if (action === msg1) return false;
      return true;
    });

    queue.flush(sendFn);

    expect(sendFn).toHaveBeenCalledTimes(2);
    expect(queue.size()).toBe(1);
    expect(queue.getQueue()).toEqual([msg1]);
  });
});
