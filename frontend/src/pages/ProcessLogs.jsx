import { useState, useEffect, useRef, memo } from "react";
import { Terminal, Play, StopCircle } from "lucide-react";

const ProcessLogs = memo(function ProcessLogs({ isCompact }) {
  // Performance optimization: Store logs as a single string instead of an array.
  // This prevents O(N^2) memory reallocation during rapid websocket streams and
  // avoids rendering thousands of individual <div> DOM nodes which freezes the main thread.
  const [logs, setLogs] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const logEndRef = useRef(null);

  useEffect(() => {
    // Auto scroll to bottom when new logs arrive
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const startProcess = (cmdObject) => {
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
      setLogs(prev => prev + event.data + "\n");
    };

    ws.onerror = (error) => {
      setLogs(prev => prev + `[WebSocket Error] ${error.message || "Unknown error"}\n`);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setLogs(prev => prev + "[Process Completed / Disconnected]\n");
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    const checkCommand = () => {
      const cmdStr = localStorage.getItem("runCommand");
      if (cmdStr) {
        try {
          const cmd = JSON.parse(cmdStr);
          // Delay slightly to prevent setState during render cycle
          setTimeout(() => {
            startProcess(cmd);
            localStorage.removeItem("runCommand");
          }, 100);
        } catch {
          console.error("Invalid command found in localStorage");
        }
      }
    };

    checkCommand();
    window.addEventListener("runCommandTriggered", checkCommand);
    return () => window.removeEventListener("runCommandTriggered", checkCommand);
  }, []);
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
          <h3 className="text-2xl font-semibold leading-6 text-white">Process & Logs</h3>
          <p className="mt-2 max-w-4xl text-sm text-slate-400">
            Run merge and quantization jobs. View real-time output.
          </p>
        </div>
      )}

      <div className="flex gap-4 mb-2">
         <button
          onClick={handleStartMerge}
          disabled={isConnected}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
         >
          <Play size={16} /> Start Merge Job
         </button>

         <button
          onClick={stopProcess}
          disabled={!isConnected}
          className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
         >
          <StopCircle size={16} /> Stop Process
         </button>
      </div>

      <div className={`flex-1 flex flex-col ${isCompact ? 'bg-black min-h-0' : 'bg-slate-950 p-6 rounded-xl border border-slate-700 min-h-[500px]'}`}>
        {!isCompact && (
          <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Terminal size={16} /> Terminal Output
          </h4>
        )}
        <div className={`text-sm text-green-400 font-mono whitespace-pre-wrap flex-1 overflow-auto ${isCompact ? 'p-2' : 'bg-black p-4 rounded-lg'}`}>
          {logs.length === 0 ? (
             <span className="text-slate-600">No active process. Ready...</span>
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
