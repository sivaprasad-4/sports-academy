const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('c:/Users/Harishankar/.gemini/antigravity/scratch/sports_academy/frontend/src/pages/PerformancePage.jsx', 'utf-8');

function check(chunkRegex, label) {
    const mod = code.replace(chunkRegex, '<div />');
    try {
        parser.parse(mod, { sourceType: 'module', plugins: ['jsx'] });
        console.log('SUCCESS! The error is inside:', label);
    } catch(e) {
        // still fails
    }
}

// Blocks to test replacing
const tests = {
    Analytics: /\{activeTab === 'analytics'[\s\S]*?\/\* ═══ Rankings/g,
    Rankings: /\{activeTab === 'rankings'[\s\S]*?\/\* ═══ Reports/g,
    Reports: /\{activeTab === 'reports'[\s\S]*?\/\* ═══ Record/g,
    Record: /\{activeTab === 'record'[\s\S]*?\/\* ═══ Admin/g,
    Metrics: /\{activeTab === 'metrics'[\s\S]*?\}\)/g,
    Header: /<div className="relative group">[\s\S]*?(?=\{activeTab === 'analytics')/g
};

for (const [label, regex] of Object.entries(tests)) {
    check(regex, label);
}
