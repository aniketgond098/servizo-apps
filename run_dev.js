import { spawn } from 'child_process';
const proc = spawn('npm', ['run', 'dev'], {
  cwd: 'C:/Users/Harshgupta/orchids-projects/servizo-apps',
  shell: true,
  stdio: 'inherit',
  env: process.env,
  detached: false
});
proc.on('exit', (code) => console.log('Exit:', code));
