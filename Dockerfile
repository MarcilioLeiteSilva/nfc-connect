# Multi-stage build para NFC CONNECT (Comunicar Marketing)
# Estágio 1: Build da aplicação React + Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Copia dependências do frontend
COPY frontend/package*.json ./
RUN npm ci

# Copia código fonte do frontend e gera os arquivos de produção
COPY frontend/ ./
RUN npm run build

# Estágio 2: Servidor Web Nginx de alta performance
FROM nginx:alpine

# Configuração customizada do Nginx com suporte a SPA e Gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
