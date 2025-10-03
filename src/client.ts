
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

// Path to the server entry point
const serverPath = './dist/server.js';

// Spawn the server process
const server = spawn('node', [serverPath]);

// Function to send a JSON-RPC request
function sendRequest(method: string, params: any) {
  const request = {
    jsonrpc: '2.0',
    id: randomUUID(),
    method,
    params,
  };
  const message = JSON.stringify(request);
  console.log(`Client > Sending: ${message}`);
  server.stdin.write(message + '\n');
}

// Listen for data from the server's stdout
server.stdout.on('data', (data) => {
  const messages = data.toString().trim().split('\n');
  messages.forEach((message: string) => {
    try {
      const parsed = JSON.parse(message);
      console.log('Server > Received:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      if (message.length > 0) {
        console.log(`Server > Received (raw): ${message}`);
      }
    }
  });
});

// Listen for errors from the server's stderr
server.stderr.on('data', (data) => {
  console.error(`Server > Stderr: ${data}`);
});

// Handle server exit
server.on('close', (code) => {
  console.log(`Server > Exited with code ${code}`);
});

// --- Main interaction ---
async function main() {
  // Wait for the server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  const args = process.argv.slice(2);
  const method = args[0];
  const paramsStr = args[1];

  if (method && paramsStr) {
    try {
        const params = JSON.parse(paramsStr);
        console.log(`\n--- Calling method: ${method} ---`);
        sendRequest(method, params);
    } catch (e) {
        console.error('Error: Invalid JSON for params argument');
        server.kill();
        return;
    }
  } else {
    console.log('\n--- Usage: node dist/client.js <method> \'<params_json>\' ---');
    console.log('\n--- Defaulting to tools/list ---');
    sendRequest('tools/list', {});
  }

  // Keep the client running to receive the response
  await new Promise(resolve => setTimeout(resolve, 4000));

  // Close the server
  server.kill();
}

main();
