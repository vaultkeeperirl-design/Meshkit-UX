import { memo } from "react";
import ProcessLogs from "../pages/ProcessLogs";
import { Copy, Check } from "lucide-react";

/**
 * A memoized panel component that toggles between showing generated YAML configuration and real-time process logs.
 * Includes functionality to copy the YAML preview to the clipboard.
 *
 * @component
 * @param {Object} props
 * @param {string} props.yamlPreview - The generated YAML configuration string to display.
 * @param {boolean} props.copied - State indicating if the YAML has been successfully copied.
 * @param {function(boolean): void} props.setCopied - State setter to handle the copied status toggle.
 * @param {string} props.activeTab - The currently active tab, either 'yaml' or 'logs'.
 * @param {function(string): void} props.setActiveTab - State setter to switch the active tab.
 * @returns {JSX.Element} The rendered output panel with YAML preview and process logs.
 */
const CompactOutputPanel = memo(function CompactOutputPanel({ yamlPreview, copied, setCopied, activeTab, setActiveTab }) {
  return (
    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 h-full flex flex-col min-h-[400px]">
        {/* Header Tabs */}
        <div className="flex justify-between items-center border-b border-slate-800 mb-4">
            <div className="flex" role="tablist" aria-label="Output Views">
                <button
                    id="tab-yaml"
                    role="tab"
                    aria-selected={activeTab === "yaml"}
                    aria-controls="tabpanel-yaml"
                    onClick={() => setActiveTab("yaml")}
                    className={`px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-200 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-md ${
                        activeTab === "yaml" ? "text-blue-400 border-b-2 border-blue-500" : "text-slate-400 border-b-2 border-transparent hover:text-slate-300"
                    }`}
                >
                    YAML Output
                </button>
                <button
                    id="tab-logs"
                    role="tab"
                    aria-selected={activeTab === "logs"}
                    aria-controls="tabpanel-logs"
                    onClick={() => setActiveTab("logs")}
                    className={`px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-200 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-md ${
                        activeTab === "logs" ? "text-blue-400 border-b-2 border-blue-500" : "text-slate-400 border-b-2 border-transparent hover:text-slate-300"
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
                    className="text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1 mr-2"
                    aria-label="Copy YAML to clipboard"
                    title="Copy YAML"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
            )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto flex flex-col relative h-full">
            <pre
                id="tabpanel-yaml"
                role="tabpanel"
                aria-labelledby="tab-yaml"
                tabIndex={0}
                className={`text-sm text-green-400 font-mono whitespace-pre-wrap flex-1 overflow-auto p-4 bg-black/50 rounded-lg focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${activeTab === "yaml" ? "block" : "hidden"}`}
            >
                {yamlPreview || "# Click generate to preview configuration"}
            </pre>

            <div id="tabpanel-logs" role="tabpanel" aria-labelledby="tab-logs" className={`flex-1 rounded-lg overflow-hidden relative ${activeTab === "logs" ? "block" : "hidden"}`}>
               <div className="absolute inset-0 bg-black/50 overflow-y-auto">
                    <ProcessLogs isCompact={true} />
               </div>
            </div>
        </div>
    </div>
  );
});

export default CompactOutputPanel;
