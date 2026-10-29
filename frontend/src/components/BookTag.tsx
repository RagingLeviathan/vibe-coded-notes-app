import React from 'react';
import { bookUrl } from '../services/hardcover';

// Small pill showing the linked book; links out to Hardcover when a slug is known
const BookTag: React.FC<{ title: string; slug?: string | null }> = ({ title, slug }) => {
    const href = bookUrl(slug);
    const classes = 'inline-flex items-center rounded-full border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-200';
    const label = (
        <>
            <span className="mr-1.5 uppercase tracking-wide text-purple-400 dark:text-purple-300">Book</span>
            <span aria-hidden="true" className="mr-1.5 text-purple-300 dark:text-purple-500">›</span>
            {title}
        </>
    );
    return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`${classes} hover:underline`}>{label}</a>
    ) : (
        <span className={classes}>{label}</span>
    );
};

export default BookTag;
