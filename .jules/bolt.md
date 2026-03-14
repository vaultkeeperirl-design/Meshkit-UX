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
