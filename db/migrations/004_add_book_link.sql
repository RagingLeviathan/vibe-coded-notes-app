-- Optional link from a note to a Hardcover book.
-- book_id is the Hardcover book id; title and slug are stored so notes can show the book without calling Hardcover.
-- All three stay NULL for notes that are not linked to a book. Re-runnable on MariaDB.
ALTER TABLE notes_logs
  ADD COLUMN IF NOT EXISTS book_id INT UNSIGNED NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS book_title VARCHAR(255) NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS book_slug VARCHAR(255) NULL DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_notes_logs_book_id ON notes_logs (book_id);
