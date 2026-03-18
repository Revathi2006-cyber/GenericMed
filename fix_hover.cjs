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
  { from: /hover:bg-slate-100 dark:bg-\[\#1E293B\]/g, to: 'hover:bg-slate-100 dark:hover:bg-[#1E293B]' },
  { from: /hover:bg-slate-200 dark:bg-\[\#2A374A\]/g, to: 'hover:bg-slate-200 dark:hover:bg-[#2A374A]' },
  { from: /hover:bg-slate-100 dark:bg-\[\#111C33\]/g, to: 'hover:bg-slate-100 dark:hover:bg-[#111C33]' },
  { from: /hover:text-slate-900 dark:text-white/g, to: 'hover:text-slate-900 dark:hover:text-white' },
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
console.log("Done fixing hover pseudo classes");
