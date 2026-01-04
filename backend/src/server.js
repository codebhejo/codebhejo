import app from "./app.js";
import {Server} from "socket.io";
import http from "http";
import { p2pConnection } from "./ws/p2p.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const socketIo = new Server(server, {
    cors: {origin: "*"}
});

p2pConnection(socketIo);

server.listen(PORT, () => {
console.log(`Codefile server running on port ${PORT}`);
});