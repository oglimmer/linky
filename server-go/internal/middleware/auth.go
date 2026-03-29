package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"

func Auth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr := ""

			// Try Authorization header first
			if auth := r.Header.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
				tokenStr = strings.TrimPrefix(auth, "Bearer ")
			}

			// Fall back to cookie
			if tokenStr == "" {
				if c, err := r.Cookie("authToken"); err == nil {
					tokenStr = c.Value
				}
			}

			if tokenStr == "" {
				writeAuthError(w)
				return
			}

			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				writeAuthError(w)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				writeAuthError(w)
				return
			}

			// user_id can be float64 from JSON
			userIDFloat, ok := claims["user_id"].(float64)
			if !ok {
				writeAuthError(w)
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, int64(userIDFloat))
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserID(ctx context.Context) int64 {
	if id, ok := ctx.Value(UserIDKey).(int64); ok {
		return id
	}
	return 0
}

func writeAuthError(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(map[string]string{"error": "Invalid auth token"})
}
