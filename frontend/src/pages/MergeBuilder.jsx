import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Trash, Activity, AlertTriangle, Play, Eye, Loader2, Check } from "lucide-react";
import DynamicVisualizer from "../components/DynamicVisualizer";
import CompactOutputPanel from "../components/CompactOutputPanel";

/**
 * The primary view for constructing Mergekit configurations.
 * Allows users to select a merge method, define the base model and input models,
 * adjust global and model-specific parameters, and preview the resulting YAML.
 * Also handles backend validation for HuggingFace model architecture compatibility.
 *
 * @component
 * @returns {JSX.Element} The rendered MergeBuilder page.
 */
export default function MergeBuilder() {
  const [method, setMethod] = useState("slerp");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("yaml");
  const [baseModel, setBaseModel] = useState("");
  const [models, setModels] = useState([{ model_id: "", parameters: "" }]);
  const [globalParams, setGlobalParams] = useState("");
  const [yamlPreview, setYamlPreview] = useState("");
  const [compatibilityIssue, setCompatibilityIssue] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  // Cache to store already fetched model configurations
  const configCache = useRef({});

  const mergeMethods = ["slerp", "ties", "dare_ties", "dare_linear", "passthrough", "linear"];

  useEffect(() => {
    const checkCompatibility = async () => {
      const uniqueModels = new Set();
      if (baseModel.trim()) uniqueModels.add(baseModel.trim());
      models.forEach(m => {
        if (m.model_id.trim()) uniqueModels.add(m.model_id.trim());
      });

      const modelList = Array.from(uniqueModels);
      if (modelList.length < 2) {
        setCompatibilityIssue(null);
        return;
      }

      try {
        // Performance optimization: Use Promise.all to fetch all missing configurations concurrently
        // instead of sequentially in a loop. This reduces latency from O(N) to O(1) network hops.
        const fetchPromises = modelList.map(async (mId) => {
          if (configCache.current[mId]) {
            return { id: mId, data: configCache.current[mId], cached: true };
          }

          try {
            const res = await axios.post("http://localhost:8000/api/hf/config", { model_id: mId });
            return { id: mId, data: res.data, cached: false };
          } catch (err) {
            console.warn(`Failed to fetch config for ${mId}`, err);
            return null; // Ignore errors for individual models
          }
        });

        const results = await Promise.all(fetchPromises);

        // Filter out any failed requests and save successful ones to cache
        const configs = [];
        for (const result of results) {
           if (result) {
               if (!result.cached) {
                   configCache.current[result.id] = result.data;
               }
               configs.push({ id: result.id, data: result.data });
           }
        }

        if (configs.length < 2) {
          setCompatibilityIssue(null);
          return;
        }

        // Compare all fetched configs against the first one
        const baseCfg = configs[0].data;
        const issues = [];

        for (let i = 1; i < configs.length; i++) {
          const cmpCfg = configs[i].data;
          const cmpId = configs[i].id;

          if (baseCfg.hidden_size !== cmpCfg.hidden_size) {
            issues.push(`${cmpId} hidden size (${cmpCfg.hidden_size}) mismatches base (${baseCfg.hidden_size})`);
          }
          if (baseCfg.num_layers !== cmpCfg.num_layers) {
            issues.push(`${cmpId} layers (${cmpCfg.num_layers}) mismatches base (${baseCfg.num_layers})`);
          }
        }

        if (issues.length > 0) {
          setCompatibilityIssue(issues.join(". "));
        } else {
          setCompatibilityIssue(null);
        }

      } catch {
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

  // Expose a globally accessible method to switch tabs, bypassing React router
  useEffect(() => {
    window.__openLogsTab = () => setActiveTab("logs");
    return () => { delete window.__openLogsTab; };
  }, []);

  const handlePreviewYaml = async () => {
    try {
      await generateYaml();
      setActiveTab("yaml");
      setGenerateSuccess(true);
      setTimeout(() => setGenerateSuccess(false), 2000);
    } catch {
      setActiveTab("yaml");
    }
  };

  const generateYaml = async () => {
    setIsGenerating(true);
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
      return res.data;
    } catch (err) {
      setYamlPreview("Error generating YAML: " + err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunMerge = async () => {
    try {
      await generateYaml();
      localStorage.setItem("runCommand", JSON.stringify({
        action: "merge",
        yaml_path: "merge_config.yml",
        output_path: "./merged_model"
      }));
      window.dispatchEvent(new Event("runCommandTriggered"));
      setActiveTab("logs");
    } catch (err) {
      // Error handled in generateYaml
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left Area: Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 md:p-8 space-y-8">
        <div className="border-b border-slate-700 pb-5 shrink-0">
          <h3 className="text-2xl font-semibold leading-6 text-white">Merge Builder</h3>
          <p className="mt-2 max-w-4xl text-sm text-slate-400">
            Design your model merge configuration visually. Generates the required YAML for Mergekit.
          </p>
        </div>

        <div className="max-w-4xl w-full space-y-6">
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
              <label htmlFor="mergeMethod" className="block text-sm font-medium leading-6 text-white">Merge Method</label>
              <select
                id="mergeMethod"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 pl-3 pr-10 text-white ring-1 ring-inset ring-slate-700 transition-all duration-200 hover:ring-slate-500 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
              >
                {mergeMethods.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
            </div>

            {["ties", "dare_ties", "dare_linear", "passthrough"].includes(method) && (
              <div>
                <label htmlFor="baseModel" className="block text-sm font-medium leading-6 text-white">Base Model (Optional/Required for Method)</label>
                <input
                  id="baseModel"
                  type="text"
                  value={baseModel}
                  onChange={(e) => setBaseModel(e.target.value)}
                  placeholder="e.g. meta-llama/Meta-Llama-3-8B"
                  className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-700 transition-all duration-200 hover:ring-slate-500 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
                />
              </div>
            )}

            <div>
               <label htmlFor="globalParams" className="block text-sm font-medium leading-6 text-white mb-2">Global Parameters</label>
               <textarea
                  id="globalParams"
                  value={globalParams}
                  onChange={(e) => setGlobalParams(e.target.value)}
                  placeholder="t: 0.5&#10;density: 0.5"
                  className="block w-full rounded-md border-0 bg-slate-900 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-700 transition-all duration-200 hover:ring-slate-500 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 font-mono h-24"
               />
               <p className="mt-2 text-xs text-slate-400">One per line, e.g. \`key: value\`</p>
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
                    <label htmlFor={`modelId-${idx}`} className="block text-sm font-medium leading-6 text-white">Model ID / Path</label>
                    <input
                      id={`modelId-${idx}`}
                      type="text"
                      value={m.model_id}
                      onChange={(e) => handleModelChange(idx, "model_id", e.target.value)}
                      placeholder="e.g. NousResearch/Hermes-2-Pro-Llama-3-8B"
                      className="mt-2 block w-full rounded-md border-0 bg-slate-800 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-600 transition-all duration-200 hover:ring-slate-500 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
                    />
                  </div>
                  <div>
                    <label htmlFor={`modelParams-${idx}`} className="block text-sm font-medium leading-6 text-white">Model Parameters (Optional)</label>
                    <textarea
                      id={`modelParams-${idx}`}
                      value={m.parameters}
                      onChange={(e) => handleModelChange(idx, "parameters", e.target.value)}
                      placeholder="weight: 1.0"
                      className="mt-2 block w-full rounded-md border-0 bg-slate-800 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-600 transition-all duration-200 hover:ring-slate-500 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 font-mono h-20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
                onClick={handlePreviewYaml}
                disabled={isGenerating || generateSuccess}
                className={`flex flex-1 items-center justify-center rounded-md px-3 py-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  generateSuccess
                    ? "bg-green-600 hover:bg-green-500 focus-visible:outline-green-600"
                    : "bg-slate-700 hover:bg-slate-600 focus-visible:outline-slate-600"
                }`}
            >
                {isGenerating ? (
                  <Loader2 size={18} className="mr-2 animate-spin" />
                ) : generateSuccess ? (
                  <Check size={18} className="mr-2" />
                ) : (
                  <Eye size={18} className="mr-2" />
                )}
                {isGenerating ? "Generating..." : generateSuccess ? "Generated!" : "Preview YAML"}
            </button>
            <button
                onClick={handleRunMerge}
                disabled={isGenerating}
                className="flex flex-1 items-center justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGenerating ? (
                  <Loader2 size={18} className="mr-2 animate-spin" />
                ) : (
                  <Play size={18} className="mr-2" />
                )}
                {isGenerating ? "Preparing..." : "Generate & Run Merge"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-[450px] xl:w-[500px] border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/50 p-4 md:p-6 flex flex-col h-full overflow-y-auto shrink-0 space-y-6 z-10 shadow-2xl">
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
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            </div>
        </div>
    </div>
  );
}
