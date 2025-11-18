import React from 'react';

interface NoteItemProps {
    note: {
        id: number;
        title: string;
        content: string;
        createdAt: string;
        sourceShort?: string;
        sourceFull?: string;
    };
    onDelete: (id: number) => void;
    onEdit?: (note: { id: number; title: string; content: string }) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onEdit }) => {
    return (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-4 border-l-4 border-blue-200 dark:border-blue-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-blue-800 dark:text-blue-300">{note.title}</h2>
                    {note.sourceShort && <div className="text-sm text-blue-400 dark:text-blue-200">{note.sourceShort}</div>}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-300">{note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}</span>
            </div>
            <p className="text-gray-700 dark:text-gray-200 mt-2">{note.content}</p>
            {note.sourceFull && <p className="text-sm text-gray-400 dark:text-gray-300 mt-2">Source: {note.sourceFull}</p>}
            <div className="mt-3">
                <div className="flex space-x-2">
                    {onEdit && (
                        <button
                            className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                            onClick={() => {
                                console.log('NoteItem: Edit clicked', note.id);
                                onEdit({ id: note.id, title: note.title, content: note.content });
                            }}
                        >
                            Edit
                        </button>
                    )}

                    <button
                        className="bg-red-500 dark:bg-red-600 text-white py-1 px-3 rounded hover:bg-red-600 dark:hover:bg-red-700"
                        onClick={() => onDelete(note.id)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoteItem;