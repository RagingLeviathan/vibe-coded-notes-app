import React from 'react';
import NoteItem from './NoteItem';

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt?: string;
  sourceShort?: string;
  sourceFull?: string;
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
        <div className="empty-state"><span aria-hidden="true">✧</span><p>No notes available.</p><small>There is room here for your next idea.</small></div>
      ) : (
        notes.map(note => (
          <NoteItem key={note.id} note={note} onDelete={onDelete} onEdit={onEdit} />
        ))
      )}
    </div>
  );
};

export default NoteList;