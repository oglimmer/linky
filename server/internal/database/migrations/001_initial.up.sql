CREATE TABLE IF NOT EXISTS users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    source        VARCHAR(50),
    source_id     VARCHAR(255),
    source_data   JSON,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_source (source, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS links (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    url            VARCHAR(2048) NOT NULL,
    rss_url        VARCHAR(2048),
    page_title     VARCHAR(1024),
    notes          MEDIUMTEXT,
    favicon_url    VARCHAR(2048),
    call_counter   INT NOT NULL DEFAULT 0,
    last_called_at TIMESTAMP NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FULLTEXT INDEX ft_links (url, page_title, notes)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS link_tags (
    link_id BIGINT NOT NULL,
    tag     VARCHAR(255) NOT NULL,
    PRIMARY KEY (link_id, tag),
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE,
    INDEX idx_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tag_hierarchy (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id  BIGINT NOT NULL,
    tag_name VARCHAR(255) NOT NULL,
    parent   VARCHAR(255) NOT NULL DEFAULT 'root',
    sort_idx INT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY idx_user_tag (user_id, tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feed_updates (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    link_id        BIGINT NOT NULL,
    user_id        BIGINT NOT NULL,
    seen_entries   JSON,
    latest_entries JSON,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY idx_link (link_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visitors (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    visitor_id    VARCHAR(255) UNIQUE NOT NULL,
    auth_type     VARCHAR(50),
    hint          VARCHAR(255),
    refresh_token TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
