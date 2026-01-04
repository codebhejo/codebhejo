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