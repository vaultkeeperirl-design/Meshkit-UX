import { useState, useEffect } from "react";
import FocusTrap from "focus-trap-react";
import { Settings, GitMerge, Box, X } from "lucide-react";
import MergeBuilder from "../pages/MergeBuilder";
import Quantizer from "../pages/Quantizer";
import SettingsPage from "../pages/Settings";

export default function Layout() {
  const [openView, setOpenView] = useState(null);

  // Expose a globally accessible function to close modals from anywhere
  // without relying on broken route interception.
  useEffect(() => {
    window.__closeModals = () => setOpenView(null);
    return () => { delete window.__closeModals; };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 p-4 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2 px-2">
          <GitMerge className="text-blue-500" size={28} />
          <h1 className="text-xl font-bold tracking-tight">Mergekit Studio</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOpenView("quantizer")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 ${
              openView === "quantizer"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Box size={20} />
            <span className="font-medium">Quantizer</span>
          </button>
          <button
            onClick={() => setOpenView("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 ${
              openView === "settings"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-900 relative">
        <main className="h-full flex flex-col w-full">
          <MergeBuilder />
        </main>
      </div>

      {/* Drawers and Modals */}
      {/* Centered Modals: Quantizer & Settings */}
      {["quantizer", "settings"].includes(openView) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-8">
          <FocusTrap>
            <div
              className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
              role="dialog"
              aria-modal="true"
              aria-label={openView === "quantizer" ? "Quantizer" : "Settings"}
            >
              <button
                onClick={() => setOpenView(null)}
                aria-label="Close modal"
                className="absolute top-4 right-4 text-slate-400 hover:text-white z-50 bg-slate-800/80 rounded-full p-1 transition-all duration-200 active:scale-95 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X size={24} />
              </button>
              <div className="overflow-y-auto p-8 flex-1">
                {openView === "quantizer" && <Quantizer />}
                {openView === "settings" && <SettingsPage />}
              </div>
            </div>
          </FocusTrap>
        </div>
      )}

    </div>
  );
}
