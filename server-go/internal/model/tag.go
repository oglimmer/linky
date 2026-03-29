package model

type TagNode struct {
	ID     int64  `db:"id" json:"-"`
	UserID int64  `db:"user_id" json:"-"`
	Name   string `db:"tag_name" json:"name"`
	Parent string `db:"parent" json:"parent"`
	Index  int    `db:"sort_idx" json:"index"`
}

type TagHierarchyResponse struct {
	Tree     []TagNode      `json:"tree"`
	TagCount map[string]int `json:"tagCount"`
}

type TagHierarchyPayload struct {
	Tree []TagNode `json:"tree"`
}
