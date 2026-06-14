-- Bind each OIDC account to the issuer that asserted it, so the identity key
-- becomes (source, issuer, source_id) instead of (source, source_id). This
-- prevents a second/forged IdP from landing on an existing account merely by
-- reusing another provider's subject ("sub") value.
--
-- Existing rows get issuer='' here; the application backfills the real issuer
-- for legacy OIDC users at startup (see UserService.BackfillOIDCIssuer), which
-- is safe because every existing source='oidc' row was issued by the single
-- configured OIDC_ISSUER_URL.

ALTER TABLE users ADD COLUMN issuer VARCHAR(255) NOT NULL DEFAULT '' AFTER source;
ALTER TABLE users DROP INDEX idx_source;
ALTER TABLE users ADD UNIQUE KEY idx_source (source, issuer, source_id);
