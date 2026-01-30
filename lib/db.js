import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // 👈 LOAD ENV HERE

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("ENV:", process.env);
  throw new Error("Please define MONGO_URI");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
