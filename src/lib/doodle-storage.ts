import { gunzipSync, gzipSync } from "zlib";

const MAX_RAW_BYTES = 200_000;
const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export function packDoodleForDb(dataUrl: string): Buffer {
  const match = DATA_URL_PATTERN.exec(dataUrl.trim());
  if (!match) {
    throw new Error("Invalid doodle image format");
  }

  const mime = match[1];
  const raw = Buffer.from(match[2], "base64");
  if (raw.length === 0 || raw.length > MAX_RAW_BYTES) {
    throw new Error("Doodle image size out of range");
  }

  const mimeBuf = Buffer.from(mime, "utf8");
  if (mimeBuf.length > 32) {
    throw new Error("Unsupported doodle mime type");
  }

  const header = Buffer.alloc(1 + mimeBuf.length);
  header[0] = mimeBuf.length;
  mimeBuf.copy(header, 1);

  return gzipSync(Buffer.concat([header, raw]));
}

export function unpackDoodleFromDb(payload: Buffer): string {
  const data = gunzipSync(payload);
  if (data.length < 2) {
    throw new Error("Corrupt doodle payload");
  }

  const mimeLen = data[0];
  const mime = data.subarray(1, 1 + mimeLen).toString("utf8");
  const raw = data.subarray(1 + mimeLen);
  if (!mime.startsWith("image/")) {
    throw new Error("Corrupt doodle mime");
  }

  return `data:${mime};base64,${raw.toString("base64")}`;
}
