import { useState } from "react";
import { Box, Settings2, Play, Loader2 } from "lucide-react";

export default function Quantizer() {
  const [modelPath, setModelPath] = useState("./merged_model");
  const [f16Path, setF16Path] = useState("./merged_model_f16.gguf");
  const [quantPath, setQuantPath] = useState("./merged_model_q4_k_m.gguf");
  const [qType, setQType] = useState("q4_k_m");
  const [isStartingF16, setIsStartingF16] = useState(false);
  const [isStartingQuant, setIsStartingQuant] = useState(false);

  const startProcessAndViewLogs = (cmd, setStartingState) => {
    setStartingState(true);
    // Add a tiny delay so the user sees the "Starting..." state before the UI switches
    setTimeout(() => {
      localStorage.setItem("runCommand", JSON.stringify(cmd));
      window.dispatchEvent(new Event("runCommandTriggered"));
      if (window.__closeModals) window.__closeModals();
      if (window.__openLogsTab) window.__openLogsTab();
      setStartingState(false);
    }, 300);
  };

  const handleRunF16 = () => {
    startProcessAndViewLogs({
      action: "convert_f16",
      model_path: modelPath
    }, setIsStartingF16);
  };

  const handleRunQuant = () => {
    startProcessAndViewLogs({
      action: "quantize",
      input_model: f16Path,
      output_model: quantPath,
      qtype: qType
    }, setIsStartingQuant);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-700 pb-5">
        <h3 className="text-2xl font-semibold leading-6 text-white">Llama.cpp Quantizer</h3>
        <p className="mt-2 max-w-4xl text-sm text-slate-400">
          Convert your HuggingFace merged models to GGUF format and quantize them for LM Studio.
        </p>
      </div>

      {/* Step 1: Convert to F16 */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <h4 className="text-lg font-medium text-white flex items-center gap-2">
            <Settings2 size={20} className="text-blue-400" /> Step 1: Convert HuggingFace to GGUF (F16)
        </h4>
        <p className="text-sm text-slate-400 mb-4">
            Before quantizing, the model must be converted to an uncompressed GGUF format.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="inputModelPath" className="block text-sm font-medium leading-6 text-white">Input Model Path</label>
            <input
              id="inputModelPath"
              type="text"
              value={modelPath}
              onChange={(e) => setModelPath(e.target.value)}
              className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-700 transition-all duration-200 hover:ring-slate-500 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
            />
          </div>
          <div>
            <label htmlFor="f16OutputPath" className="block text-sm font-medium leading-6 text-white">Output Path (Optional)</label>
            <input
              id="f16OutputPath"
              type="text"
              value={f16Path}
              onChange={(e) => setF16Path(e.target.value)}
              className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-700 transition-all duration-200 hover:ring-slate-500 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <button
          onClick={handleRunF16}
          disabled={isStartingF16}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStartingF16 ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {isStartingF16 ? "Starting..." : "Run F16 Conversion"}
        </button>
      </div>

      {/* Step 2: Quantize */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <h4 className="text-lg font-medium text-white flex items-center gap-2">
            <Box size={20} className="text-purple-400" /> Step 2: Quantize GGUF
        </h4>
        <p className="text-sm text-slate-400 mb-4">
            Compress the F16 GGUF model into a smaller format (e.g., 4-bit) for faster inference.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="inputF16Path" className="block text-sm font-medium leading-6 text-white">Input F16 GGUF Path</label>
            <input
              id="inputF16Path"
              type="text"
              value={f16Path}
              onChange={(e) => setF16Path(e.target.value)}
              className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-700 transition-all duration-200 hover:ring-slate-500 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
            />
          </div>
          <div>
            <label htmlFor="quantType" className="block text-sm font-medium leading-6 text-white">Quantization Type</label>
            <select
                id="quantType"
                value={qType}
                onChange={(e) => setQType(e.target.value)}
                className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-700 transition-all duration-200 hover:ring-slate-500 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
            >
                <option value="q4_k_m">Q4_K_M (Recommended)</option>
                <option value="q5_k_m">Q5_K_M</option>
                <option value="q8_0">Q8_0 (High Quality)</option>
                <option value="q3_k_m">Q3_K_M (Smallest)</option>
            </select>
          </div>
          <div>
            <label htmlFor="quantOutputPath" className="block text-sm font-medium leading-6 text-white">Final Output Path</label>
            <input
              id="quantOutputPath"
              type="text"
              value={quantPath}
              onChange={(e) => setQuantPath(e.target.value)}
              className="mt-2 block w-full rounded-md border-0 bg-slate-900 py-1.5 px-3 text-white ring-1 ring-inset ring-slate-700 transition-all duration-200 hover:ring-slate-500 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <button
          onClick={handleRunQuant}
          disabled={isStartingQuant}
          className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStartingQuant ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {isStartingQuant ? "Starting..." : "Run Quantization"}
        </button>
      </div>
    </div>
  );
}
