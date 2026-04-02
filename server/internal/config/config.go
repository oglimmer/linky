package config

import (
	"github.com/caarlos0/env/v11"
)

type Config struct {
	Port        int    `env:"PORT" envDefault:"8080"`
	DatabaseURL string `env:"DATABASE_URL" envDefault:"linky:linky@tcp(localhost:3306)/linky?parseTime=true&multiStatements=true"`
	JWTSecret   string `env:"JWT_SECRET" envDefault:"change-me-in-production"`
	JWTExpiry   string `env:"JWT_EXPIRY" envDefault:"24h"`

	// OIDC SSO
	OAuthRedirectBase string `env:"OAUTH_REDIRECT_BASE" envDefault:"http://localhost:8080/authback"`
	OIDCIssuerURL     string `env:"OIDC_ISSUER_URL"`
	OIDCClientID      string `env:"OIDC_CLIENT_ID"`
	OIDCClientSecret  string `env:"OIDC_CLIENT_SECRET"`

	// Content backend (for archive proxying)
	ContentAPIURL  string `env:"CONTENT_API_URL"`
	ContentAPIUser string `env:"CONTENT_API_USER"`
	ContentAPIPass string `env:"CONTENT_API_PASS"`

	// HTTP settings
	UserAgent    string `env:"HTTP_USER_AGENT" envDefault:"Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0"`
	CookieSecure bool   `env:"COOKIE_SECURE" envDefault:"false"`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
