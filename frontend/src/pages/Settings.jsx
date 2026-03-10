import { useState, useEffect } from "react";
import axios from "axios";
import { Save } from "lucide-react";

export default function Settings() {
  const [hfToken, setHfToken] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get("http://localhost:8000/api/settings").then((res) => {
      setHfToken(res.data.hf_token || "");
    });
  }, []);

  const saveSettings = async () => {
    try {
      await axios.post("http://localhost:8000/api/settings", { hf_token: hfToken });
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Error saving settings");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-700 pb-5">
        <h3 className="text-2xl font-semibold leading-6 text-white">Global Settings</h3>
        <p className="mt-2 max-w-4xl text-sm text-slate-400">
          Configure API tokens and default output directories used across Mergekit Studio.
        </p>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <div>
          <label htmlFor="hfToken" className="block text-sm font-medium leading-6 text-white">
            HuggingFace Token (HF_TOKEN)
          </label>
          <div className="mt-2">
            <input
              id="hfToken"
              type="password"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
              className="block w-full rounded-md border-0 bg-slate-900 py-1.5 text-white shadow-sm ring-1 ring-inset ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Required for downloading gated models like Llama 3 or Gemma.
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            <Save size={16} /> Save Settings
          </button>
          {message && <p className="mt-3 text-sm text-green-400">{message}</p>}
        </div>
      </div>
    </div>
  );
}
