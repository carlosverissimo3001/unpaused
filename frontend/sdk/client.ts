import { Configuration, ApiApi } from './index';

const config = new Configuration({
  // If we are in the browser, use the proxy path.
  // If we are on the server (SSR), use the full URL.
  basePath:
    typeof window !== 'undefined'
      ? '/api'
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  credentials: 'include',
});

export const api = new ApiApi(config);