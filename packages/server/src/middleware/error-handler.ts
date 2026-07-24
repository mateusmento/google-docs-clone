import type { Context, Next } from "hono";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors";

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: error.message }, 404);
    }

    if (error instanceof ForbiddenError) {
      return c.json({ error: error.message }, 403);
    }

    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }

    console.error("Unhandled error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}
