//professionaly approch
//DB is in another continante

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const buildMongoUri = (mongoUri, dbName = DB_NAME) => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  // Warn if credentials might be missing
  if (!mongoUri.includes("@")) {
    console.warn("⚠️  WARNING: MongoDB URI does not contain credentials. Authentication may fail.");
    console.warn("Expected format: mongodb+srv://username:password@host/database");
  }

  const trimmedUri = mongoUri.trim().replace(/\/+$/, "");
  const hasQueryString = trimmedUri.includes("?");
  const [baseUriRaw, queryString] = hasQueryString ? trimmedUri.split(/\?(.*)/s) : [trimmedUri, ""];
  const baseUri = baseUriRaw.replace(/\/+$/, "");
  const lastSegment = baseUri.split("/").filter(Boolean).pop() || "";
  const hasDatabaseInPath = lastSegment !== "" && !lastSegment.includes("@") && !lastSegment.includes(":");

  if (hasDatabaseInPath) {
    return trimmedUri;
  }

  const uriWithDb = `${baseUri}/${dbName}`;
  return queryString ? `${uriWithDb}?${queryString}` : uriWithDb;
};

const connectDB = async () => {
  try {
    const connectionUri = buildMongoUri(process.env.MONGODB_URI);

    const connnectionInstance = await mongoose.connect(connectionUri, {
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`\n ✅ MONGODB connected !! DB HOST: ${connnectionInstance.connection.host}`);
  } catch (error) {
    console.error("❌ MONGODB Connection error:", error.message);

    if (error.message.includes("authentication failed")) {
      console.error("💡 Hint: Check your MongoDB credentials in the MONGODB_URI environment variable");
      console.error("Expected format: mongodb+srv://username:password@cluster.mongodb.net");
    }

    process.exit(1);
  }
};

export default connectDB
