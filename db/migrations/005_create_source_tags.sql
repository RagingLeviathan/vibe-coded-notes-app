CREATE TABLE IF NOT EXISTS source_tags (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    source_short VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    source_full TEXT NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    book_title VARCHAR(255) NOT NULL,
    book_slug VARCHAR(255) NULL DEFAULT NULL,
    UNIQUE KEY uq_source_tags_short (source_short)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
