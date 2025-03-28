// Simple SQL Server Check
// Tests basic connectivity to SQL01 and TS03 servers

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const net = require('net');

// Target servers
const servers = [
  { name: 'SQL01', ip: '10.10.20.28', description: 'P21 Server' },
  { name: 'TS03', ip: '10.10.20.13', description: 'POR Server' }
];

// Function to run PowerShell commands
async function runPowerShell(command) {
  try {
    const { stdout } = await execPromise(`powershell -Command "${command}"`);
    return stdout.trim();
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Function to check if a port is open
function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isOpen = false;
    
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      isOpen = true;
      socket.destroy();
    });
    
    socket.on('timeout', () => {
      socket.destroy();
    });
    
    socket.on('error', () => {
      socket.destroy();
    });
    
    socket.on('close', () => {
      resolve(isOpen);
    });
    
    socket.connect(port, host);
  });
}

// Function to check for SQL Server ports
async function checkSqlServerPorts(server) {
  console.log(`\n=== Checking ${server.name} (${server.ip}) for SQL Server ===`);
  
  // Check if server is pingable
  const pingResult = await runPowerShell(`Test-Connection -ComputerName ${server.name} -Count 2 -Quiet`);
  
  if (pingResult === 'True') {
    console.log(`✅ ${server.name} is reachable via ping`);
  } else {
    console.log(`❌ Cannot ping ${server.name}`);
    return;
  }
  
  // Check common SQL Server ports
  const commonPorts = [1433, 1434, 2433, 4022, 5022];
  
  console.log(`\nChecking common SQL Server ports on ${server.name}:`);
  
  for (const port of commonPorts) {
    process.stdout.write(`Port ${port}: `);
    
    const isOpen = await isPortOpen(server.ip, port);
    
    if (isOpen) {
      console.log('OPEN ✅');
    } else {
      console.log('CLOSED ❌');
    }
  }
  
  // Try to detect SQL Server Browser
  console.log(`\nChecking for SQL Server Browser on ${server.name}:`);
  const browserPort = await isPortOpen(server.ip, 1434);
  
  if (browserPort) {
    console.log('✅ SQL Server Browser port (1434) is open');
  } else {
    console.log('❌ SQL Server Browser port (1434) is closed');
  }
  
  // Try to check for SQL Server services remotely
  console.log(`\nAttempting to check SQL Server services on ${server.name}:`);
  
  const serviceCheck = await runPowerShell(`
    $ErrorActionPreference = "SilentlyContinue"
    try {
      $result = Invoke-Command -ComputerName ${server.name} -ScriptBlock {
        Get-Service -Name "*SQL*" | Where-Object { $_.Status -eq "Running" } | Select-Object -Property Name, DisplayName, Status
      } -ErrorAction SilentlyContinue
      if ($result) { 
        $result | Format-Table -AutoSize | Out-String
      } else { 
        "No SQL Server services found or cannot access remote services"
      }
    } catch {
      "Error accessing remote services: " + $_.Exception.Message
    }
  `);
  
  console.log(serviceCheck);
}

// Function to try a simple SQL connection
async function trySqlConnection(server) {
  console.log(`\n=== Trying simple SQL connection to ${server.name} ===`);
  
  const sqlCmd = `
    $ErrorActionPreference = "SilentlyContinue"
    try {
      $connectionString = "Server=${server.name};Integrated Security=True;TrustServerCertificate=True;Connection Timeout=5"
      $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
      $connection.Open()
      if ($connection.State -eq 'Open') {
        "✅ Connection successful!"
        $command = $connection.CreateCommand()
        $command.CommandText = "SELECT @@VERSION as Version"
        $reader = $command.ExecuteReader()
        if ($reader.Read()) {
          "SQL Server Version: " + $reader["Version"]
        }
        $reader.Close()
        $connection.Close()
      }
    } catch {
      "❌ Connection failed: " + $_.Exception.Message
    }
  `;
  
  const result = await runPowerShell(sqlCmd);
  console.log(result);
  
  // Try with IP address
  console.log(`\nTrying with IP address (${server.ip}):`);
  
  const sqlCmdIp = `
    $ErrorActionPreference = "SilentlyContinue"
    try {
      $connectionString = "Server=${server.ip};Integrated Security=True;TrustServerCertificate=True;Connection Timeout=5"
      $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
      $connection.Open()
      if ($connection.State -eq 'Open') {
        "✅ Connection successful!"
        $command = $connection.CreateCommand()
        $command.CommandText = "SELECT @@VERSION as Version"
        $reader = $command.ExecuteReader()
        if ($reader.Read()) {
          "SQL Server Version: " + $reader["Version"]
        }
        $reader.Close()
        $connection.Close()
      }
    } catch {
      "❌ Connection failed: " + $_.Exception.Message
    }
  `;
  
  const resultIp = await runPowerShell(sqlCmdIp);
  console.log(resultIp);
}

// Main function
async function main() {
  console.log('=== Simple SQL Server Check ===');
  
  // Get current user
  const currentUser = await runPowerShell('whoami');
  console.log(`Current User: ${currentUser}`);
  
  // Check each server
  for (const server of servers) {
    await checkSqlServerPorts(server);
    await trySqlConnection(server);
  }
  
  console.log('\n=== Check Complete ===');
}

// Run the main function
main();
