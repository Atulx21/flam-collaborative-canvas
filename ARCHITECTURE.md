# Collaborative Canvas Architecture

## Technical Strategy
This application implements a **Server-Authoritative, Optimistic-UI** architecture to ensure high performance and data consistency.

### 1. Data Flow (The "Dual-Stream" Approach)
To solve the conflict between "Real-time Latency" and "Data Integrity", I separated the data flow into two streams:
* **Ephemeral Stream (`draw_chunk`):** As the mouse moves, data is broadcast immediately to other peers. This bypasses the database/history stack to ensure zero-latency visual feedback.
* **Transactional Stream (`draw_commit`):** When a stroke is finished, the full vector path is sent to the server. The server acts as the **Source of Truth**, appending it to the global history stack.

### 2. Rendering Engine
* **Bezier Smoothing:** Raw input points are noisy. I implemented a Quadratic Bezier algorithm to interpolate between points, ensuring lines are smooth even if the mouse moves quickly.
* **Layering:** I utilized two `<canvas>` elements.
    * `#mainCanvas`: Holds the committed drawing state.
    * `#cursorCanvas`: A lightweight overlay cleared 60 times/second (60fps) to render remote cursors without forcing a repaint of the complex drawing history.

### 3. Synchronization & Undo
* **Command Pattern:** Every stroke is stored as a Command Object `{ points: [], color, width }`.
* **Global Undo:** When undo is triggered, the server modifies the stack and broadcasts a `history_update`. Clients clear their canvas and replay the history array. This is mathematically simpler and less error-prone than trying to "erase" pixels.

### 4. Tech Stack Decisions
* **Socket.io vs WebSockets:** Chosen for its built-in reliability (auto-reconnect) and "volatile" messaging support, which is crucial for high-frequency cursor updates.