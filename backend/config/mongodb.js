import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// On Vercel, the module scope is reused across invocations on a warm
// instance, but mongoose.connect() can be called more than once if
// multiple requests race in before the first connection finishes — cache
// the connection promise so we only ever connect once per warm instance.
let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    // Already connected (warm invocation)
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .then((conn) => {
        console.log("✅ MongoDB connected successfully");
        return conn;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection failed:", error.message);
        connectionPromise = null; // allow retry on next invocation
        if (process.env.VERCEL !== "1") {
          // Local/dev: fail fast like before
          process.exit(1);
        }
        throw error;
      });
  }

  return connectionPromise;
};

export default connectDB;