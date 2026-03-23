import { useState, useEffect, useRef, memo, useCallback } from "react";
import { Terminal, Play, StopCircle } from "lucide-react";

/**
 * A memoized component that displays real-time process logs via a WebSocket connection.
 * It listens for commands triggered across the application (via localStorage and custom events)
 * to start background jobs like merging or quantization, and streams their output.
 *
 * @component
 * @param {Object} props
 * @param {boolean} [props.isCompact=false] - If true, renders a simplified UI without headers or borders, suitable for embedding in smaller panels.
 * @returns {JSX.Element} The rendered logs terminal interface.
 */
const ProcessLogs = memo(function ProcessLogs({ isCompact }) {
  // Performance optimization: Store logs as a single string instead of an array.
  // This prevents O(N^2) memory reallocation during rapid websocket streams and
  // avoids rendering thousands of individual <div> DOM nodes which freezes the main thread.
  const [logs, setLogs] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const logEndRef = useRef(null);
  const logBuffer = useRef([]);
  const animationFrameId = useRef(null);

  useEffect(() => {
    // Auto scroll to bottom when new logs arrive
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  /**
   * Initializes a WebSocket connection to the backend to start a process and stream its logs.
   * Closes any existing connection before starting a new one.
   *
   * @param {Object} cmdObject - The payload defining the job to run (e.g., action type, paths, parameters).
   */
  const startProcess = useCallback((cmdObject) => {
    if (wsRef.current) {
        wsRef.current.close();
    }
    setLogs(`Connecting to backend for action: ${cmdObject.action}...\n`);

    const ws = new WebSocket("ws://localhost:8000/api/ws/logs");

    ws.onopen = () => {
      setIsConnected(true);
      setLogs(prev => prev + "Connected. Starting process...\n");
      ws.send(JSON.stringify(cmdObject));
    };

    ws.onmessage = (event) => {
      logBuffer.current.push(event.data + "\n");
      if (!animationFrameId.current) {
        animationFrameId.current = requestAnimationFrame(() => {
          setLogs(prev => prev + logBuffer.current.join(""));
          logBuffer.current = [];
          animationFrameId.current = null;
        });
      }
    };

    ws.onerror = (error) => {
      setLogs(prev => prev + `[WebSocket Error] ${error.message || "Unknown error"}\n`);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setLogs(prev => prev + "[Process Completed / Disconnected]\n");
    };

    wsRef.current = ws;
  }, []);

  /**
   * Effect hook to listen for a cross-component trigger to run a command.
   * It receives the command payload via the CustomEvent detail.
   */
  useEffect(() => {
    const handleCommand = (e) => {
      if (e.detail) {
        startProcess(e.detail);
      }
    };

    window.addEventListener("runCommandTriggered", handleCommand);
    return () => window.removeEventListener("runCommandTriggered", handleCommand);
  }, [startProcess]);
  const handleStartMerge = () => {
     startProcess({
        action: "merge",
        yaml_path: "merge_config.yml",
        output_path: "./merged_model"
     });
  };

  const stopProcess = () => {
      if (wsRef.current) {
          wsRef.current.close();
      }
  };

  return (
    <div className={`space-y-4 flex flex-col h-full ${isCompact ? '' : 'p-6'}`}>
      {!isCompact && (
        <div className="border-b border-slate-700 pb-5">
          <h2 className="text-2xl font-semibold leading-6 text-white">Process & Logs</h2>
          <p className="mt-2 max-w-4xl text-sm text-slate-400">
            Run merge and quantization jobs. View real-time output.
          </p>
        </div>
      )}

      <div className="flex gap-4 mb-2">
         <button
          onClick={handleStartMerge}
          disabled={isConnected}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
         >
          <Play size={16} /> Start Merge Job
         </button>

         <button
          onClick={stopProcess}
          disabled={!isConnected}
          className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
         >
          <StopCircle size={16} /> Stop Process
         </button>
      </div>

      <div className={`flex-1 flex flex-col ${isCompact ? 'bg-black min-h-0' : 'bg-slate-950 p-6 rounded-xl border border-slate-700 min-h-[500px]'}`}>
        {!isCompact && (
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Terminal size={16} /> Terminal Output
          </h3>
        )}
        <div className={`text-sm text-green-400 font-mono whitespace-pre-wrap flex-1 overflow-auto ${isCompact ? 'p-2' : 'bg-black p-4 rounded-lg'}`}>
          {logs.length === 0 ? (
             <span className="text-slate-400">No active process. Ready...</span>
          ) : (
             logs
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
});

export default ProcessLogs;
