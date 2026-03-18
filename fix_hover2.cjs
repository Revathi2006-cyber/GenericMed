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
  { from: /hover:bg-white dark:bg-\[\#111C33\]/g, to: 'hover:bg-white dark:hover:bg-[#111C33]' },
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
console.log("Done fixing hover pseudo classes 2");
