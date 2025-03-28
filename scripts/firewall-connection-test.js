// SQL Server Firewall and Connection Test Script
// Tests connectivity to both P21 and POR SQL Servers

// Import required modules
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const net = require('net');

// Server configurations
const servers = [
  {
    name: 'P21',
    host: 'SQL01',
    ip: '10.10.20.28',
    ports: [1433, 1434, 4022, 5022]
  },
  {
    name: 'POR',
    host: 'TS03',
    ip: '10.10.20.13',
    ports: [1433, 1434, 4022, 5022]
  }
];

// Function to test TCP connectivity
function testTcpConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let connected = false;
    
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      connected = true;
      socket.end();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('close', () => {
      if (!connected) {
        resolve(false);
      }
    });
    
    socket.connect(port, host);
  });
}

// Function to run PowerShell commands
async function runPowerShellCommand(command) {
  try {
    const { stdout } = await execPromise(`powershell -Command "${command}"`);
    return stdout.trim();
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Function to check firewall status
async function checkFirewallStatus() {
  console.log('=== Checking Windows Firewall Status ===');
  
  // Check firewall profiles
  const firewallProfiles = await runPowerShellCommand('Get-NetFirewallProfile | Format-Table Name, Enabled -AutoSize | Out-String');
  console.log('Firewall Profiles:');
  console.log(firewallProfiles);
  
  // Check for SQL Server specific rules
  const sqlRules = await runPowerShellCommand('Get-NetFirewallRule -DisplayName "*SQL*" | Format-Table DisplayName, Enabled, Direction, Action -AutoSize | Out-String');
  console.log('SQL Server Firewall Rules:');
  if (sqlRules.includes('Error') || sqlRules.trim() === '') {
    console.log('No SQL Server specific firewall rules found.');
  } else {
    console.log(sqlRules);
  }
  
  // Check for outbound blocking rules
  const blockingRules = await runPowerShellCommand('Get-NetFirewallRule -Direction Outbound | Where-Object { $_.Action -eq "Block" } | Format-Table DisplayName, Enabled, Profile -AutoSize | Out-String');
  console.log('Outbound Blocking Rules:');
  if (blockingRules.includes('Error') || blockingRules.trim() === '') {
    console.log('No outbound blocking rules found.');
  } else {
    console.log(blockingRules);
  }
}

// Function to test connectivity to a server
async function testServerConnectivity(server) {
  console.log(`\n=== Testing Connectivity to ${server.name} Server (${server.host} - ${server.ip}) ===`);
  
  // Ping test
  console.log(`\nPinging ${server.host}...`);
  const pingResult = await runPowerShellCommand(`Test-Connection -ComputerName ${server.host} -Count 2 -Quiet`);
  if (pingResult === 'True') {
    console.log(`✅ Ping successful to ${server.host}`);
  } else {
    console.log(`❌ Ping failed to ${server.host}`);
  }
  
  // Ping test with IP
  console.log(`\nPinging ${server.ip}...`);
  const pingIpResult = await runPowerShellCommand(`Test-Connection -ComputerName ${server.ip} -Count 2 -Quiet`);
  if (pingIpResult === 'True') {
    console.log(`✅ Ping successful to ${server.ip}`);
  } else {
    console.log(`❌ Ping failed to ${server.ip}`);
  }
  
  // Test-NetConnection for each port
  console.log('\nTesting TCP connectivity to ports:');
  for (const port of server.ports) {
    process.stdout.write(`Port ${port}: `);
    
    try {
      // Try with hostname
      const hostResult = await runPowerShellCommand(`Test-NetConnection -ComputerName ${server.host} -Port ${port} -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue`);
      if (hostResult === 'True') {
        console.log(`✅ (via Test-NetConnection)`);
        continue;
      }
      
      // Try with IP
      const ipResult = await runPowerShellCommand(`Test-NetConnection -ComputerName ${server.ip} -Port ${port} -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue`);
      if (ipResult === 'True') {
        console.log(`✅ (via Test-NetConnection with IP)`);
        continue;
      }
      
      // Try with Node.js socket
      const socketResult = await testTcpConnection(server.ip, port);
      if (socketResult) {
        console.log(`✅ (via Node.js socket)`);
      } else {
        console.log(`❌ Connection failed`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Test named pipes connection
  console.log('\nTesting named pipes connectivity:');
  const namedPipesResult = await runPowerShellCommand(`Test-Path "\\\\${server.host}\\pipe\\sql\\query"`);
  if (namedPipesResult === 'True') {
    console.log(`✅ Named pipes accessible on ${server.host}`);
  } else {
    console.log(`❌ Named pipes not accessible on ${server.host}`);
  }
}

// Function to check for SQL Server Browser service
async function checkSqlBrowserService() {
  console.log('\n=== Checking SQL Server Browser Service ===');
  
  // Check if SQL Browser service is running locally
  const localBrowserService = await runPowerShellCommand('Get-Service -Name "SQLBrowser" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status');
  console.log(`Local SQL Browser Service Status: ${localBrowserService || 'Not installed'}`);
  
  // Try to query SQL Browser service on remote servers
  for (const server of servers) {
    console.log(`\nQuerying SQL Browser on ${server.host} (${server.ip})...`);
    
    // UDP port 1434 is used by SQL Browser
    const browserResult = await runPowerShellCommand(`Test-NetConnection -ComputerName ${server.ip} -Port 1434 -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue`);
    if (browserResult === 'True') {
      console.log(`✅ SQL Browser port is open on ${server.host}`);
    } else {
      console.log(`❌ SQL Browser port is not accessible on ${server.host}`);
    }
  }
}

// Function to check network route
async function checkNetworkRoute(server) {
  console.log(`\n=== Checking Network Route to ${server.host} (${server.ip}) ===`);
  
  const traceRoute = await runPowerShellCommand(`Test-NetConnection -ComputerName ${server.ip} -TraceRoute | Format-Table -Property ComputerName, RemoteAddress, InterfaceAlias, SourceAddress, PingSucceeded, TraceRoute -AutoSize | Out-String`);
  console.log(traceRoute);
}

// Main function
async function main() {
  console.log('=== SQL Server Firewall and Connection Test ===');
  
  // Check local machine info
  const computerInfo = await runPowerShellCommand('Get-ComputerInfo | Select-Object CsName, CsDomain, OsName, WindowsFirewallEnabled | Format-List | Out-String');
  console.log('Local Machine Information:');
  console.log(computerInfo);
  
  // Check current user
  const currentUser = await runPowerShellCommand('whoami');
  console.log(`Current User: ${currentUser}`);
  
  // Check firewall status
  await checkFirewallStatus();
  
  // Check SQL Browser service
  await checkSqlBrowserService();
  
  // Test connectivity to each server
  for (const server of servers) {
    await testServerConnectivity(server);
    await checkNetworkRoute(server);
  }
  
  console.log('\n=== Recommendations ===');
  console.log('1. If ping is successful but TCP connections fail, check for firewall rules blocking SQL Server ports');
  console.log('2. If SQL Browser service is not accessible, you may need to specify the instance name and port explicitly');
  console.log('3. If named pipes are not accessible, try using TCP protocol explicitly in your connection string');
  console.log('4. Consult with your network administrator if all connection attempts fail');
}

// Run the main function
main();
