//professionaly approch
//DB is in another continante

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const buildMongoUri = (mongoUri, dbName = DB_NAME) => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set");
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
    let connnectionInstance = await mongoose.connect(connectionUri);
    console.log(`\n MONGODB connected !! DB HOST: ${connnectionInstance.connection.host}`);
  } catch (error) {
    console.log("MONGODB Connection error ", error);
    process.exit(1);//need to study
  }
};

export default connectDB
