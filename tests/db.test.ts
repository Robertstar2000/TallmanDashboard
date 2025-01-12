'use client';

import { getAllVariables, getVariablesByGroup } from '@/lib/db/indexedDB';

async function testDatabase() {
  console.log('Starting Database Tests...\n');

  try {
    // Test 1: Get all variables
    const allVariables = await getAllVariables();
    console.log(`Total variables: ${allVariables.length}\n`);

    // Test 2: Variables by group
    const groups = [
      'Metrics',
      'Historical Trends',
      'Daily Shipments',
      'Site Distribution',
      'Top Products Online',
      'Top Products Inside',
      'Top Products Outside'
    ];

    for (const group of groups) {
      const variables = await getVariablesByGroup(group);
      console.log(`${group}: ${variables.length} variables`);
      if (variables.length > 0) {
        console.log('Sample:', {
          name: variables[0].name,
          value: variables[0].value
        });
      }
      console.log('');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
testDatabase();