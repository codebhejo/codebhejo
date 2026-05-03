.PHONY: help infra-up infra-down infra-logs \
        setup install dev dev-frontend dev-backend build migrate rollback \
        cli-run cli-build cli-install

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n"} \
	  /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } \
	  /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' \
	  $(MAKEFILE_LIST)

##@ Infrastructure

infra-up: ## Start local services: MySQL, MinIO, phpMyAdmin, Mailpit
	docker compose -f infra/docker-compose.yml up -d

infra-down: ## Stop local services
	docker compose -f infra/docker-compose.yml down

infra-logs: ## Tail logs from local services
	docker compose -f infra/docker-compose.yml logs -f

##@ Setup

setup: ## First-time setup: copy .env, generate JWT_SECRET, install all deps
	@if [ ! -f apps/backend/.env ]; then \
		cp apps/backend/.env.example apps/backend/.env; \
		echo "Created apps/backend/.env"; \
	fi
	@if grep -q 'JWT_SECRET=""' apps/backend/.env; then \
		secret=$$(openssl rand -hex 32); \
		sed -i "s|JWT_SECRET=\"\"|JWT_SECRET=\"$$secret\"|" apps/backend/.env; \
		echo "Generated JWT_SECRET"; \
	fi
	npm install --prefix apps/frontend
	npm install --prefix apps/backend
	@echo ""
	@echo "Setup complete. Next:"
	@echo "  1. make migrate"
	@echo "  2. make dev"

install: ## Install npm dependencies for frontend and backend
	npm install --prefix apps/frontend
	npm install --prefix apps/backend

##@ Development

dev: ## Run frontend + backend concurrently (Ctrl+C stops both)
	@bash -c 'trap "kill 0" EXIT; (cd apps/frontend && npm run dev) & (cd apps/backend && npm run dev) & wait'

dev-frontend: ## Run frontend only (http://localhost:5173)
	cd apps/frontend && npm run dev

dev-backend: ## Run backend only (http://localhost:3000)
	cd apps/backend && npm run dev

##@ Build

build: ## Production build of frontend
	npm run build --prefix apps/frontend

##@ Database

migrate: ## Run pending database migrations
	npm run migrate --prefix apps/backend

rollback: ## Rollback last migration
	npm run rollback --prefix apps/backend

##@ CLI

cli-run: ## Run CLI locally
	cd apps/cli && go run main.go

cli-build: ## Build CLI Linux amd64 binary
	cd apps/cli && \
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
	go build \
		-ldflags "-X github.com/codebhejo/codebhejo/cli/internal/config.API=http://localhost:3000 \
		          -X github.com/codebhejo/codebhejo/cli/internal/config.WEB_URL=http://localhost:5173" \
		-o codebhejo-linux-amd64 ./main.go

cli-install: cli-build ## Build and install CLI to /usr/local/bin
	chmod +x apps/cli/codebhejo-linux-amd64
	sudo mv apps/cli/codebhejo-linux-amd64 /usr/local/bin/codebhejo
