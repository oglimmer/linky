package config

import (
	"github.com/caarlos0/env/v11"
)

type Config struct {
	Port        int    `env:"PORT" envDefault:"8080"`
	DatabaseURL string `env:"DATABASE_URL" envDefault:"linky:linky@tcp(localhost:3306)/linky?parseTime=true&multiStatements=true"`
	JWTSecret   string `env:"JWT_SECRET" envDefault:"change-me-in-production"`
	JWTExpiry   string `env:"JWT_EXPIRY" envDefault:"24h"`

	// OAuth providers - each has ClientID, ClientSecret, RedirectURI
	OAuthRedirectBase string `env:"OAUTH_REDIRECT_BASE" envDefault:"http://localhost:8080/authback"`

	GoogleClientID     string `env:"GOOGLE_CLIENT_ID"`
	GoogleClientSecret string `env:"GOOGLE_CLIENT_SECRET"`

	GitHubClientID     string `env:"GITHUB_CLIENT_ID"`
	GitHubClientSecret string `env:"GITHUB_CLIENT_SECRET"`

	FacebookClientID     string `env:"FACEBOOK_CLIENT_ID"`
	FacebookClientSecret string `env:"FACEBOOK_CLIENT_SECRET"`

	TwitterConsumerKey    string `env:"TWITTER_CONSUMER_KEY"`
	TwitterConsumerSecret string `env:"TWITTER_CONSUMER_SECRET"`

	LinkedInClientID     string `env:"LINKEDIN_CLIENT_ID"`
	LinkedInClientSecret string `env:"LINKEDIN_CLIENT_SECRET"`

	BitbucketClientID     string `env:"BITBUCKET_CLIENT_ID"`
	BitbucketClientSecret string `env:"BITBUCKET_CLIENT_SECRET"`

	RedditClientID     string `env:"REDDIT_CLIENT_ID"`
	RedditClientSecret string `env:"REDDIT_CLIENT_SECRET"`

	YahooClientID     string `env:"YAHOO_CLIENT_ID"`
	YahooClientSecret string `env:"YAHOO_CLIENT_SECRET"`

	// Feature flags
	EnableUserPass bool `env:"ENABLE_USERPASS" envDefault:"true"`
	EnableOAuth    bool `env:"ENABLE_OAUTH" envDefault:"true"`

	// HTTP settings
	UserAgent    string `env:"HTTP_USER_AGENT" envDefault:"Linky/1.0"`
	CookieSecure bool   `env:"COOKIE_SECURE" envDefault:"false"`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
