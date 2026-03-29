package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

// CouchDB document structures
type CouchDBResponse struct {
	TotalRows int          `json:"total_rows"`
	Rows      []CouchDBRow `json:"rows"`
}

type CouchDBRow struct {
	ID  string          `json:"id"`
	Doc json.RawMessage `json:"doc"`
}

type CouchDoc struct {
	ID   string `json:"_id"`
	Type string `json:"type"`
}

type CouchUser struct {
	ID          string          `json:"_id"`
	Email       string          `json:"email"`
	Hash        string          `json:"hash"`
	Source      string          `json:"source"`
	SourceID    string          `json:"sourceId"`
	SourceData  json.RawMessage `json:"sourceData"`
	CreatedDate string          `json:"createdDate"`
}

type CouchLink struct {
	ID          string   `json:"_id"`
	UserID      string   `json:"userid"`
	LinkURL     string   `json:"linkUrl"`
	RssURL      string   `json:"rssUrl"`
	PageTitle   string   `json:"pageTitle"`
	Notes       string   `json:"notes"`
	FaviconURL  string   `json:"faviconUrl"`
	Tags        []string `json:"tags"`
	CallCounter int      `json:"callCounter"`
	LastCalled  string   `json:"lastCalled"`
	CreatedDate string   `json:"createdDate"`
}

type CouchHierarchy struct {
	ID     string `json:"_id"`
	UserID string `json:"userid"`
	Tree   []struct {
		Name   string `json:"name"`
		Parent string `json:"parent"`
		Index  int    `json:"index"`
	} `json:"tree"`
}

type CouchFeedUpdate struct {
	ID          string   `json:"_id"`
	LinkID      string   `json:"linkId"`
	UserID      string   `json:"userid"`
	Data        []string `json:"data"`
	LatestData  []string `json:"latestData"`
	CreatedDate string   `json:"createdDate"`
	LastUpdated string   `json:"lastUpdated"`
}

type CouchVisitor struct {
	ID           string `json:"_id"`
	VisitorID    string `json:"visitorId"`
	AuthType     string `json:"authType"`
	Hint         string `json:"hint"`
	RefreshToken string `json:"refreshToken"`
	CreatedDate  string `json:"createdDate"`
}

