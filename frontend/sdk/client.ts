import { Configuration, ApiApi } from './index';

const config = new Configuration({
  basePath: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  credentials: 'include',
});

export const api = new ApiApi(config);