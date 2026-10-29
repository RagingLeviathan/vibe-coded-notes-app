import React, { useState } from 'react';

// Cast import.meta to any to avoid TS ImportMeta typing issues in this small example
const _meta: any = import.meta;
const HARDCOVER_URL = (_meta.env && _meta.env.VITE_HARDCOVER_URL) || 'https://api.hardcover.app/v1/graphql';

// Normalize env token like other pages (strip surrounding quotes or leading "Bearer ")
let _envToken: string = (_meta.env && _meta.env.VITE_HARDCOVER_TOKEN) || '';
if (typeof _envToken === 'string') {
  if ((_envToken.startsWith('"') && _envToken.endsWith('"')) || (_envToken.startsWith("'") && _envToken.endsWith("'"))) {
    _envToken = _envToken.slice(1, -1);
  }
  if (_envToken.toLowerCase().startsWith('bearer ')) _envToken = _envToken.slice(7);
}
const ENV_TOKEN = _envToken || '';

function fetchGraphQL(operationsDoc: string, operationName: string, variables: Record<string, any>, token?: string) {
  const headers: any = { 'Content-Type': 'application/json' };
  if (token && token.trim() !== '') headers.Authorization = `Bearer ${token.trim()}`;

  return fetch(HARDCOVER_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: operationsDoc, variables, operationName }),
  }).then((r) => r.json());
}

const operation = `
  query MyQuery {
    user_books {
      id
      title
      created_at
    }
  }
`;

const GraphqlExample: React.FC = () => {
  const [token, setToken] = useState<string>(ENV_TOKEN);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Call the backend proxy at /api/hardcover so token can be kept server-side
      const res = await fetch('/api/hardcover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: operation, variables: {}, operationName: 'MyQuery' }),
      });
      const json = await res.json();
      if (json.errors) {
        setError(JSON.stringify(json.errors));
      }
      setResult(json);
    } catch (e: any) {
      setError(e && e.message ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-blue-700 dark:text-blue-300">GraphQL Example</h1>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Endpoint: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{HARDCOVER_URL}</code></p>

      <div className="mb-3">
        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Token (env or paste here)</label>
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="VITE_HARDCOVER_TOKEN" className="w-full p-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
      </div>

      <div className="mb-6">
        <button onClick={run} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60">{loading ? 'Running...' : 'Run sample query'}</button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-sm text-red-800 dark:text-red-200 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Result</h2>
          <pre className="p-3 rounded bg-gray-100 dark:bg-gray-900 overflow-auto text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default GraphqlExample;
