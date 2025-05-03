import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoute from "./routes/api.js";

dotenv.config();
const app = express();

const allowedOrigins = ["https://jimmy2202.github.io"];
const allowedOrigins2 = ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

/*app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // 🔥 Em produção, use true + HTTPS
  })
);*/

app.use("/api", apiRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
