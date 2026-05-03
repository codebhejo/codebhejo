import express from "express";
import morgan from "morgan";
import codeRoutes from "./routes/code.js";
import authRoutes from "./routes/auth.js";
import p2pRoutes from "./routes/p2p.js";
import adminRoutes from "./routes/admin.js";
import { errorHandler } from "./middleware/error.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(morgan("dev"));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://codebhejo.in"
  ],
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use("/code", codeRoutes);
app.use("/auth", authRoutes);
app.use("/p2p", p2pRoutes);
app.use("/admin", adminRoutes);

app.use(errorHandler);


export default app;