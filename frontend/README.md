# Meshkit UX (Frontend)

This directory contains the React-based frontend for **Mergekit Studio**, providing a powerful, local UI for `mergekit` and `llama.cpp`. It is wrapped in an Electron application for standalone desktop distribution.

## Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + PostCSS
- **Icons:** Lucide React
- **Desktop Wrapper:** Electron + electron-builder
- **HTTP Client:** Axios (to communicate with the Python FastAPI backend)
- **Routing:** React Router DOM

## Development Setup

### 1. Install Dependencies

Make sure you have Node.js installed, then run:

```bash
cd frontend
npm install
```

### 2. Running in Development Mode

You have two options for development:

**Option A: Browser Only (Web Mode)**
Great for rapid UI iteration.
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. (Ensure the backend is running on port 8000).

**Option B: Electron Desktop App**
Runs both the Vite server and the Electron wrapper concurrently.
```bash
npm run electron:dev
```

## Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles the React app for production.
- `npm run lint`: Runs ESLint to check for code quality and syntax issues.
- `npm run preview`: Previews the production build locally.
- `npm run electron:dev`: Starts the app in a local Electron window with hot-reloading.
- `npm run electron:build`: Builds the final executable (`.exe` for Windows, `.AppImage`/`.tar.gz` for Linux) via `electron-builder`.

## Project Structure

- `src/components/`: Reusable UI components (e.g., Layout, visualizers, panels).
- `src/pages/`: Main application views (MergeBuilder, Quantizer, ProcessLogs, Settings).
- `src/assets/`: Static assets.
- `electron/`: Electron main process scripts.
- `public/`: Public assets, including screenshots used in the root README.

## Best Practices & Guidelines

- **Memoization:** Heavy UI components (like `DynamicVisualizer` and `CompactOutputPanel`) use `React.memo()` to prevent unnecessary re-renders during rapid parent state updates (like typing in form fields).
- **Decoupled State:** When managing modal or drawer states across the app, avoid React Router path interceptions. Instead, use lifted state or global window functions (e.g., `window.__closeModals()`) to avoid cascading renders.
- **Log Streaming:** To optimize rendering of high-frequency streaming text from websockets in the `ProcessLogs` component, logs are stored as a single concatenated string rather than mapping an array of strings to thousands of individual DOM nodes. This prevents O(N²) memory reallocation and main thread blocking.
- **Accessibility:** Ensure keyboard accessibility by utilizing Tailwind's `focus-visible` pseudo-class (e.g., `focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500`) on all interactive elements.

## Linting & Code Quality

Before submitting a Pull Request, always ensure your code passes the linter:

```bash
npm run lint
```
Do not suppress ESLint errors unless absolutely necessary, and always fix the root cause of any warnings.
