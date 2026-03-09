import { useState } from "react";
import axios from "axios";
import { Plus, Trash, Activity } from "lucide-react";

export default function MergeBuilder() {
  const [method, setMethod] = useState("slerp");
  const [baseModel, setBaseModel] = useState("");
  const [models, setModels] = useState([{ model_id: "", parameters: "" }]);
  const [globalParams, setGlobalParams] = useState("");
  const [yamlPreview, setYamlPreview] = useState("");

  const mergeMethods = ["slerp", "ties", "dare_ties", "dare_linear", "passthrough", "linear"];

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
    } catch (e) {
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

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        {/* Left Column: Form */}
        <div className="md:col-span-2 space-y-6">
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
              <button onClick={handleAddModel} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
                <Plus size={16} /> Add Model
              </button>
            </div>

            {models.map((m, idx) => (
              <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-700 relative">
                <button onClick={() => handleRemoveModel(idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-300">
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

        {/* Right Column: Preview */}
        <div className="md:col-span-1">
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 h-full flex flex-col">
            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">YAML Output</h4>
            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap flex-1 overflow-auto p-2 bg-black/50 rounded-lg">
              {yamlPreview || "# Click generate to preview configuration"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
