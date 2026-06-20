// index.js or server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/mongodb.js";
import { initProducer, disconnectProducer } from "./services/kafkaProducer.js";
import { initConsumer, disconnectConsumer } from "./services/kafkaConsumer.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import uploadRouter from "./routes/uploadRoute.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// After your other app.use() lines:
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to DB
connectDB();

// Middleware
app.use(bodyParser.json());
const defaultOrigins = [
  "https://kashvi-creations-mvli.vercel.app",
  "https://kashvi-creations-admin.vercel.app",
  "http://localhost:5173",
];
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : defaultOrigins;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use("/uploads", express.static("uploads"));


// Routes
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/upload", uploadRouter);

app.get("/", (req, res) => {
  res.send("Hello world from Server");
});

// Kafka init (no-op when ENABLE_KAFKA !== "true", handled inside these functions)
const kafkaEnabled = process.env.ENABLE_KAFKA === "true";
let kafkaInitPromise = null;
const ensureKafka = () => {
  if (!kafkaInitPromise) {
    kafkaInitPromise = (async () => {
      if (kafkaEnabled) {
        await initProducer();
        await initConsumer();
        console.log("Kafka Enabled");
      } else {
        console.log("Kafka Disabled");
      }
    })();
  }
  return kafkaInitPromise;
};

// On Vercel, each invocation reuses the warm module scope, so kick this off
// immediately (don't block the handler on it — Kafka failures shouldn't 500 requests).
ensureKafka().catch((err) => console.error("Kafka init failed:", err));

const isVercel = process.env.VERCEL === "1";

if (!isVercel) {
  // Local / traditional Node hosting: run a normal long-lived server.
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  // Graceful shutdown only makes sense for a long-lived process.
  process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    if (kafkaEnabled) {
      await disconnectProducer();
      await disconnectConsumer();
    }
    process.exit(0);
  });
}

// Vercel's @vercel/node runtime imports this file and calls the default
// export as a request handler for every invocation — it must NOT call
// app.listen(). Exporting `app` (an Express app is a valid (req,res) handler)
// covers that case.
export default app;
