import { WSMessage } from "../types/board";

export class SyncQueue {
  private queue: WSMessage[] = [];

  /**
   * Enqueue an action to be dispatched when the connection is restored.
   */
  public enqueue(action: WSMessage): void {
    this.queue.push(action);
  }

  /**
   * Flush all queued actions in strict FIFO order using the provided sender function.
   * Clears the queue once all items have been dispatched.
   */
  public flush(sendFn: (action: WSMessage) => boolean | void): void {
    if (this.queue.length === 0) {
      return;
    }

    const itemsToFlush = [...this.queue];
    for (const action of itemsToFlush) {
      sendFn(action);
    }
    this.queue = [];
  }

  /**
   * Clear all items from the queue.
   */
  public clear(): void {
    this.queue = [];
  }

  /**
   * Returns current count of queued actions.
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * Returns a shallow copy of the queued actions array.
   */
  public getQueue(): WSMessage[] {
    return [...this.queue];
  }
}

export const syncQueue = new SyncQueue();
