## 2024-05-24 - [Avoid Redundant API calls in React components]
**Learning:** Found a performance bottleneck in `MergeBuilder.jsx` where redundant `axios.post` API calls were being made to `hf/config` on each re-evaluation, fetching data for models that had already been loaded.
**Action:** Implemented a client-side cache using `useRef` to store previously fetched configurations. This significantly reduces network overhead and backend load, ensuring only new models are fetched when the component updates.

## 2024-05-25 - [O(n²) Array Copying in Streaming Logs]
**Learning:** React state updates using the spread operator `setLogs(prev => [...prev, newLog])` inside a rapid websocket stream create an O(N²) memory allocation and garbage collection nightmare. Furthermore, mapping thousands of array items into individual `<div>` DOM nodes freezes the main thread.
**Action:** Convert the state to a single string (`""`) and use string concatenation `setLogs(prev => prev + newLog + '\n')`. Render the single text node within a `whitespace-pre-wrap` container to offload rendering layout to the browser efficiently.

## 2024-05-26 - [Avoid Re-renders of Heavy UI Panels on Form Keystrokes]
**Learning:** Found a performance bottleneck where rapid typing in the main form (e.g., `MergeBuilder`) caused complex child components like `DynamicVisualizer`, `CompactOutputPanel`, and `ProcessLogs` to re-render entirely. This caused laggy text input and UI unresponsiveness.
**Action:** Wrapped heavy child components in `React.memo()` to isolate them from their parent's state updates, specifically avoiding re-renders unless their explicit props change.

## 2024-06-05 - [Avoid Sequential Network Requests in React Effects]
**Learning:** Found a performance bottleneck in `MergeBuilder.jsx` where `axios.post` API calls inside the `checkCompatibility` effect were being executed sequentially inside a `for...of` loop. This caused network latency to scale linearly with the number of uncached models (O(N) latency hops) blocking UI feedback.
**Action:** Replaced the sequential await loop with a `Promise.all` approach to fetch all missing HuggingFace model configurations concurrently, reducing network latency back to O(1).

## 2024-06-12 - [Global HTTPX AsyncClient for Connection Pooling]
**Learning:** Instantiating `httpx.AsyncClient()` inside `get_model_config` meant a new TCP/TLS connection was opened for every model configuration request. This overhead completely negated the performance benefits of using `Promise.all` in the frontend when fetching multiple missing configurations concurrently.
**Action:** Created a single global `_client = httpx.AsyncClient()` in `hf_client.py` and reused it across requests. This utilizes HTTP keep-alive and connection pooling, dropping the latency of subsequent requests to the HuggingFace API to ~0ms setup time.

## 2024-06-19 - [Avoid Synchronous File I/O in FastAPI Async Endpoints]
**Learning:** Found a performance bottleneck in `backend/api/endpoints.py` where synchronous disk I/O operations (`json.load` in `load_settings` and `open().read()` in `generate_merge_config`) were executed directly inside `async def` endpoints. This blocks the main Python event loop, preventing FastAPI from processing other concurrent requests or websocket events while waiting on disk access.
**Action:** Wrapped synchronous file I/O operations inside `async def` endpoints with `await asyncio.to_thread()`. This offloads the blocking disk reads to a separate threadpool, allowing the main event loop to remain fully responsive to other async operations.

## 2024-07-25 - [Extract Stateless Helper Functions to Prevent Reallocation]
**Learning:** When dependencies update rapidly (like the `models` array on every keystroke), wrapping inline computations in `useMemo` degrades typing performance by forcing the computation during the render phase. Inline helper functions and arrays (like `parseParams` and `mergeMethods` in `MergeBuilder.jsx`) are also re-allocated on every render.
**Action:** Prioritize extracting stateless helper functions and static arrays outside the component body. This prevents unnecessary memory reallocation during rapid re-renders without adding the overhead of `useMemo`.

## 2024-07-26 - [Custom React.memo Equality Function for Partial Props Updates]
**Learning:** Found a performance bottleneck where rapid typing in the model `parameters` input caused the `DynamicVisualizer` component to re-render. Although `DynamicVisualizer` was wrapped in `React.memo()`, the parent's `models` array reference changed on every keystroke. Since the visualizer only cared about the `method`, `baseModel`, and `model_id`s (and ignored `parameters`), the default shallow comparison failed, causing unnecessary re-renders of a heavy UI panel.
**Action:** Implemented a custom equality function for `React.memo()` in `DynamicVisualizer` that explicitly checks `method`, `baseModel`, and iterates through the `models` array to only compare `model_id`s. This successfully isolates the visualizer from parameter keystroke updates.

## 2025-02-28 - [Extract Stateless Helpers in React to Prevent Reallocation]
**Learning:** Discovered a codebase-specific pattern where extracting stateless helper functions, like `getBaseName` in `Quantizer.jsx`, to the module scope (outside the component function) avoids unnecessary memory reallocation on every keystroke when typing into text fields.
**Action:** Always scan for helper functions that don't depend on component props or state, and extract them outside of the React component body to reduce garbage collection overhead during rapid parent state updates.
