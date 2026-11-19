const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/user/.gemini/antigravity/brain/f0ecd738-99b6-4bdb-a9bf-0d25d3086343/.system_generated/logs/transcript_full.jsonl'),
  crlfDelay: Infinity
});

let found = null;
rl.on('line', (line) => {
  if (line.includes('simulator-container') && line.includes('dist\\\\index.html')) {
    try {
      const data = JSON.parse(line);
      if (data.tool_calls) {
        for (const tc of data.tool_calls) {
          if (tc.args && tc.args.Content && tc.args.Content.includes('simulator-container')) {
            found = tc.args.Content;
          }
        }
      }
    } catch(e) {}
  }
});

rl.on('close', () => {
  if (found) {
    const currentBundle = 'index-d6d696d368a77e2f0ad2e79251eff425.js';
    const updated = found.replace(/index-[a-f0-9]{32}\.js/g, currentBundle);
    fs.writeFileSync('C:/Users/user/.gemini/antigravity/scratch/axona-mobile-app/dist/index.html', updated);
    console.log('Restored dist/index.html with bundle:', currentBundle);
  } else {
    console.log('Template not found');
  }
});
