import { memo } from "react";
import ProcessLogs from "../pages/ProcessLogs";
import { Copy, Check } from "lucide-react";

const CompactOutputPanel = memo(function CompactOutputPanel({ yamlPreview, copied, setCopied, activeTab, setActiveTab }) {
  return (
    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 h-full flex flex-col min-h-[400px]">
        {/* Header Tabs */}
        <div className="flex justify-between items-center border-b border-slate-800 mb-4">
            <div className="flex">
                <button
                    onClick={() => setActiveTab("yaml")}
                    className={`px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors ${
                        activeTab === "yaml" ? "text-blue-400 border-b-2 border-blue-500" : "text-slate-500 border-b-2 border-transparent hover:text-slate-300"
                    }`}
                >
                    YAML Output
                </button>
                <button
                    onClick={() => setActiveTab("logs")}
                    className={`px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors ${
                        activeTab === "logs" ? "text-blue-400 border-b-2 border-blue-500" : "text-slate-500 border-b-2 border-transparent hover:text-slate-300"
                    }`}
                >
                    Process & Logs
                </button>
            </div>
            {activeTab === "yaml" && (
                <button
                    onClick={() => {
                        if (yamlPreview) {
                            navigator.clipboard.writeText(yamlPreview);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }
                    }}
                    disabled={!yamlPreview}
                    className="text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1 mr-2"
                    aria-label="Copy YAML to clipboard"
                    title="Copy YAML"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
            )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto flex flex-col relative h-full">
            {activeTab === "yaml" && (
                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap flex-1 overflow-auto p-4 bg-black/50 rounded-lg">
                    {yamlPreview || "# Click generate to preview configuration"}
                </pre>
            )}

            {activeTab === "logs" && (
                <div className="flex-1 rounded-lg overflow-hidden relative">
                   <div className="absolute inset-0 bg-black/50 overflow-y-auto">
                        <ProcessLogs isCompact={true} />
                   </div>
                </div>
            )}
        </div>
    </div>
  );
});

export default CompactOutputPanel;
