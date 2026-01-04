# cli
FROM golang:1.25 AS cli-build

WORKDIR /app

COPY ./cli ./

RUN mkdir -p bin && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags "-X gitlab.com/9ovindyadav/codefile/cli/internal/config.API=https://codefile-api.9ovind.in -X gitlab.com/9ovindyadav/codefile/cli/internal/config.WEB_URL=https://codebhejo.in" \
    -o ./bin/codebhejo-linux-amd64 ./main.go

# Frontend-build
FROM node:20-alpine AS frontend-build

WORKDIR /var/www/frontend

COPY frontend/ ./

RUN npm install

RUN npm run build

# Frontend
FROM nginx:1.25-alpine AS frontend

COPY ./nginx.conf /etc/nginx/nginx.conf

RUN rm -rf /usr/share/nginx/html/*

COPY --from=frontend-build /var/www/frontend/dist /usr/share/nginx/html
COPY --from=cli-build /app/bin/ /usr/share/nginx/html/download
COPY ./cli/install.sh /usr/share/nginx/html/install.sh

CMD ["nginx", "-g", "daemon off;"]


# Backend
FROM node:20-alpine AS backend

WORKDIR /var/www/backend

COPY backend/ ./

RUN npm install --production

CMD ["npm", "run", "prod"]