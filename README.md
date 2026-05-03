# CodeBhejo

A simple internal code-sharing and collaboration tool for developers.

Instantly create and share code snippets with your team.

## Table of Contents

- [Development Guide](#development-guide)
  - [Prerequisites](#prerequisites)
  - [Local Setup](#local-setup)
  - [Make Targets](#make-targets)
  - [AWS S3 Setup (production)](#aws-s3-setup-production)
  - [CLI Development](#cli-development)
- [Contributing](#contributing)
- [License](#license)

## Development Guide

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Go](https://go.dev/)
- [Docker](https://docs.docker.com/get-docker/) (for local infrastructure)

No AWS account needed for local development — MinIO runs locally as a drop-in S3 replacement.

### Local Setup

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd codebhejo

# 2. Start local infrastructure (MySQL + MinIO + phpMyAdmin)
make infra-up

# 3. Install deps and create your .env (pre-filled to match docker services)
make setup
#    → only set JWT_SECRET in apps/backend/.env, everything else works out of the box

# 4. Run migrations and start the app
make migrate && make dev
```

Open [http://localhost:5173](http://localhost:5173)

**Local service URLs:**

| Service    | URL                                              |
|------------|--------------------------------------------------|
| App        | http://localhost:5173                            |
| API        | http://localhost:3000                            |
| phpMyAdmin | http://localhost:8080                            |
| MinIO UI   | http://localhost:9001 (minioadmin / minioadmin)  |
| Mailpit    | http://localhost:8025 (catches all outgoing mail)|

### Make Targets

| Target | Description |
|--------|-------------|
| `make infra-up` | Start local infrastructure via Docker |
| `make infra-down` | Stop local infrastructure |
| `make infra-logs` | Tail infrastructure logs |
| `make setup` | First-time setup: copy `.env`, install all deps |
| `make dev` | Run frontend + backend (Ctrl+C stops both) |
| `make dev-frontend` | Run frontend only |
| `make dev-backend` | Run backend only |
| `make build` | Production build of frontend |
| `make migrate` | Run pending database migrations |
| `make rollback` | Rollback last migration |
| `make cli-run` | Run CLI locally |
| `make cli-build` | Build CLI Linux binary |
| `make cli-install` | Build and install CLI to `/usr/local/bin` |

### AWS S3 Setup (production)

For production deployments, replace the MinIO values in your `.env` with real AWS credentials:

```bash
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_BUCKET="codebhejo"
S3_REGION="ap-south-1"
# Remove S3_ENDPOINT to use AWS S3
```

1. In AWS IAM, create a user named `codebhejo`
2. Create and attach a policy named `codebhejo-s3-bucket`:

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "CodebhejoListBucket",
                "Effect": "Allow",
                "Action": "s3:ListBucket",
                "Resource": "arn:aws:s3:::codebhejo"
            },
            {
                "Sid": "CodebhejoS3Access",
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                "Resource": "arn:aws:s3:::codebhejo/*"
            }
        ]
    }
    ```

3. Under Security Credentials, create an Access Key

### CLI Development

```bash
make cli-run          # run locally
make cli-build        # build Linux binary
make cli-install      # install to /usr/local/bin
codebhejo version
```

To target a specific environment, override the URLs at build time:

```bash
cd apps/cli && \
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
go build -ldflags "-X github.com/codebhejo/codebhejo/cli/internal/config.API=https://api.example.com \
                   -X github.com/codebhejo/codebhejo/cli/internal/config.WEB_URL=https://example.com" \
-o codebhejo-linux-amd64 ./main.go
```

## Contributing

Contributions are welcome!

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.

## License

CodeBhejo is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

If you run a modified version of this software as a network service,
you must make your source code available to users of that service.
