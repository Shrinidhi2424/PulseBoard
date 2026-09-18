# PulseBoard

> **A real-time collaborative Kanban board with offline resilience, sub-frame rendering performance, and automated end-to-end testing.**

PulseBoard is a real-time collaborative Kanban board where multiple users can drag cards across columns and see each other's changes instantly, even if their connection drops. Built specifically to demonstrate frontend performance engineering and browser internals — featuring WebSocket-based sync with optimistic UI updates, offline tolerance via Service Worker and IndexedDB persistence, exponential-backoff action queuing, and GPU-composited drag-and-drop that eliminates layout reflows.

---

## 1. Features

- **GPU-Accelerated Drag-and-Drop**: Smooth card dragging powered by `@dnd-kit/core` with hardware-accelerated CSS `translate3d` compositor layers, ensuring zero layout reflows during pointer movement.
- **Full Keyboard Accessibility**: Accessible keyboard navigation conforming to WCAG standards using `@dnd-kit/sortable` keyboard coordinates (`Tab`, `Space` / `Enter` to pick up/drop, and Arrow keys to reorder/move).
- **Real-Time Multi-Client Synchronization**: Bidirectional live synchronization across browser tabs and devices over raw WebSockets with active user presence tracking.
- **Optimistic UI Updates**: Immediate client-side state transitions with automatic rollback or server reconciliation upon network receipt.
- **Offline Resilience & IndexedDB Hydration**: Automatic local snapshot persistence using `idb`. Offline reloads restore the board state directly from cache without waiting for network connectivity.
- **PWA Service Worker App Shell Caching**: Cache-first asset delivery for static assets and navigation fallbacks to guarantee instant app shell loading.
- **Offline Sync Queue with Exponential Backoff**: Disconnected actions (`MOVE_TASK`, `ADD_TASK`) queue in memory and replay in strict FIFO order upon reconnection with backoff retry timers.
- **Performance Pass**: Dynamic code-splitting via `next/dynamic`, zero-CLS font loading with `next/font` fallback metrics, CSS `content-visibility: auto` container virtualization for large lists, and component memoization.
- **Loading Skeletons & Empty States**: Polished loading skeletons prevent layout shift on cold load, and interactive empty states guide users when columns are empty.
- **Zero-Regression Automated Testing**: 12 Vitest unit and component tests plus Playwright end-to-end drag-and-drop browser tests.

---

## 2. Architecture & Sync Flow

### System Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                        Browser                           │
│                                                          │
│  ┌──────────────┐     Optimistic      ┌───────────────┐  │
│  │ UI / Kanban  │ ──────────────────> │ Zustand Store │  │
│  │ Components   │ <────────────────── │ (boardStore)  │  │
│  └──────────────┘      Reactivity     └───────┬───────┘  │
│         │                                     │          │
│         │ User Action                         │ Snapshot │
│         v                                     v          │
│  ┌──────────────┐   Online: Send Msg  ┌───────────────┐  │
│  │ useBoardSync │ ──────────────────> │  IndexedDB    │  │
│  │     Hook     │                     │ (board-snap)  │  │
│  └──────┬───────┘                     └───────────────┘  │
│         │ Disconnected: Enqueue                          │
│         v                                                │
│  ┌──────────────┐   Reconnect: FIFO Flush                │
│  │  SyncQueue   │ ──────────────────────────┐            │
│  └──────────────┘                           │            │
│                                             │            │
│  ┌────────────────┐ Static Asset Cache      │            │
│  │ Service Worker │ ────────────────────┐   │            │
│  └────────────────┘                     │   │            │
└─────────────────────────────────────────┼───┼────────────┘
                                          │   │
                     HTTP / Cache-First   │   │ WebSocket
                                          v   v (Port 3001)
┌──────────────────────────────────────────────────────────┐
│                      Node.js Server                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                WebSocket Server (ws)               │  │
│  │  - Authoritative in-memory board state             │  │
│  │  - Broadcast mutations to connected peers          │  │
│  │  - Track active connection count                   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Sync Flow
1. **User Action**: The user drags a card or creates a new task.
2. **Optimistic Local Update**: The Zustand `boardStore` updates state immediately so UI updates with zero latency.
3. **Local Storage Write**: A store subscription automatically writes the snapshot to IndexedDB (`pulseboard-db`).
4. **Network Dispatch**:
   - *If Online*: Dispatches `MOVE_TASK` or `ADD_TASK` immediately via WebSocket.
   - *If Offline*: Dispatches into the in-memory `SyncQueue`.
5. **Server Reconciliation**: The server validates and mutates the in-memory state, broadcasting `SYNC_STATE` or the mutation to all connected clients.
6. **Reconnect & Flush**: When connectivity restores, `SyncQueue` replays all queued actions in strict FIFO order, then reconciles state with the server.

---

## 3. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | Next.js 15 (App Router, Turbopack) + TypeScript | Modern React 19 component model with zero-config SSR/SSG and route splitting. |
| **State Management** | Zustand | Lightweight (1 kB), unopinionated store with straightforward actions and subscriptions. |
| **Drag and Drop** | `@dnd-kit/core` + `@dnd-kit/sortable` | Accessible, compositor-friendly drag-and-drop with pointer and keyboard sensor support. |
| **Styling** | Tailwind CSS v4 | Utility-first, zero-runtime styling with sleek dark mode aesthetics. |
| **Offline Persistence** | `idb` (IndexedDB Wrapper) | Modern Promise-based API for IndexedDB storage without raw event boilerplate. |
| **Service Worker** | Native Web Service Worker (`sw.js`) | Offline app-shell caching, static asset cache-first strategy, navigation fallback. |
| **Real-Time Sync** | Node.js + `ws` | Raw, explainable WebSocket frames, connection lifecycles, and broadcasting. |
| **Unit & Component Testing**| Vitest + React Testing Library | Blazing fast ESM-native test runner with simulated DOM environment. |
| **End-to-End Testing** | Playwright | Multi-browser headless automation validating drag-and-drop and state persistence. |

---

## 4. Running Locally

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation
Clone the repository and install dependencies from the monorepo root:
```bash
git clone https://github.com/Shrinidhi2424/PulseBoard.git
cd PulseBoard
npm install
```

### Environment Variables (Optional)
The client connects to `ws://localhost:3001` by default. To customize:
```bash
# In apps/web/.env.local
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Running Development Servers
Start both the Next.js frontend and the WebSocket backend concurrently or individually:

```bash
# Start Next.js frontend (http://localhost:3000)
npm run dev

# Start WebSocket server (ws://localhost:3001)
npm run dev:server
```

---

## 5. Testing

PulseBoard includes both unit/component test suites and end-to-end browser specifications.

### Unit & Component Tests (Vitest)
Runs 12 unit tests covering `boardStore`, `sync-queue`, and the `TaskCard` component:
```bash
npm test
```

### End-to-End Tests (Playwright)
Executes cross-browser drag-and-drop interaction and reload persistence tests:
```bash
npm run test:e2e
```

---

## 6. Known Limitations

- **No User Authentication**: Designed intentionally without a login system to focus entirely on frontend performance, state synchronization, and offline capabilities.
- **In-Memory Server State**: The WebSocket server maintains state in memory; restarting the server process resets the authoritative server board back to default seed data (though connected clients will re-sync their local IndexedDB snapshots upon reconnection).
- **Single Board Scope**: PulseBoard operates on a single collaborative board canvas rather than multi-tenant workspaces.
- **No File Attachments or Comments**: Task cards are constrained to titles and order indices to preserve focus on core browser rendering pipelines and data sync patterns.
