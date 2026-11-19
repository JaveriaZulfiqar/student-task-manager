# One image: the API plus the compiled React app it serves. Build from the repo root:
#   docker build -t student-task-manager .

ARG NODE_VERSION=20

# ---- frontend: dependencies, then build --------------------------------------
FROM node:${NODE_VERSION}-alpine AS frontend-deps
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM frontend-deps AS frontend-build
COPY frontend/ .
RUN npm run build

# ---- test targets used by CI (docker-compose.ci.yml) -------------------------
FROM frontend-deps AS frontend-test
COPY frontend/ .
CMD ["sh", "-c", "npm run lint && npm run typecheck && npm run test:ci"]

FROM node:${NODE_VERSION}-bookworm-slim AS backend-test
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ .
CMD ["sh", "-c", "npm run lint && npm run test:ci"]

# ---- backend: production dependencies only -----------------------------------
FROM node:${NODE_VERSION}-alpine AS backend-deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- runtime ------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production PORT=5000
WORKDIR /app
COPY --from=backend-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node backend/ .
COPY --from=frontend-build --chown=node:node /frontend/dist ./dist
# The app never needs npm/yarn at runtime. Removing them drops their bundled dependencies
# (Trivy flagged a critical CVE in npm's bundled `tar`) and shrinks the attack surface.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg
USER node
EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1
CMD ["node", "server.js"]
