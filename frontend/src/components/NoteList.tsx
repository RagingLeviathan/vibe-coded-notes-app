import React from 'react';
import NoteItem from './NoteItem';

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt?: string;
}

interface NoteListProps {
  notes: Note[];
  onDelete: (id: number) => void;
  onEdit?: (note: { id: number; title: string; content: string }) => void;
}

const NoteList: React.FC<NoteListProps> = ({ notes, onDelete, onEdit }) => {
  return (
    <div className="note-list">
      {notes.length === 0 ? (
        <p>No notes available.</p>
      ) : (
        notes.map(note => (
          <NoteItem key={note.id} note={note as any} onDelete={onDelete} onEdit={onEdit} />
        ))
      )}
    </div>
  );
};

export default NoteList;