func main() {
	couchURL := flag.String("couchdb-url", "http://localhost:5984/linky", "CouchDB database URL")
	couchUser := flag.String("couchdb-user", "", "CouchDB username")
	couchPass := flag.String("couchdb-password", "", "CouchDB password")
	mariaDBDSN := flag.String("mariadb-dsn", "linky:linky@tcp(localhost:3306)/linky?parseTime=true&multiStatements=true", "MariaDB DSN")
	flag.Parse()

	// Connect to MariaDB
	db, err := sqlx.Connect("mysql", *mariaDBDSN)
	if err != nil {
		log.Fatalf("Failed to connect to MariaDB: %v", err)
	}
	defer db.Close()

	// Fetch all docs from CouchDB
	log.Println("Fetching all documents from CouchDB...")
	docs := fetchAllDocs(*couchURL, *couchUser, *couchPass)

	// Categorize by type
	var users []CouchUser
	var links []CouchLink
	var hierarchies []CouchHierarchy
	var feedUpdates []CouchFeedUpdate
	var visitors []CouchVisitor

	for _, raw := range docs {
		var base CouchDoc
		json.Unmarshal(raw, &base)

		switch base.Type {
		case "user":
			var u CouchUser
			json.Unmarshal(raw, &u)
			users = append(users, u)
		case "link":
			var l CouchLink
			json.Unmarshal(raw, &l)
			links = append(links, l)
		case "hierarchy":
			var h CouchHierarchy
			json.Unmarshal(raw, &h)
			hierarchies = append(hierarchies, h)
		case "feedUpdates":
			var f CouchFeedUpdate
			json.Unmarshal(raw, &f)
			feedUpdates = append(feedUpdates, f)
		case "visitor":
			var v CouchVisitor
			json.Unmarshal(raw, &v)
			visitors = append(visitors, v)
		}
	}

	log.Printf("Found: %d users, %d links, %d hierarchies, %d feed updates, %d visitors",
		len(users), len(links), len(hierarchies), len(feedUpdates), len(visitors))

	// ID mapping: CouchDB _id -> MariaDB id
	userIDMap := make(map[string]int64) // couch user _id -> maria user id
	linkIDMap := make(map[string]int64) // couch link _id -> maria link id

	// Migrate users
	log.Println("Migrating users...")
	for _, u := range users {
		createdAt := parseTime(u.CreatedDate)
		var sourceData []byte
		if u.SourceData != nil {
			sourceData = u.SourceData
		}

		res, err := db.Exec(
			`INSERT INTO users (email, password_hash, source, source_id, source_data, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
			nilIfEmpty(u.Email), nilIfEmpty(u.Hash), nilIfEmpty(u.Source), nilIfEmpty(u.SourceID), nilIfEmpty(string(sourceData)), createdAt)
		if err != nil {
			log.Printf("  ERROR inserting user %s: %v", u.ID, err)
			continue
		}
		id, _ := res.LastInsertId()
		userIDMap[u.ID] = id
		log.Printf("  User %s -> %d", u.ID, id)
	}

	// Migrate links
	log.Println("Migrating links...")
	for _, l := range links {
		mariaUserID, ok := userIDMap[l.UserID]
		if !ok {
			log.Printf("  SKIP link %s: unknown user %s", l.ID, l.UserID)
			continue
		}

		createdAt := parseTime(l.CreatedDate)
		lastCalled := parseTimePtr(l.LastCalled)

		res, err := db.Exec(
			`INSERT INTO links (user_id, url, rss_url, page_title, notes, favicon_url, call_counter, last_called_at, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			mariaUserID, l.LinkURL, nilIfEmpty(l.RssURL), nilIfEmpty(l.PageTitle), nilIfEmpty(l.Notes),
			nilIfEmpty(l.FaviconURL), l.CallCounter, lastCalled, createdAt)
		if err != nil {
			log.Printf("  ERROR inserting link %s: %v", l.ID, err)
			continue
		}

		linkID, _ := res.LastInsertId()
		linkIDMap[l.ID] = linkID

		// Insert tags
		for _, tag := range l.Tags {
			_, err := db.Exec("INSERT INTO link_tags (link_id, tag) VALUES (?, ?)", linkID, tag)
			if err != nil {
				log.Printf("  ERROR inserting tag %s for link %d: %v", tag, linkID, err)
			}
		}
	}
	log.Printf("  Migrated %d links", len(linkIDMap))

	// Migrate hierarchies
	log.Println("Migrating tag hierarchies...")
	for _, h := range hierarchies {
		mariaUserID, ok := userIDMap[h.UserID]
		if !ok {
			log.Printf("  SKIP hierarchy %s: unknown user %s", h.ID, h.UserID)
			continue
		}

		for _, node := range h.Tree {
			_, err := db.Exec(
				"INSERT INTO tag_hierarchy (user_id, tag_name, parent, sort_idx) VALUES (?, ?, ?, ?)",
				mariaUserID, node.Name, node.Parent, node.Index)
			if err != nil {
				log.Printf("  ERROR inserting hierarchy node %s for user %d: %v", node.Name, mariaUserID, err)
			}
		}
	}

	// Migrate feed updates
	log.Println("Migrating feed updates...")
	for _, f := range feedUpdates {
		mariaUserID, ok := userIDMap[f.UserID]
		if !ok {
			continue
		}
		mariaLinkID, ok := linkIDMap[f.LinkID]
		if !ok {
			continue
		}

		seenJSON, _ := json.Marshal(f.Data)
		latestJSON, _ := json.Marshal(f.LatestData)

		_, err := db.Exec(
			`INSERT INTO feed_updates (link_id, user_id, seen_entries, latest_entries, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
			mariaLinkID, mariaUserID, seenJSON, latestJSON, parseTime(f.CreatedDate), parseTime(f.LastUpdated))
		if err != nil {
			log.Printf("  ERROR inserting feed update %s: %v", f.ID, err)
		}
	}

	// Migrate visitors
	log.Println("Migrating visitors...")
	for _, v := range visitors {
		_, err := db.Exec(
			`INSERT INTO visitors (visitor_id, auth_type, hint, refresh_token, created_at) VALUES (?, ?, ?, ?, ?)`,
			v.VisitorID, nilIfEmpty(v.AuthType), nilIfEmpty(v.Hint), nilIfEmpty(v.RefreshToken), parseTime(v.CreatedDate))
		if err != nil {
			log.Printf("  ERROR inserting visitor %s: %v", v.ID, err)
		}
	}

	log.Println("Migration complete!")
}

func fetchAllDocs(couchURL, user, password string) []json.RawMessage {
	reqURL := couchURL + "/_all_docs?include_docs=true"
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		log.Fatalf("Failed to create request: %v", err)
	}
	if user != "" {
		req.SetBasicAuth(user, password)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatalf("Failed to fetch from CouchDB: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		log.Fatalf("CouchDB returned %d: %s", resp.StatusCode, string(body))
	}

	body, _ := io.ReadAll(resp.Body)
	var result CouchDBResponse
	json.Unmarshal(body, &result)

	var docs []json.RawMessage
	for _, row := range result.Rows {
		if strings.HasPrefix(row.ID, "_design/") {
			continue
		}
		docs = append(docs, row.Doc)
	}
	return docs
}

func parseTime(s string) time.Time {
	if s == "" {
		return time.Now()
	}
	// Try multiple formats
	for _, layout := range []string{
		time.RFC3339,
		"2006-01-02T15:04:05.000Z",
		"2006-01-02T15:04:05Z",
		time.RFC1123,
	} {
		if t, err := time.Parse(layout, s); err == nil {
			return t
		}
	}
	return time.Now()
}

func parseTimePtr(s string) *time.Time {
	if s == "" {
		return nil
	}
	t := parseTime(s)
	return &t
}

func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

// Ensure fmt is used (for potential future use)
var _ = fmt.Sprintf
