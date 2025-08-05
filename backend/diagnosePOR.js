import fs from 'fs';
import path from 'path';

console.log('🔍 Diagnosing POR MCP Server Issues...\n');

async function diagnosePOR() {
  const porDbPath = 'C:\\TallmanDashboard\\POR.mdb';
  const porServerPath = path.join(process.cwd(), '..', 'POR-MCP-Server-Package');
  
  console.log('1️⃣ Checking POR Database File...');
  try {
    const stats = fs.statSync(porDbPath);
    console.log(`✅ File exists: ${stats.size} bytes`);
    console.log(`✅ Last modified: ${stats.mtime}`);
    console.log(`✅ Readable: ${fs.constants.R_OK & fs.accessSync(porDbPath, fs.constants.R_OK) || 'Yes'}`);
  } catch (error) {
    console.log(`❌ Database file error: ${error.message}`);
    return;
  }

  console.log('\n2️⃣ Checking POR MCP Server Package...');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(porServerPath, 'package.json'), 'utf8'));
    console.log(`✅ Package: ${packageJson.name} v${packageJson.version}`);
    
    const buildPath = path.join(porServerPath, 'build', 'index.js');
    if (fs.existsSync(buildPath)) {
      console.log('✅ Build file exists');
    } else {
      console.log('❌ Build file missing');
    }
  } catch (error) {
    console.log(`❌ Package error: ${error.message}`);
  }

  console.log('\n3️⃣ Checking Environment Configuration...');
  try {
    const envPath = path.join(porServerPath, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ .env file contents:');
    console.log(envContent);
  } catch (error) {
    console.log(`❌ .env file error: ${error.message}`);
  }

  console.log('\n4️⃣ Testing MDB Reader Library...');
  try {
    // Try to import and test the mdb-reader library
    const { spawn } = await import('child_process');
    
    const testScript = `
      try {
        const MDBReader = require('mdb-reader');
        const fs = require('fs');
        console.log('MDB Reader library loaded successfully');
        
        const buffer = fs.readFileSync('${porDbPath.replace(/\\/g, '\\\\')}');
        console.log('Database file read successfully:', buffer.length, 'bytes');
        
        const reader = new MDBReader(buffer);
        console.log('MDB Reader initialized successfully');
        
        const tables = reader.getTableNames();
        console.log('Tables found:', tables.length);
        console.log('Table names:', tables.slice(0, 5).join(', '));
        
      } catch (error) {
        console.error('MDB Reader test failed:', error.message);
        console.error('Error stack:', error.stack);
      }
    `;
    
    const testProcess = spawn('node', ['-e', testScript], {
      cwd: porServerPath,
      stdio: 'inherit'
    });
    
    testProcess.on('exit', (code) => {
      console.log(`\n📊 MDB Reader test completed with exit code: ${code}`);
      
      if (code === 0) {
        console.log('\n✅ POR MCP Server should be working. Issue might be in the MCP communication protocol.');
        console.log('💡 Recommendation: Check MCP server initialization and query handling.');
      } else {
        console.log('\n❌ MDB Reader library has issues with the database file.');
        console.log('💡 Recommendation: Check database file format or try rebuilding the MCP server.');
      }
    });
    
  } catch (error) {
    console.log(`❌ MDB Reader test error: ${error.message}`);
  }
}

diagnosePOR();
