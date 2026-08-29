.PHONY: build-cli build-server build-all docker-up docker-down help

VERSION ?= 1.0.0
SERVER_URL ?= https://replay-backend-dq8p.onrender.com

help:
	@echo "Replay Production & Development Build Utility"
	@echo ""
	@echo "  make build-cli      Build CLI binary with SERVER_URL=$(SERVER_URL)"
	@echo "  make build-server   Build Go server binary"
	@echo "  make docker-up      Spin up entire docker-compose stack (Web, Server, PG, MinIO)"
	@echo "  make docker-down    Shutdown all docker containers"
	@echo "  make release-cli    Cross-compile CLI binaries for Linux, macOS, and Windows"

build-cli:
	@echo "Building CLI binary..."
	go build -ldflags "-X main.Version=$(VERSION) -X main.ServerURL=$(SERVER_URL)" -o bin/replay ./cmd/replay
	@echo "CLI binary built at bin/replay"

build-server:
	@echo "Building Server binary..."
	go build -o bin/server ./cmd/server
	@echo "Server binary built at bin/server"

build-all: build-cli build-server

docker-up:
	@echo "Spinning up production container stack..."
	docker compose up -d --build

docker-down:
	@echo "Stopping production containers..."
	docker compose down

release-cli:
	@echo "Cross-compiling CLI for all target platforms..."
	mkdir -p bin/dist
	GOOS=linux GOARCH=amd64 go build -ldflags "-X main.Version=$(VERSION) -X main.ServerURL=$(SERVER_URL)" -o bin/dist/replay-linux-amd64 ./cmd/replay
	GOOS=linux GOARCH=arm64 go build -ldflags "-X main.Version=$(VERSION) -X main.ServerURL=$(SERVER_URL)" -o bin/dist/replay-linux-arm64 ./cmd/replay
	GOOS=darwin GOARCH=amd64 go build -ldflags "-X main.Version=$(VERSION) -X main.ServerURL=$(SERVER_URL)" -o bin/dist/replay-darwin-amd64 ./cmd/replay
	GOOS=darwin GOARCH=arm64 go build -ldflags "-X main.Version=$(VERSION) -X main.ServerURL=$(SERVER_URL)" -o bin/dist/replay-darwin-arm64 ./cmd/replay
	GOOS=windows GOARCH=amd64 go build -ldflags "-X main.Version=$(VERSION) -X main.ServerURL=$(SERVER_URL)" -o bin/dist/replay-windows-amd64.exe ./cmd/replay
	@echo "Cross-compilation complete! Binaries stored in bin/dist/"
