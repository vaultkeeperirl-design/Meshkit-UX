import { useState } from "react";
import { Settings, GitMerge, Activity, Box, Terminal, X } from "lucide-react";
import MergeBuilder from "../pages/MergeBuilder";
import Quantizer from "../pages/Quantizer";
import SettingsPage from "../pages/Settings";

export default function Layout() {
  const [openView, setOpenView] = useState(null);

  const navItems = [
    { name: "Merge Builder", view: null, icon: <GitMerge size={20} /> },
    { name: "Quantizer", view: "quantizer", icon: <Box size={20} /> },
    { name: "Settings", view: "settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col z-20">
        <div className="flex items-center gap-2 mb-8 px-2">
          <GitMerge className="text-blue-500" size={28} />
          <h1 className="text-xl font-bold tracking-tight">Mergekit Studio</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = openView === item.view;
            return (
              <button
                key={item.name}
                onClick={() => setOpenView(item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-slate-900 relative">
        <header className="border-b border-slate-800 bg-slate-900/50 p-4 sticky top-0 z-10 backdrop-blur">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Workspace</h2>
        </header>
        <main className="p-8 max-w-6xl mx-auto">
          <MergeBuilder />
        </main>
      </div>

      {/* Drawers and Modals */}
      {/* Centered Modals: Quantizer & Settings */}
      {["quantizer", "settings"].includes(openView) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
            <button
              onClick={() => setOpenView(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white z-50 bg-slate-800/80 rounded-full p-1"
            >
              <X size={24} />
            </button>
            <div className="overflow-y-auto p-8 flex-1">
              {openView === "quantizer" && <Quantizer />}
              {openView === "settings" && <SettingsPage />}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
