-- Creates the notes_logs table the backend actually reads and writes.
-- Safe to run on a fresh database or alongside the older notes table (001/002).
CREATE TABLE IF NOT EXISTS notes_logs (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    source_short VARCHAR(255) NULL DEFAULT NULL,
    source_full TEXT NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
