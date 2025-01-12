import { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
  };
};
