const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('npx vite build', {
    cwd: 'C:/Users/Harshgupta/orchids-projects/servizo-apps',
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 1024 * 1024 * 10
  });
  fs.writeFileSync('build_output.txt', 'SUCCESS:\n' + out);
} catch(e) {
  fs.writeFileSync('build_output.txt', 'STDOUT:\n' + (e.stdout||'') + '\n\nSTDERR:\n' + (e.stderr||''));
}
