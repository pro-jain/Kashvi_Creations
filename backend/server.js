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
app.use(
  cors({
    origin: ["https://kc-frontend.vercel.app", "https://kc-admin-one.vercel.app","http://localhost:5173"],
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

// Initialize Kafka and start server
const startServer = async () => {
  try {
   const kafkaEnabled = process.env.ENABLE_KAFKA === "true";

if (kafkaEnabled) {
    await initProducer();
    await initConsumer();
    console.log("Kafka Enabled");
} else {
    console.log("Kafka Disabled");
}

    // Start server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log("Kafka Producer and Consumer initialized");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Shutting down gracefully...");
      await disconnectProducer();
      await disconnectConsumer();
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
