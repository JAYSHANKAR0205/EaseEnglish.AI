const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

const aiServiceDir = path.resolve(__dirname, '../../ai-service');
const pythonExe = path.join(aiServiceDir, 'venv/Scripts/python.exe');
const backendDir = path.resolve(__dirname, '..');

async function waitForHealth(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await axios.get(url, { timeout: 1000 });
      if (res.status === 200) return true;
    } catch (e) {
      // wait and retry
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function main() {
  console.log('[Runner] Starting Python AI service (port 8000)...');
  const aiProcess = spawn(
    pythonExe,
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
    { cwd: aiServiceDir, stdio: 'inherit' }
  );

  console.log('[Runner] Starting Node.js backend (port 5000)...');
  const backendProcess = spawn(
    'node',
    ['src/server.js'],
    { cwd: backendDir, stdio: 'inherit' }
  );

  const cleanup = () => {
    console.log('\n[Runner] Cleaning up test server processes...');
    try { aiProcess.kill(); } catch (e) {}
    try { backendProcess.kill(); } catch (e) {}
  };

  process.on('SIGINT', cleanup);
  process.on('exit', cleanup);

  try {
    console.log('[Runner] Waiting for Python AI service health check...');
    const aiReady = await waitForHealth('http://127.0.0.1:8000/health');
    if (!aiReady) throw new Error('Python AI service failed to start on port 8000');
    console.log('[Runner] Python AI service ready!');

    console.log('[Runner] Waiting for Node.js backend health check...');
    const backendReady = await waitForHealth('http://127.0.0.1:5000/health');
    if (!backendReady) throw new Error('Node backend failed to start on port 5000');
    console.log('[Runner] Node backend ready!');

    console.log('\n[Runner] Launching live integration verification suite...\n');
    const testProcess = spawn('node', ['tests/integration.test.js'], {
      cwd: backendDir,
      stdio: 'inherit'
    });

    testProcess.on('close', (code) => {
      cleanup();
      process.exit(code);
    });
  } catch (err) {
    console.error('[Runner Error]:', err.message);
    cleanup();
    process.exit(1);
  }
}

main();
