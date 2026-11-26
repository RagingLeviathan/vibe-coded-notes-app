import React, { useState } from 'react';

const operation = `
  query MyQuery {
    user_books(limit: 5) {
      id
      created_at
      book {
        id
        title
      }
    }
  }
`;

const GraphqlExample: React.FC = () => {
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
      if (!res.ok) {
        setError(json.error || json.message || `Request failed (HTTP ${res.status})`);
      } else if (json.errors) {
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

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">The sample query uses the backend proxy at <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">/api/hardcover</code> and its configured Hardcover token.</p>

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
