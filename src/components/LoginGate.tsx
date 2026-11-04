import React, { useState } from 'react';
import { LockKeyhole } from 'lucide-react';

interface LoginGateProps {
  onAuthenticated: () => void;
}

/** Shown when the API requires a session. The token is sent once and never stored in the browser. */
export const LoginGate: React.FC<LoginGateProps> = ({ onAuthenticated }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const cleanInput = token.trim().replace(/^["']|["']$/g, '');
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanInput })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const validToken = data.token || cleanInput;
        if (validToken) {
          sessionStorage.setItem('smollan_api_token', validToken);
        }
        onAuthenticated();
      } else {
        setError(res.status === 429 ? 'Too many attempts. Wait 15 minutes and try again.' : 'That access token is not valid.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
      setToken('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-5">
        <div className="flex items-center gap-2 text-slate-800">
          <LockKeyhole className="w-5 h-5" />
          <h1 className="text-lg font-black tracking-tight">Sign in to the audit platform</h1>
        </div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Access token
          <input
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900"
            required
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || token.length === 0}
          className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-sm font-bold disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};
