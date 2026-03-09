import { useState, useEffect, useRef } from "react";
import { Terminal, Play, StopCircle } from "lucide-react";

export default function ProcessLogs() {
  const [logs, setLogs] = useState([]);
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
    setLogs([`Connecting to backend for action: ${cmdObject.action}...`]);

    const ws = new WebSocket("ws://localhost:8000/api/ws/logs");

    ws.onopen = () => {
      setIsConnected(true);
      setLogs(prev => [...prev, "Connected. Starting process..."]);
      ws.send(JSON.stringify(cmdObject));
    };

    ws.onmessage = (event) => {
      setLogs(prev => [...prev, event.data]);
    };

    ws.onerror = (error) => {
      setLogs(prev => [...prev, `[WebSocket Error] ${error.message || "Unknown error"}`]);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setLogs(prev => [...prev, "[Process Completed / Disconnected]"]);
    };

    wsRef.current = ws;
  };

  useEffect(() => {
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
    <div className="space-y-6 flex flex-col h-full">
      <div className="border-b border-slate-700 pb-5">
        <h3 className="text-2xl font-semibold leading-6 text-white">Process & Logs</h3>
        <p className="mt-2 max-w-4xl text-sm text-slate-400">
          Run merge and quantization jobs. View real-time output.
        </p>
      </div>

      <div className="flex gap-4 mb-4">
         <button
          onClick={handleStartMerge}
          disabled={isConnected}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
         >
          <Play size={16} /> Start Merge Job
         </button>

         <button
          onClick={stopProcess}
          disabled={!isConnected}
          className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
         >
          <StopCircle size={16} /> Stop Process
         </button>
      </div>

      <div className="bg-slate-950 p-6 rounded-xl border border-slate-700 flex-1 flex flex-col min-h-[500px]">
        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Terminal size={16} /> Terminal Output
        </h4>
        <div className="text-sm text-green-400 font-mono whitespace-pre-wrap flex-1 overflow-auto bg-black p-4 rounded-lg">
          {logs.length === 0 ? (
             <span className="text-slate-600">No active process. Ready...</span>
          ) : (
             logs.map((log, idx) => (
                <div key={idx}>{log}</div>
             ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
