import React, { useState, useEffect } from 'react';

// Use Vite env vars prefixed with VITE_ (set in frontend/.env or .env.local)
// Cast import.meta to any to avoid TS ImportMeta typing issues in this small example
const _meta: any = import.meta;
const HARDCOVER_URL = (_meta.env && _meta.env.VITE_HARDCOVER_URL) || 'https://api.hardcover.app/v1/graphql';
// Normalize env token: remove surrounding quotes and an optional leading "Bearer " if present
let _envToken: string = (_meta.env && _meta.env.VITE_HARDCOVER_TOKEN) || '';
if (typeof _envToken === 'string') {
    // remove surrounding quotes if the env file used quotes
    if ((_envToken.startsWith('"') && _envToken.endsWith('"')) || (_envToken.startsWith("'") && _envToken.endsWith("'"))) {
        _envToken = _envToken.slice(1, -1);
    }
    // strip a leading "Bearer " if the user included it in the env value
    if (_envToken.toLowerCase().startsWith('bearer ')) {
        _envToken = _envToken.slice(7);
    }
}
const ENV_TOKEN = _envToken || '';

// Debug: indicate whether an env token string was present (safe check)
try {
    console.log('VITE_HARDCOVER_TOKEN present:', !!_envToken);
} catch (e) {}

const Hardcover: React.FC = () => {
    const [token, setToken] = useState<string>(ENV_TOKEN);
    const [metaKeys, setMetaKeys] = useState<string[]>([]);
    const [metaTokenRaw, setMetaTokenRaw] = useState<string | null>(null);
    const [query, setQuery] = useState<string>(`query { __typename }`);
    const [variables, setVariables] = useState<string>('{}');
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const send = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        let vars: any = undefined;
        try {
            vars = variables && variables.trim() !== '' ? JSON.parse(variables) : undefined;
        } catch (err: any) {
            setLoading(false);
            setError('Variables must be valid JSON. ' + (err && err.message ? err.message : ''));
            return;
        }

        try {
            const trimmed = token ? token.trim() : '';
            const authHeader = trimmed !== '' ? `Bearer ${trimmed}` : undefined;
            const headers: any = { 'Content-Type': 'application/json' };
            if (authHeader) headers.Authorization = authHeader;

            // debug: log what header will be sent (will appear in browser console)
            try { console.log('Hardcover: sending Authorization header ->', authHeader ? authHeader.replace(/(.{6}).+(.{6})/, '$1...$2') : '(none)'); } catch {}

            const res = await fetch(HARDCOVER_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify({ query, variables: vars }),
            });

            const json = await res.json();
            // Friendly handling for common auth error
            if (res.status === 401) {
                setError('Unauthorized: token missing or invalid. Check your VITE_HARDCOVER_TOKEN or paste a valid token.');
                setResult(json);
            } else if (!res.ok) {
                setError(`HTTP ${res.status}: ${res.statusText}`);
                setResult(json);
            } else {
                // If GraphQL returned errors, surface them as a friendly message but still show result
                if (json && json.errors) {
                    try {
                        setError('GraphQL errors: ' + (Array.isArray(json.errors) ? json.errors.map((e: any) => e.message).join('; ') : String(json.errors)));
                    } catch (e) {
                        setError('GraphQL returned errors');
                    }
                }
                setResult(json);
            }
        } catch (err: any) {
            setError(err && err.message ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    // Auto-run a sample query on first load if an env token was provided
    useEffect(() => {
        if (ENV_TOKEN && ENV_TOKEN.trim() !== '') {
            // token already set via ENV_TOKEN -> call send on mount
            // no await here since send manages loading state
            send();
        }
        // Read import.meta.env at runtime in a safe way and expose some debug info
        try {
            const meta: any = (import.meta as any).env || {};
            setMetaKeys(Object.keys(meta));
            let raw = meta && meta.VITE_HARDCOVER_TOKEN ? meta.VITE_HARDCOVER_TOKEN : null;
            if (typeof raw === 'string') {
                // strip surrounding quotes
                if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) raw = raw.slice(1, -1);
                if (raw.toLowerCase().startsWith('bearer ')) raw = raw.slice(7);
            }
            setMetaTokenRaw(raw);
            console.log('import.meta.env keys:', Object.keys(meta));
        } catch (e) {
            console.log('import.meta.env not available');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="mx-auto p-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-4 text-blue-700 dark:text-blue-300">Hardcover GraphQL</h1>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Endpoint: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{HARDCOVER_URL}</code></p>

            <div className="mb-3">
                <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Bearer token (from env or paste here)</label>
                <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="VITE_HARDCOVER_TOKEN" className="w-full p-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                {!ENV_TOKEN && (
                    <p className="text-xs text-gray-500 mt-1">Tip: set <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">VITE_HARDCOVER_TOKEN</code> in <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">frontend/.env.local</code> to prefill.</p>
                )}

                {/* Masked token preview to help debugging without exposing full token */}
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                    Using token: {token && token.trim() !== '' ? (<span className="font-mono">{token.trim().slice(0,6)}...{token.trim().slice(-6)}</span>) : <span className="italic text-gray-400">(none)</span>}
                </div>
            </div>

            <div className="mb-3">
                <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">GraphQL Query</label>
                <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={6} className="w-full p-3 rounded border dark:border-gray-600 bg-white dark:bg-gray-800 font-mono text-sm" />
            </div>

            <div className="mb-3">
                <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Variables (JSON)</label>
                <textarea value={variables} onChange={(e) => setVariables(e.target.value)} rows={4} className="w-full p-3 rounded border dark:border-gray-600 bg-white dark:bg-gray-800 font-mono text-sm" />
            </div>

            <div className="mb-6">
                <button onClick={send} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60">{loading ? 'Sending...' : 'Send'}</button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-sm text-red-800 dark:text-red-200 rounded">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Debug panel: show what Vite exposed in import.meta.env and masked token previews */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 border rounded text-sm">
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Debug info (env keys exposed by Vite):</div>
                <div className="font-mono text-xs mb-2">{metaKeys.length ? metaKeys.join(', ') : '(none)'}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">import.meta token: {metaTokenRaw ? <span className="font-mono">{metaTokenRaw.slice(0,6)}...{metaTokenRaw.slice(-6)}</span> : <em className="text-gray-400">(none)</em>}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">module ENV_TOKEN: {ENV_TOKEN ? <span className="font-mono">{ENV_TOKEN.slice(0,6)}...{ENV_TOKEN.slice(-6)}</span> : <em className="text-gray-400">(none)</em>}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">input token state: {token ? <span className="font-mono">{token.slice(0,6)}...{token.slice(-6)}</span> : <em className="text-gray-400">(none)</em>}</div>
            </div>

            {result && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Response</h2>
                    <pre className="p-3 rounded bg-gray-100 dark:bg-gray-900 overflow-auto text-sm">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default Hardcover;
