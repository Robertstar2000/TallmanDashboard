// temp-fix-tester.mjs
// Purpose: Modify DatabaseConnectionTester.tsx due to edit tool issues.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Define paths and lines ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFilePath = path.resolve(__dirname, 'components', 'admin', 'DatabaseConnectionTester.tsx');
const correctP21BodyLine = "      body: JSON.stringify({ ...p21Config, type: 'P21' }),";
const correctPORBodyLine = "      body: JSON.stringify({ ...porConfig, type: 'POR' }),";
const p21ConsoleLogLine = "    console.log('P21 Config before fetch:', p21Config); // Added by script";
const porConsoleLogLine = "    console.log('POR Config before fetch:', porConfig); // Added by script";
// -----------------------------

async function runFix() {
  console.log(`Attempting to modify fetch calls and add logs in: ${targetFilePath}`);
  try {
    let content = await fs.readFile(targetFilePath, 'utf-8');
    let changesMade = false;

    const lines = content.split(/\r?\n/);
    const newLines = [];

    const p21FetchMarker = "await fetch('/api/admin/test-p21";
    const porFetchMarker = "await fetch('/api/admin/test-por";
    const fetchOptionsEndMarker = '});';

    let inP21FetchOptions = false;
    let inPORFetchOptions = false;
    let p21BodyFixed = false;
    let porBodyFixed = false;
    let p21LogAdded = false;
    let porLogAdded = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if we are about to hit the fetch call to insert the log
      if (!p21LogAdded && line.includes(p21FetchMarker)) {
        newLines.push(p21ConsoleLogLine);
        console.log('- Added P21 console log line.');
        p21LogAdded = true;
        changesMade = true;
      }
      if (!porLogAdded && line.includes(porFetchMarker)) {
        newLines.push(porConsoleLogLine);
        console.log('- Added POR console log line.');
        porLogAdded = true;
        changesMade = true;
      }

      // Start tracking when entering fetch options
      if (line.includes(p21FetchMarker)) {
        inP21FetchOptions = true;
        newLines.push(line);
        continue;
      }
      if (line.includes(porFetchMarker)) {
        inPORFetchOptions = true;
        newLines.push(line);
        continue;
      }

      // If inside fetch options block
      if (inP21FetchOptions || inPORFetchOptions) {
        // Skip existing/incorrect body lines
        if (trimmedLine.startsWith('body:')) {
          // Only mark change if it's NOT the line we intend to insert
          if (!trimmedLine.startsWith(correctP21BodyLine.trim()) && !trimmedLine.startsWith(correctPORBodyLine.trim())) {
            changesMade = true;
            console.log(`- Removing old body line: ${line.trim()}`);
          }
          continue; // Don't add old/duplicate body lines
        }

        // Skip specific remnant lines
        if (
          trimmedLine.includes("server: 'P21',") ||
          trimmedLine.includes('config: p21Config') ||
          trimmedLine.includes("server: 'POR',") ||
          trimmedLine.includes('config: porConfig') ||
          trimmedLine === '}),'
        ) {
          changesMade = true;
          console.log(`- Removing remnant line: ${line.trim()}`);
          continue;
        }

        // Check for the end of the fetch options block
        if (trimmedLine === fetchOptionsEndMarker) {
          if (inP21FetchOptions && !p21BodyFixed) {
            newLines.push(correctP21BodyLine);
            console.log('- Inserting correct P21 body line.');
            p21BodyFixed = true;
            // Don't mark change here as removing old line already did
          } else if (inPORFetchOptions && !porBodyFixed) {
            newLines.push(correctPORBodyLine);
            console.log('- Inserting correct POR body line.');
            porBodyFixed = true;
            // Don't mark change here as removing old line already did
          }
          newLines.push(line);
          inP21FetchOptions = false;
          inPORFetchOptions = false;
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }

    // Join lines back
    content = newLines.join('\n');

    if (changesMade) {
      await fs.writeFile(targetFilePath, content, 'utf-8');
      console.log('Successfully updated the file.');
    } else {
      console.log('No changes made. File might already be correct, or markers not found.');
    }

  } catch (error) {
    console.error('Error fixing the file:', error);
  }
}

runFix();
