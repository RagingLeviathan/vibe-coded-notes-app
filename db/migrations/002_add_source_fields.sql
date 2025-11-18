-- Add source fields to notes_logs
ALTER TABLE notes_logs
  ADD COLUMN source_short VARCHAR(255) NULL DEFAULT NULL,
  ADD COLUMN source_full TEXT NULL DEFAULT NULL;
