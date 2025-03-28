// Script to check available SQL Server instances on a remote server
const { exec } = require('child_process');

// Get command line arguments
const args = process.argv.slice(2);
let server = '10.10.20.28';

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'server') server = value;
}

console.log('=== SQL Server Instance Check ===');
console.log(`Target server: ${server}`);

// Function to execute a command and return a promise
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      return resolve(stdout);
    });
  });
}

// Check if the server is reachable
async function pingServer() {
  try {
    console.log(`\nPinging ${server} to check if it's reachable...`);
    const pingOutput = await executeCommand(`ping -n 3 ${server}`);
    console.log(pingOutput);
    return true;
  } catch (error) {
    console.error('Server is not reachable via ping');
    return false;
  }
}

// Try to discover SQL Server instances using sqlcmd
async function checkSqlInstances() {
  try {
    console.log('\nChecking for SQL Server instances...');
    const output = await executeCommand(`sqlcmd -L | findstr ${server}`);
    
    if (output.trim()) {
      console.log('SQL Server instances found:');
      console.log(output);
    } else {
      console.log('No SQL Server instances found on the target server');
      
      // Try a more general search
      console.log('\nListing all available SQL Server instances:');
      const allInstances = await executeCommand('sqlcmd -L');
      console.log(allInstances);
    }
  } catch (error) {
    console.error('Failed to check SQL Server instances. Make sure sqlcmd is installed.');
    
    // Try using PowerShell to query for SQL Server instances
    try {
      console.log('\nAttempting to use PowerShell to discover SQL Server instances...');
      const psCommand = `powershell -Command "& {$instances = [System.Data.Sql.SqlDataSourceEnumerator]::Instance.GetDataSources(); $instances | Format-Table ServerName, InstanceName -AutoSize}"`;
      const psOutput = await executeCommand(psCommand);
      console.log(psOutput);
    } catch (psError) {
      console.error('PowerShell discovery also failed.');
    }
  }
}

// Try a direct TCP connection to the SQL Server port
async function checkTcpConnection() {
  try {
    console.log(`\nChecking TCP connection to ${server} on port 1433...`);
    const tcpCommand = `powershell -Command "& {Test-NetConnection -ComputerName ${server} -Port 1433 | Format-List}"`;
    const tcpOutput = await executeCommand(tcpCommand);
    console.log(tcpOutput);
  } catch (error) {
    console.error('Failed to check TCP connection');
  }
}

// Main function
async function main() {
  const isReachable = await pingServer();
  
  if (isReachable) {
    await checkSqlInstances();
    await checkTcpConnection();
    
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure the SQL Server Browser service is running on the target server');
    console.log('2. Check if the firewall allows SQL Server connections (port 1433 and UDP 1434)');
    console.log('3. Verify the SQL Server instance name and try connecting with the full instance name');
    console.log('4. Ensure the SQL Server is configured to allow remote connections');
    console.log('5. Check if SQL Server is configured to allow SQL Server Authentication');
  }
}

// Run the main function
main();
