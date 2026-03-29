package database

import (
	"embed"
	"fmt"
	"log/slog"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jmoiron/sqlx"

	_ "github.com/go-sql-driver/mysql"
)

//go:embed migrations/*.sql
var migrations embed.FS

func Connect(dsn string) (*sqlx.DB, error) {
	db, err := sqlx.Connect("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("connecting to database: %w", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	return db, nil
}

func RunMigrations(db *sqlx.DB) error {
	driver, err := mysql.WithInstance(db.DB, &mysql.Config{})
	if err != nil {
		return fmt.Errorf("creating migration driver: %w", err)
	}

	source, err := iofs.New(migrations, "migrations")
	if err != nil {
		return fmt.Errorf("creating migration source: %w", err)
	}

	m, err := migrate.NewWithInstance("iofs", source, "mysql", driver)
	if err != nil {
		return fmt.Errorf("creating migrator: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("running migrations: %w", err)
	}

	slog.Info("database migrations completed")
	return nil
}
