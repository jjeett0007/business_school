import mongoose from "mongoose";
import { config } from "../config";

export function connectToDatabase() {
  const uri = `mongodb+srv://${config.mongoose.url}/${config.mongoose.database}`;

  mongoose.connect(uri, {
    user: config.mongoose.username,
    pass: config.mongoose.password
  });

  mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
}

