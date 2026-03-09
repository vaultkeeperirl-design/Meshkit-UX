import { Outlet, NavLink } from "react-router-dom";
import { Settings, GitMerge, Activity, Box, Terminal } from "lucide-react";

export default function Layout() {
  const navItems = [
    { name: "Merge Builder", path: "/", icon: <GitMerge size={20} /> },
    { name: "Network Visualizer", path: "/visualizer", icon: <Activity size={20} /> },
    { name: "Quantizer", path: "/quantizer", icon: <Box size={20} /> },
    { name: "Process & Logs", path: "/logs", icon: <Terminal size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <GitMerge className="text-blue-500" size={28} />
          <h1 className="text-xl font-bold tracking-tight">Mergekit Studio</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-slate-900">
        <header className="border-b border-slate-800 bg-slate-900/50 p-4 sticky top-0 z-10 backdrop-blur">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Workspace</h2>
        </header>
        <main className="p-8 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
