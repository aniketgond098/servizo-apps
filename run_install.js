import { spawnSync } from 'child_process';
const result = spawnSync('npm', ['install'], {
  cwd: 'C:/Users/Harshgupta/orchids-projects/servizo-apps',
  shell: true,
  stdio: 'inherit',
  env: process.env
});
console.log('Exit code:', result.status);
