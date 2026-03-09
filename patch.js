const fs = require('fs');
const file = 'frontend/src/pages/MergeBuilder.jsx';
let content = fs.readFileSync(file, 'utf8');

// Update the container
content = content.replace(
  '<div className="grid grid-cols-1 gap-x-8 gap-y-8 xl:grid-cols-2 flex-1 min-h-0 pb-8">',
  '<div className="flex flex-1 min-h-0">'
);

// Update Left Column
content = content.replace(
  '<div className="space-y-6 overflow-y-auto pr-2 pb-6">',
  '<div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-8">\n          {/* Left Column: Form */}'
);

// We need to carefully remove the {/* Left Column: Form */} comment that is currently before the div
content = content.replace(
  '{/* Left Column: Form */}\n        <div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-8">\n          {/* Left Column: Form */}',
  '<div className="flex-1 space-y-6 overflow-y-auto p-4 md:p-8">'
);

// Update Right Column
content = content.replace(
  '<div className="xl:col-span-1 space-y-6 flex flex-col h-full overflow-y-auto pr-2 pb-6">',
  '<div className="w-[450px] border-l border-slate-700 bg-slate-900/50 p-6 flex flex-col h-full overflow-y-auto shrink-0 space-y-6">'
);

// Also remove the title at the top, since the layout is meant to be full width now?
// Actually, let's keep the title but put it inside the left column, so the sidebar is completely separate.
// We'll manually replace the top structure.
