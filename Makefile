.DEFAULT_GOAL := help
COMPOSE ?= docker compose

help: ## List commands
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*## "}{printf "  \033[36m%-16s\033[0m %s\n",$$1,$$2}'

install: ## Install backend and frontend dependencies
	cd backend && npm ci
	cd frontend && npm ci

lint: ## Lint backend and frontend
	cd backend && npm run lint
	cd frontend && npm run lint && npm run typecheck

test: ## Backend + frontend unit/integration tests
	cd backend && npm run test:ci
	cd frontend && npm run test:ci

test-docker: ## Same tests, fully inside containers (what Jenkins runs)
	$(COMPOSE) -f docker-compose.ci.yml run --rm --build backend-tests
	$(COMPOSE) -f docker-compose.ci.yml run --rm --build frontend-tests
	$(COMPOSE) -f docker-compose.ci.yml down -v

up: ## Start app + MongoDB (needs .env)
	$(COMPOSE) up -d --build

down: ## Stop everything (data volume is kept)
	$(COMPOSE) down

monitoring: ## Start app + Prometheus (9090) + Grafana (3001)
	$(COMPOSE) -f docker-compose.yml -f docker-compose.monitoring.yml up -d --build

e2e: ## Selenium end-to-end tests against a fresh stack
	mkdir -p test-results
	JWT_SECRET=e2e-only-secret $(COMPOSE) -p stm-e2e -f docker-compose.yml -f docker-compose.e2e.yml up --build --abort-on-container-exit --exit-code-from e2e
	JWT_SECRET=x $(COMPOSE) -p stm-e2e -f docker-compose.yml -f docker-compose.e2e.yml down -v

k8s-render: ## Render the Kubernetes manifests
	kubectl kustomize k8s

k8s-deploy: ## Deploy to the current kube context (see README for the secret)
	kubectl apply -k k8s

jenkins: ## Start a local Jenkins on :8081
	$(COMPOSE) -f jenkins/docker-compose.jenkins.yml up -d --build
