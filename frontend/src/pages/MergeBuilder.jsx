import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash, Activity, Copy, Check, AlertTriangle } from "lucide-react";

export default function MergeBuilder() {
  const [method, setMethod] = useState("slerp");
  const [copied, setCopied] = useState(false);
  const [baseModel, setBaseModel] = useState("");
  const [models, setModels] = useState([{ model_id: "", parameters: "" }]);
  const [globalParams, setGlobalParams] = useState("");
  const [yamlPreview, setYamlPreview] = useState("");
  const [compatibilityIssue, setCompatibilityIssue] = useState(null);

  const mergeMethods = ["slerp", "ties", "dare_ties", "dare_linear", "passthrough", "linear"];

  useEffect(() => {
    // Auto-check compatibility if we have multiple models
    const checkCompatibility = async () => {
      const validModels = models.filter(m => m.model_id.length > 5);
      const toCheck = [];
      if (baseModel.length > 5) toCheck.push(baseModel);
      toCheck.push(...validModels.map(m => m.model_id));

      if (toCheck.length < 2) {
          setCompatibilityIssue(null);
          return;
      }

      try {
        const configs = await Promise.all(
            toCheck.map(id => axios.post("http://localhost:8000/api/hf/config", { model_id: id }).catch(() => null))
        );

        const validConfigs = configs.map(c => c?.data).filter(Boolean);
        if (validConfigs.length < 2) return;

        const baseCfg = validConfigs[0];
        const issues = [];

        for (let i = 1; i < validConfigs.length; i++) {
         const cfg = validConfigs[i];
         if (cfg.hidden_size !== baseCfg.hidden_size || cfg.num_layers !== baseCfg.num_layers) {
            issues.push(`Architecture mismatch detected between models`);
            break;
         }
        }

        if (issues.length > 0) {
          setCompatibilityIssue(issues.join(". "));
        } else {
          setCompatibilityIssue(null);
        }

      } catch (err) {
        setCompatibilityIssue(null);
      }
    };

    const timeoutId = setTimeout(checkCompatibility, 1000);
    return () => clearTimeout(timeoutId);
  }, [baseModel, models]);

  const handleAddModel = () => setModels([...models, { model_id: "", parameters: "" }]);

  const handleRemoveModel = (index) => {
    const newModels = [...models];
    newModels.splice(index, 1);
    setModels(newModels);
  };

  const handleModelChange = (index, field, value) => {
    const newModels = [...models];
    newModels[index][field] = value;
    setModels(newModels);
  };

  const parseParams = (paramString) => {
    if (!paramString) return null;
    try {
      // Very basic parser: expects format "t: 0.5" or "weight: 1.0"
      const lines = paramString.split('\n').filter(l => l.trim());
      const obj = {};
      lines.forEach(l => {
        const [k, v] = l.split(':').map(s => s.trim());
        // Attempt to parse number if possible, else string
        const numV = Number(v);
        obj[k] = isNaN(numV) ? v : numV;
      });
      return obj;
    } catch {
      return null;
    }
  };

  const generateYaml = async () => {
    const payload = {
      merge_method: method,
      base_model: baseModel || null,
      models: models.map(m => ({
        model_id: m.model_id,
        parameters: parseParams(m.parameters) || {}
      })),
      parameters: parseParams(globalParams) || {}
    };

    try {
      const res = await axios.post("http://localhost:8000/api/merge/generate-config", payload);
      setYamlPreview(res.data.yaml_content);
    } catch (err) {
      setYamlPreview("Error generating YAML: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-700 pb-5">
        <h3 className="text-2xl font-semibold leading-6 text-white">Merge Builder</h3>
        <p className="mt-2 max-w-4xl text-sm text-slate-400">
          Design your model merge configuration visually. Generates the required YAML for Mergekit.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 xl:grid-cols-2">
        {/* Left Column: Form */}
        <div className="space-y-6">
          {compatibilityIssue && (
              <div className="bg-red-900/20 border border-red-800 p-4 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="text-red-500 mt-0.5" size={20} />
                  <div>
                      <h4 className="text-sm font-medium text-red-400">Compatibility Warning</h4>
                      <p className="text-sm text-red-300 mt-1">{compatibilityIssue}</p>
                  </div>
              </div>
          )}

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium leading-6 text-white">Merge Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 pl-3 pr-10 text-white ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
              >
                {mergeMethods.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>

            {["ties", "dare_ties", "dare_linear", "passthrough"].includes(method) && (
              <div>
                <label className="block text-sm font-medium leading-6 text-white">Base Model (Optional/Required for Method)</label>
                <input
                  type="text"
                  value={baseModel}
                  onChange={(e) => setBaseModel(e.target.value)}
                  placeholder="e.g. meta-llama/Meta-Llama-3-8B"
                  className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 text-white ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
                />
              </div>
            )}

            <div>
               <label className="block text-sm font-medium leading-6 text-white mb-2">Global Parameters</label>
               <textarea
                  value={globalParams}
                  onChange={(e) => setGlobalParams(e.target.value)}
                  placeholder="t: 0.5&#10;density: 0.5"
                  className="block w-full rounded-md border-0 bg-slate-900 py-1.5 text-white ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 font-mono h-24"
               />
               <p className="mt-2 text-xs text-slate-500">One per line, e.g. `key: value`</p>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-white">Models</h4>
              <button
                onClick={handleAddModel}
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1 hover:bg-blue-400/10"
              >
                <Plus size={16} /> Add Model
              </button>
            </div>

            {models.map((m, idx) => (
              <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-700 relative group">
                <button
                  onClick={() => handleRemoveModel(idx)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-red-500 rounded p-1.5 hover:bg-red-400/10 opacity-70 group-hover:opacity-100"
                  aria-label="Remove model"
                  title="Remove model"
                >
                  <Trash size={16} />
                </button>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium leading-6 text-white">Model ID / Path</label>
                    <input
                      type="text"
                      value={m.model_id}
                      onChange={(e) => handleModelChange(idx, "model_id", e.target.value)}
                      placeholder="e.g. NousResearch/Hermes-2-Pro-Llama-3-8B"
                      className="mt-2 block w-full rounded-md border-0 bg-slate-800 py-1.5 text-white ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-6 text-white">Model Parameters (Optional)</label>
                    <textarea
                      value={m.parameters}
                      onChange={(e) => handleModelChange(idx, "parameters", e.target.value)}
                      placeholder="weight: 1.0"
                      className="mt-2 block w-full rounded-md border-0 bg-slate-800 py-1.5 text-white ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 font-mono h-20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={generateYaml}
            className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            <Activity size={18} className="mr-2" /> Generate YAML Configuration
          </button>
        </div>

        {/* Right Column: Visualizer & Output */}
        <div className="xl:col-span-1 space-y-6 flex flex-col h-full">
            <DynamicVisualizer
                method={method}
                baseModel={baseModel}
                models={models}
            />
            <div className="flex-1 min-h-[400px]">
                <CompactOutputPanel
                    yamlPreview={yamlPreview}
                    copied={copied}
                    setCopied={setCopied}
                />
            </div>
        </div>
      </div>
    </div>
  );
}

function DynamicVisualizer({ method, baseModel, models }) {
    // Determine active models to show
    const activeModels = [];
    if (["ties", "dare_ties", "dare_linear", "passthrough"].includes(method) && baseModel) {
        activeModels.push({ type: 'base', name: baseModel.split('/').pop() || 'Base Model' });
    }
    models.forEach((m, idx) => {
        if (m.model_id) activeModels.push({ type: 'merge', name: m.model_id.split('/').pop() || `Model ${idx + 1}` });
    });

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center min-h-[250px] space-y-4">
            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider w-full border-b border-slate-700 pb-2 text-left">Merge Visualization</h4>

            {activeModels.length === 0 ? (
                <div className="text-slate-500 text-sm">Add models to visualize architecture</div>
            ) : (
                <div className="flex flex-col items-center gap-4 w-full pt-4">
                   <div className="flex flex-wrap justify-center gap-4 w-full">
                       {activeModels.map((m, i) => (
                           <div key={i} className={`px-4 py-2 rounded border text-sm text-center ${m.type === 'base' ? 'bg-blue-900/30 border-blue-700 text-blue-300' : 'bg-slate-700 border-slate-600 text-slate-200'}`}>
                               {m.name}
                           </div>
                       ))}
                   </div>

                   {activeModels.length > 1 && (
                       <>
                           <div className="h-6 w-px bg-slate-600"></div>
                           <div className="px-6 py-2 rounded-full bg-purple-900/50 border border-purple-700 text-purple-300 text-sm font-mono font-bold">
                               {method.toUpperCase()}
                           </div>
                           <div className="h-6 w-px bg-slate-600"></div>
                           <div className="px-8 py-3 rounded-lg bg-green-900/30 border border-green-700 text-green-400 font-bold shadow-[0_0_15px_rgba(74,222,128,0.1)]">
                               Merged Output
                           </div>
                       </>
                   )}
                </div>
            )}
        </div>
    );
}

function CompactOutputPanel({ yamlPreview, copied, setCopied }) {
    return (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">YAML Output</h4>
                <button
                    onClick={() => {
                        if (yamlPreview) {
                            navigator.clipboard.writeText(yamlPreview);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }
                    }}
                    disabled={!yamlPreview}
                    className="text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1"
                    aria-label="Copy YAML to clipboard"
                    title="Copy YAML"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
            </div>
            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap flex-1 overflow-auto p-2 bg-black/50 rounded-lg">
                {yamlPreview || "# Click generate to preview configuration"}
            </pre>
        </div>
    );
}
