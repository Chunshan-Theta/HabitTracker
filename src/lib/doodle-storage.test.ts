import assert from "node:assert/strict";
import test from "node:test";
import { packDoodleForDb, unpackDoodleFromDb } from "./doodle-storage.ts";

const SAMPLE_JPEG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

test("packDoodleForDb rejects invalid data URLs", () => {
  assert.throws(() => packDoodleForDb("not-an-image"), /Invalid doodle/);
});

test("packDoodleForDb round-trips through gzip storage", () => {
  const packed = packDoodleForDb(SAMPLE_JPEG);
  assert.ok(packed.length > 0);
  assert.ok(packed.length < SAMPLE_JPEG.length);

  const restored = unpackDoodleFromDb(packed);
  assert.equal(restored, SAMPLE_JPEG);
});
