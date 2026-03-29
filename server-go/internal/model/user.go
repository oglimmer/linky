package model

import (
	"encoding/json"
	"time"
)

type User struct {
	ID           int64           `db:"id" json:"id"`
	Email        *string         `db:"email" json:"email,omitempty"`
	PasswordHash *string         `db:"password_hash" json:"-"`
	Source       *string         `db:"source" json:"source,omitempty"`
	SourceID     *string         `db:"source_id" json:"sourceId,omitempty"`
	SourceData   *json.RawMessage `db:"source_data" json:"sourceData,omitempty"`
	CreatedAt    time.Time       `db:"created_at" json:"createdDate"`
}
