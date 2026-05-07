import test from "node:test";
import assert from "node:assert/strict";

import { buildMongoUri } from "../src/db/index.js";

test("buildMongoUri appends the default database name when only a cluster URI is provided", () => {
  const uri = buildMongoUri("mongodb+srv://user:pass@cluster0.example.mongodb.net");

  assert.equal(uri, "mongodb+srv://user:pass@cluster0.example.mongodb.net/videotube");
});

test("buildMongoUri preserves query string options when appending the database name", () => {
  const uri = buildMongoUri(
    "mongodb+srv://user:pass@cluster0.example.mongodb.net/?retryWrites=true&w=majority"
  );

  assert.equal(
    uri,
    "mongodb+srv://user:pass@cluster0.example.mongodb.net/videotube?retryWrites=true&w=majority"
  );
});

test("buildMongoUri leaves a URI unchanged when it already contains a database name", () => {
  const uri = buildMongoUri(
    "mongodb+srv://user:pass@cluster0.example.mongodb.net/customdb?retryWrites=true&w=majority"
  );

  assert.equal(
    uri,
    "mongodb+srv://user:pass@cluster0.example.mongodb.net/customdb?retryWrites=true&w=majority"
  );
});

test("buildMongoUri throws a clear error when MONGODB_URI is missing", () => {
  assert.throws(() => buildMongoUri(""), /MONGODB_URI is not set/);
});
