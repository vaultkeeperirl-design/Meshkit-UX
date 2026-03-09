const fs = require('fs');
const file = 'frontend/src/pages/MergeBuilder.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace outer container
content = content.replace(
  '<div className="space-y-8 h-full flex flex-col">\n      <div className="border-b border-slate-700 pb-5 shrink-0">\n        <h3 className="text-2xl font-semibold leading-6 text-white">Merge Builder</h3>\n        <p className="mt-2 max-w-4xl text-sm text-slate-400">\n          Design your model merge configuration visually. Generates the required YAML for Mergekit.\n        </p>\n      </div>\n\n      <div className="grid grid-cols-1 gap-x-8 gap-y-8 xl:grid-cols-2 flex-1 min-h-0 pb-8">\n        {/* Left Column: Form */}\n        <div className="space-y-6 overflow-y-auto pr-2 pb-6">',
  '<div className="h-full flex flex-col lg:flex-row">\n      {/* Left Area: Main Content */}\n      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 md:p-8 space-y-8">\n        <div className="border-b border-slate-700 pb-5 shrink-0">\n          <h3 className="text-2xl font-semibold leading-6 text-white">Merge Builder</h3>\n          <p className="mt-2 max-w-4xl text-sm text-slate-400">\n            Design your model merge configuration visually. Generates the required YAML for Mergekit.\n          </p>\n        </div>\n\n        <div className="max-w-4xl w-full space-y-6">'
);

// Close Left Area and Start Sidebar
content = content.replace(
  '          </button>\n        </div>\n\n        {/* Right Column: Visualizer & Output */}\n        <div className="xl:col-span-1 space-y-6 flex flex-col h-full overflow-y-auto pr-2 pb-6">',
  '          </button>\n        </div>\n      </div>\n\n      {/* Right Sidebar */}\n      <div className="w-full lg:w-[450px] xl:w-[500px] border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/50 p-4 md:p-6 flex flex-col h-full overflow-y-auto shrink-0 space-y-6 z-10 shadow-2xl">'
);

fs.writeFileSync(file, content);
