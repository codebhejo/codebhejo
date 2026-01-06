# CodeBhejo

A simple internal code-sharing and collaboration tool for developers.

Instantly create and share code snippets with your team.

## Table of Contents

- [Development Guide](#development-guide)
  - [Prerequisite](#prerequisite)
  - [Local Setup](#local-setup)
  - [Creating AWS S3 credentials](#creating-aws-s3-credentials)
  - [CLI Tool Development](#cli-tool-development)
- [Contributing](#contributing)
- [License](#license)

## Development guide

### Prerequisite
1. NodeJS
2. MySQL
3. Golang
4. AWS S3

### Local setup
1. Make a fork and clone repo in ypur local system

2. Set backend env file
    ```bash
    cp backend/.env.example backend/.env
    ```

3. Install dependecies
    ```bash
    npm install
    ```

4. Setup MySQL instance and create a Database `codebhejo`

5. Migrate Database tables
    ```bash
    npm run migrate
    ```

6. Start frontend and backend service
    ```bash
    npm run dev
    ```

7. Open in Browser [http://localhost:5173](http://localhost:5173)


### Creating AWS S3 credentials

Now to set S3 bucket env variables follow below steps:
```bash
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_BUCKET="codebhejo"
S3_REGION="ap-south-1"
```

1. Login to your AWS account and open IAM (Identity and access management)
2. Create a user named `codebhejo`
3. Now go to `policies` and create a policy named `codebhejo-s3-bucket` with below json value to give user minimum required access of s3 bucket

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
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                "Resource": "arn:aws:s3:::codebhejo/*"
            }
        ]
    }
    ```
4. Open user `codebhejo` and attach permission policy `codebhejo-s3-bucket` to user.
5. After setting permission policy to user open `Security credentials` section and create `Access key`


### CLI tool development
1. Make sure `Golang` is installed
    ```bash
    go version
    ```
1. Change directory to `cli` and run all commands init
    ```bash
    cd cli
    ```

2. Install `golang` dependecies
    ```bash
    go mod tidy
    ```
4. Run app
    ```bash
    go run main.go
    ```
5. Build a `Linux` binary
    ```bash
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags "-X github.com/codebhejo/codebhejo/cli/internal/config.API=http://localhost:3000 -X github.com/codebhejo/codebhejo/cli/internal/config.WEB_URL=http://localhost:5173" \
    -o codebhejo-linux-amd64 ./main.go

    # Executable permission
    chmod +x codebhejo-linux-amd64

    # Move binary to local user bin directory
    sudo mv codebhejo-linux-amd64 /usr/local/bin/codebhejo

    # check version
    codebhejo version
    ```


## Contributing

Contributions are welcome!

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.


## License

CodeBhejo is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

If you run a modified version of this software as a network service,
you must make your source code available to users of that service.
