import React from 'react';
import { Link } from 'react-router-dom';

const SourceTag: React.FC<{ value: string }> = ({ value }) => (
    <Link to={{ pathname: '/source-notes', hash: new URLSearchParams({ source: value }).toString() }} className="inline-flex max-w-full items-center rounded-full border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800">
        <span className="mr-1.5 flex-shrink-0 uppercase tracking-wide text-blue-400 dark:text-blue-300">Source</span>
        <span aria-hidden="true" className="mr-1.5 flex-shrink-0 text-blue-300 dark:text-blue-500">›</span>
        <span className="min-w-0 break-words">{value}</span>
    </Link>
);

export default SourceTag;
