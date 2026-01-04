# CodeBhejo

A simple internal code-sharing and collaboration tool for developers.

Instantly create and share code snippets with your team.

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
    ```


## Contributing

Contributions are welcome!  
Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.


## License

CodeBhejo is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

If you run a modified version of this software as a network service,
you must make your source code available to users of that service.
