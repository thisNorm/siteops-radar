import { z } from "zod";

const urlSchema = z
  .string()
  .trim()
  .min(4)
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Only valid http and https URLs are allowed.");

export function normalizeUrl(input: string) {
  const parsedInput = input.includes("://") ? input : `https://${input}`;
  const result = urlSchema.safeParse(parsedInput);

  if (!result.success) {
    throw new Error("INVALID_URL");
  }

  const url = new URL(result.data);

  if (url.username || url.password) {
    throw new Error("URL_CREDENTIALS_NOT_ALLOWED");
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}
