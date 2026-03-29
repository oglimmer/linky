package model

import "time"

type Visitor struct {
	ID           int64     `db:"id"`
	VisitorID    string    `db:"visitor_id"`
	AuthType     *string   `db:"auth_type"`
	Hint         *string   `db:"hint"`
	RefreshToken *string   `db:"refresh_token"`
	CreatedAt    time.Time `db:"created_at"`
}
