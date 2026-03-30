FROM golang:1.26-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /linky ./cmd/linky
RUN CGO_ENABLED=0 go build -o /migrate-couchdb ./cmd/migrate-couchdb

FROM alpine:3.23
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /linky /usr/local/bin/linky
COPY --from=builder /migrate-couchdb /usr/local/bin/migrate-couchdb
EXPOSE 8080
CMD ["linky"]
