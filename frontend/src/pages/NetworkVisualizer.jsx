import { useState } from "react";
import axios from "axios";
import { AlertTriangle, CheckCircle, Search } from "lucide-react";

export default function NetworkVisualizer() {
  const [modelA, setModelA] = useState("");
  const [modelB, setModelB] = useState("");
  const [configA, setConfigA] = useState(null);
  const [configB, setConfigB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchConfigs = async () => {
    setLoading(true);
    setError("");
    setConfigA(null);
    setConfigB(null);

    try {
      const resA = await axios.post("http://localhost:8000/api/hf/config", { model_id: modelA });
      setConfigA(resA.data);

      if (modelB) {
         const resB = await axios.post("http://localhost:8000/api/hf/config", { model_id: modelB });
         setConfigB(resB.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCompatibility = () => {
    if (!configA || !configB) return null;

    const issues = [];
    if (configA.hidden_size !== configB.hidden_size) {
      issues.push(`Hidden sizes mismatch: ${configA.hidden_size} vs ${configB.hidden_size}`);
    }
    if (configA.num_layers !== configB.num_layers) {
      issues.push(`Layer counts mismatch: ${configA.num_layers} vs ${configB.num_layers}`);
    }
    if (configA.vocab_size !== configB.vocab_size) {
      issues.push(`Vocabulary sizes mismatch: ${configA.vocab_size} vs ${configB.vocab_size}`);
    }

    if (issues.length > 0) {
      return { status: "incompatible", issues };
    }
    return { status: "compatible", issues: [] };
  };

  const comp = getCompatibility();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-700 pb-5">
        <h3 className="text-2xl font-semibold leading-6 text-white">Network Visualizer</h3>
        <p className="mt-2 max-w-4xl text-sm text-slate-400">
          Check model compatibility and architecture before downloading weights.
        </p>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium leading-6 text-white">Base Model (A)</label>
            <input
              type="text"
              value={modelA}
              onChange={(e) => setModelA(e.target.value)}
              placeholder="meta-llama/Meta-Llama-3-8B"
              className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
            />
          </div>
          <div>
            <label className="block text-sm font-medium leading-6 text-white">Model to Merge (B)</label>
            <input
              type="text"
              value={modelB}
              onChange={(e) => setModelB(e.target.value)}
              placeholder="NousResearch/Hermes-2-Pro-Llama-3-8B"
              className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <button
            onClick={fetchConfigs}
            disabled={!modelA || loading}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Search size={16} /> {loading ? "Fetching Architectures..." : "Analyze Compatibility"}
        </button>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </div>

      {comp && (
        <div className={`p-4 rounded-lg border ${comp.status === "compatible" ? "bg-green-900/20 border-green-800" : "bg-red-900/20 border-red-800"}`}>
          <div className="flex items-center gap-3">
            {comp.status === "compatible" ? (
               <CheckCircle className="text-green-500" size={24} />
            ) : (
               <AlertTriangle className="text-red-500" size={24} />
            )}
            <h4 className={`text-lg font-medium ${comp.status === "compatible" ? "text-green-400" : "text-red-400"}`}>
              {comp.status === "compatible" ? "Models are structurally compatible for SLERP/TIES/DARE" : "Models have structural mismatches"}
            </h4>
          </div>
          {comp.issues.length > 0 && (
            <ul className="mt-3 list-disc list-inside text-sm text-red-300 ml-8">
              {comp.issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {configA && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h4 className="text-lg font-medium text-white mb-4 border-b border-slate-700 pb-2">{modelA.split("/").pop()}</h4>
             <ul className="text-sm text-slate-300 space-y-2 mb-6">
                <li><strong className="text-slate-100">Architecture:</strong> {configA.architectures?.[0]}</li>
                <li><strong className="text-slate-100">Layers:</strong> {configA.num_layers}</li>
                <li><strong className="text-slate-100">Hidden Size:</strong> {configA.hidden_size}</li>
                <li><strong className="text-slate-100">Vocab Size:</strong> {configA.vocab_size}</li>
             </ul>

             {/* Visual representation of layers */}
             <div className="space-y-1">
                <div className="bg-blue-900/50 border border-blue-800 text-center py-1 text-xs text-blue-300 rounded">Input Embeddings</div>
                <div className="h-4 flex justify-center"><div className="w-0.5 bg-slate-600"></div></div>
                <div className="bg-slate-700 border border-slate-600 text-center py-2 text-xs text-slate-300 rounded relative group cursor-pointer">
                    Layer 0 to {configA.num_layers - 1} ({configA.num_layers} transformer blocks)
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded"></div>
                </div>
                <div className="h-4 flex justify-center"><div className="w-0.5 bg-slate-600"></div></div>
                <div className="bg-purple-900/50 border border-purple-800 text-center py-1 text-xs text-purple-300 rounded">LM Head (Vocab {configA.vocab_size})</div>
             </div>
          </div>
        )}

        {configB && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <h4 className="text-lg font-medium text-white mb-4 border-b border-slate-700 pb-2">{modelB.split("/").pop()}</h4>
             <ul className="text-sm text-slate-300 space-y-2 mb-6">
                <li><strong className="text-slate-100">Architecture:</strong> {configB.architectures?.[0]}</li>
                <li><strong className="text-slate-100">Layers:</strong> {configB.num_layers}</li>
                <li><strong className="text-slate-100">Hidden Size:</strong> {configB.hidden_size}</li>
                <li><strong className="text-slate-100">Vocab Size:</strong> {configB.vocab_size}</li>
             </ul>

             {/* Visual representation of layers */}
             <div className="space-y-1">
                <div className="bg-amber-900/50 border border-amber-800 text-center py-1 text-xs text-amber-300 rounded">Input Embeddings</div>
                <div className="h-4 flex justify-center"><div className="w-0.5 bg-slate-600"></div></div>
                <div className="bg-slate-700 border border-slate-600 text-center py-2 text-xs text-slate-300 rounded relative group cursor-pointer">
                    Layer 0 to {configB.num_layers - 1} ({configB.num_layers} transformer blocks)
                    <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded"></div>
                </div>
                <div className="h-4 flex justify-center"><div className="w-0.5 bg-slate-600"></div></div>
                <div className="bg-emerald-900/50 border border-emerald-800 text-center py-1 text-xs text-emerald-300 rounded">LM Head (Vocab {configB.vocab_size})</div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
