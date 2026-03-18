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
  { from: /disabled:bg-slate-100 dark:bg-\[\#1E293B\]/g, to: 'disabled:bg-slate-100 disabled:dark:bg-[#1E293B]' },
  { from: /disabled:text-slate-500 dark:text-\[\#94A3B8\]/g, to: 'disabled:text-slate-400 disabled:dark:text-[#94A3B8]' },
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    
    fs.writeFileSync(filePath, content);
  }
});
console.log("Done fixing pseudo classes");
