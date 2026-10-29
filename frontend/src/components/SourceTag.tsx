import React from 'react';

const SourceTag: React.FC<{ value: string }> = ({ value }) => (
    <span className="inline-flex items-center rounded-full border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-200">
        <span className="mr-1.5 uppercase tracking-wide text-blue-400 dark:text-blue-300">Source</span>
        <span aria-hidden="true" className="mr-1.5 text-blue-300 dark:text-blue-500">›</span>
        {value}
    </span>
);

export default SourceTag;
