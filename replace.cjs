const fs = require('fs');
const path = require('path');

const files = [
  'src/components/Layout.tsx',
  'src/components/ProtectedRoute.tsx',
  'src/components/ReminderSystem.tsx',
  'src/pages/History.tsx',
  'src/pages/Home.tsx',
  'src/pages/Login.tsx',
  'src/pages/Reminders.tsx',
  'src/pages/Results.tsx',
  'src/pages/Scan.tsx',
  'src/pages/SignUp.tsx',
  'src/pages/Settings.tsx'
];

const replacements = [
  { from: /bg-\[\#0B1120\]/g, to: 'bg-slate-50 dark:bg-[#0B1120]' },
  { from: /bg-\[\#111C33\]/g, to: 'bg-white dark:bg-[#111C33]' },
  { from: /bg-\[\#1E293B\]/g, to: 'bg-slate-100 dark:bg-[#1E293B]' },
  { from: /hover:bg-\[\#1E293B\]/g, to: 'hover:bg-slate-200 dark:hover:bg-[#1E293B]' },
  { from: /hover:bg-\[\#2A374A\]/g, to: 'hover:bg-slate-200 dark:hover:bg-[#2A374A]' },
  { from: /hover:bg-\[\#111C33\]/g, to: 'hover:bg-slate-100 dark:hover:bg-[#111C33]' },
  { from: /border-\[\#1E293B\]/g, to: 'border-slate-200 dark:border-[#1E293B]' },
  { from: /text-slate-100/g, to: 'text-slate-900 dark:text-slate-100' },
  { from: /text-\[\#94A3B8\]/g, to: 'text-slate-500 dark:text-[#94A3B8]' },
  { from: /placeholder-\[\#94A3B8\]/g, to: 'placeholder-slate-400 dark:placeholder-[#94A3B8]' },
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    
    // For text-white, we only want to replace it if it's not inside a button with bg-[#00A3FF] or bg-[#10B981] or text-white inside a specific class.
    // Let's replace text-white with text-slate-900 dark:text-white, but then fix buttons.
    // Actually, let's just use a regex that looks for text-white and replaces it, unless it's preceded by bg-[#00A3FF] or similar.
    // It's easier to just replace text-white globally, then fix the specific buttons.
    content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');
    
    // Fix buttons
    content = content.replace(/bg-\[\#00A3FF\](.*?)text-slate-900 dark:text-white/g, 'bg-[#00A3FF]$1text-white');
    content = content.replace(/bg-\[\#10B981\](.*?)text-slate-900 dark:text-white/g, 'bg-[#10B981]$1text-white');
    content = content.replace(/bg-red-500(.*?)text-slate-900 dark:text-white/g, 'bg-red-500$1text-white');
    
    fs.writeFileSync(filePath, content);
  }
});
console.log("Done");
