export default function DynamicVisualizer({ method, baseModel, models }) {
  // Check how many non-empty models we have
  const validModelsCount = models.filter(m => m.model_id.trim() !== "").length;
  const hasBaseModel = baseModel.trim() !== "";

  // A helper function to generate generic layer visualization
  const renderModelNode = (label, colorClass) => (
    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all duration-500 ${colorClass}`}>
       <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
       <div className="flex gap-1">
          {[1,2,3].map(i => <div key={i} className="w-8 h-2 bg-current opacity-30 rounded-full" />)}
       </div>
    </div>
  );

  return (
    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
        <h4 className="w-full text-sm font-medium text-slate-400 uppercase tracking-wider mb-6 border-b border-slate-800 pb-2 text-left">Merge Visualization: {method.toUpperCase()}</h4>

        <div className="flex-1 flex items-center justify-center w-full">
            {validModelsCount === 0 && !hasBaseModel ? (
                // Default empty state
                renderModelNode("Awaiting Models", "bg-slate-800 border-slate-700 text-slate-500")
            ) : (
                <div className="flex flex-col items-center gap-4 w-full relative">
                   {/* Depending on method, show different connection styles */}

                   {/* Top Level: Base Model if required/provided */}
                   {["ties", "dare_ties", "dare_linear", "passthrough"].includes(method) && hasBaseModel && (
                       <div className="w-full flex justify-center pb-4 border-b border-slate-800/50 border-dashed relative">
                           {renderModelNode("Base Model", "bg-blue-900/40 border-blue-700 text-blue-300 w-1/2")}
                           <div className="absolute -bottom-2 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600 z-10"></div>
                       </div>
                   )}

                   {/* Middle Level: The models being merged */}
                   <div className="flex gap-4 w-full justify-center pt-2">
                      {models.map((m, idx) => {
                          if (m.model_id.trim() === "") return null;
                          return (
                              <div key={idx} className="flex-1 max-w-[150px]">
                                  {renderModelNode(`Model ${idx + 1}`, "bg-indigo-900/40 border-indigo-700 text-indigo-300")}
                              </div>
                          );
                      })}
                   </div>

                   {/* Connection lines depending on method */}
                   {validModelsCount > 0 && (
                       <div className="w-full flex justify-center my-2">
                           <svg width="100" height="40" className="opacity-50">
                               {validModelsCount === 1 ? (
                                   <line x1="50" y1="0" x2="50" y2="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4" className="text-slate-500"/>
                               ) : (
                                   <path d="M 20 0 C 20 20, 50 20, 50 40 M 80 0 C 80 20, 50 20, 50 40" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500" />
                               )}
                           </svg>
                       </div>
                   )}

                   {/* Bottom Level: Output Model */}
                   {validModelsCount > 0 && (
                       <div className="w-full flex justify-center">
                            {renderModelNode("Merged Output", "bg-emerald-900/40 border-emerald-700 text-emerald-300 w-1/2")}
                       </div>
                   )}
                </div>
            )}
        </div>
    </div>
  );
}
