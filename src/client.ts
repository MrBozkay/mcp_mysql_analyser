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
    if (message.length === 0) return;
    try {
      const parsed = JSON.parse(message);
      console.log('Server > Received:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(`Server > Received (raw): ${message}`);
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
  const command = args[0];

  if (command === 'list') {
    console.log('\n--- Listing available tools ---');
    sendRequest('tools/list', {});
  } else if (command === 'call') {
    const toolName = args[1];
    if (!toolName) {
      console.error("Error: Tool name not specified for 'call' command.");
      server.kill();
      return;
    }
    try {
      const params = parseArgs(args.slice(2));
      console.log(`\n--- Calling tool: ${toolName} ---`);
      sendRequest('tools/call', { name: toolName, arguments: params });
    } catch (e: any) {
      console.error(`Error: ${e.message}`);
      server.kill();
      return;
    }
  } else {
    console.log('Usage: node dist/client.js [list|call <tool_name> <args>]');
    server.kill();
    return;
  }

  // Keep the client running to receive the response
  await new Promise(resolve => setTimeout(resolve, 4000));

  // Close the server
  server.kill();
}

function parseArgs(args: string[]): Record<string, any> {
  const params: Record<string, any> = {};
  for (const arg of args) {
    const parts = arg.split('=');
    if (parts.length !== 2) {
      throw new Error(`Invalid argument format: ${arg}`);
    }
    const [key, value] = parts;
    try {
      // Try to parse as JSON (e.g., numbers, booleans, arrays, objects)
      params[key] = JSON.parse(value);
    } catch (e) {
      // If not valid JSON, treat as plain string
      params[key] = value;
    }
  }
  return params;
}

main().catch(err => {
  console.error('Unhandled error in client:', err);
  server.kill();
  process.exit(1);
});