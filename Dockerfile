# Estágio 1: Build do Frontend React + Vite
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Estágio 2: Build do Backend TypeScript
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Estágio 3: Container de Produção Unificado de Alta Performance
FROM node:22-alpine AS runner
WORKDIR /app

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=80

# Copia dependências de produção do backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copia código compilado do backend
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copia arquivos estáticos compilados do frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/backend

EXPOSE 80

CMD ["node", "dist/server.js"]
