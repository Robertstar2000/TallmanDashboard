export async function executeQuery(sql: string, params?: any[]) {
  try {
    const response = await fetch('/api/db?' + new URLSearchParams({
      sql,
      params: params ? JSON.stringify(params) : ''
    }));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const { data, error } = await response.json();
    if (error) throw new Error(error);
    return data;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
