import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Any /api call that comes back 401 means the session has expired: tell the app to show the login gate.
const nativeFetch = window.fetch.bind(window);
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const savedToken = sessionStorage.getItem('smollan_api_token');
  let finalInit = init;

  if (savedToken && url.includes('/api/')) {
    const headers = new Headers(init?.headers);
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${savedToken}`);
      finalInit = { ...init, headers };
    }
  }

  const res = await nativeFetch(input, finalInit);
  if (res.status === 401 && url.includes('/api/') && !url.includes('/api/session')) {
    sessionStorage.removeItem('smollan_api_token');
    window.dispatchEvent(new Event('smollan:locked'));
  }
  return res;
};

try {
  window.fetch = customFetch;
} catch {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
  });
}

createRoot(document.getElementById('root')!).render(<App />);
