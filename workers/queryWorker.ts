const DELAY_BETWEEN_ROWS = 2000; // 2 seconds delay between rows

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'START') {
    const { rows } = payload;

    try {
      for (let i = 0; i < rows; i++) {
        // Notify main thread that we're starting a new row
        self.postMessage({ type: 'START_ROW', payload: { index: i } });

        // Execute the row
        self.postMessage({ type: 'ROW_COMPLETE', payload: { index: i } });

        // Wait before processing next row
        if (i < rows - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ROWS));
        }
      }

      // Notify main thread that all rows are complete
      self.postMessage({ type: 'COMPLETE' });
    } catch (error) {
      self.postMessage({ 
        type: 'ERROR', 
        payload: { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      });
    }
  }
};
