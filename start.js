/**
 * VyapaarFlow — Unified Single Command Runner
 * Spawns both Backend (port 5000) and Frontend (port 3000) concurrently.
 * Zero external orchestrator dependencies required (pure Node.js).
 */

const { spawn, execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const SHARED_DIR = path.join(ROOT_DIR, 'shared');

// ANSI Color Codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';

function log(prefix, color, message) {
  const lines = message.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.trim().length > 0) {
      console.log(`${color}${BOLD}${prefix}${RESET} ${line}`);
    }
  });
}

console.log(`${CYAN}${BOLD}`);
console.log('================================================================');
console.log('       ✨  VyapaarFlow (व्यापारफ्लो) — Monorepo Single Runner   ');
console.log('================================================================');
console.log(`${RESET}`);
console.log(`  ${BOLD}🖥️  Frontend URL:${RESET}   ${GREEN}${BOLD}http://localhost:3000${RESET}`);
console.log(`  ${BOLD}🔌 Backend API:${RESET}     ${BLUE}${BOLD}http://localhost:5000${RESET}`);
console.log(`  ${BOLD}🩺 API Health:${RESET}      ${YELLOW}http://localhost:5000/api/health${RESET}`);
console.log(`----------------------------------------------------------------`);
console.log(`  ${BOLD}🏪 Getting Started:${RESET}`);
console.log(`     • Open ${GREEN}http://localhost:3000${RESET} to register your business or sign in.`);
console.log(`     • Set ${BOLD}MONGODB_URI${RESET} in backend/.env for persistent database storage.`);
console.log(`----------------------------------------------------------------`);
console.log(`  ${DIM}Press Ctrl+C at any time to cleanly stop all services.${RESET}`);
console.log(`${CYAN}================================================================${RESET}\n`);

// Detect package manager (prefer pnpm if available, fallback to npm)
const isWin = process.platform === 'win32';
let pm = 'npm';
try {
  execSync(isWin ? 'where pnpm' : 'which pnpm', { stdio: 'ignore' });
  pm = 'pnpm';
} catch (e) {
  pm = 'npm';
}
const pmCmd = isWin ? `${pm}.cmd` : pm;

// 1. Ensure @vyapaarflow/shared is built
const sharedDist = path.join(SHARED_DIR, 'dist', 'index.js');
if (!fs.existsSync(sharedDist)) {
  console.log(`${YELLOW}[System] Building @vyapaarflow/shared package...${RESET}`);
  try {
    execSync(`${pmCmd} run build`, { cwd: SHARED_DIR, stdio: 'inherit' });
    console.log(`${GREEN}[System] @vyapaarflow/shared built successfully.${RESET}\n`);
  } catch (err) {
    console.error(`${RED}[System] Failed to build shared package:${RESET}`, err.message);
  }
}

const children = [];

function killProcess(child) {
  if (!child || !child.pid) return;
  try {
    if (isWin) {
      exec(`taskkill /pid ${child.pid} /T /F`, () => {});
    } else {
      process.kill(-child.pid, 'SIGTERM');
    }
  } catch (e) {
    // ignore
  }
}

function cleanup() {
  console.log(`\n${YELLOW}[System] Gracefully shutting down all VyapaarFlow services...${RESET}`);
  children.forEach(killProcess);
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => children.forEach(killProcess));

// 2. Start Backend Service
const backendProcess = spawn(pmCmd, ['run', 'dev'], {
  cwd: BACKEND_DIR,
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, PORT: '5000', NODE_ENV: 'development' }
});

children.push(backendProcess);

backendProcess.stdout.on('data', (data) => {
  log('[Backend]', BLUE, data);
});

backendProcess.stderr.on('data', (data) => {
  log('[Backend]', BLUE, data);
});

backendProcess.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`${RED}[Backend] Process exited with code ${code}${RESET}`);
  }
});

// 3. Start Frontend Service
const frontendProcess = spawn(pmCmd, ['run', 'dev'], {
  cwd: FRONTEND_DIR,
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, PORT: '3000' }
});

children.push(frontendProcess);

frontendProcess.stdout.on('data', (data) => {
  log('[Frontend]', GREEN, data);
});

frontendProcess.stderr.on('data', (data) => {
  log('[Frontend]', GREEN, data);
});

frontendProcess.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`${RED}[Frontend] Process exited with code ${code}${RESET}`);
  }
});
