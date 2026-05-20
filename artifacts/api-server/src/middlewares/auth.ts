import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const JWT_SECRET = process.env.SESSION_SECRET ?? "alphatrade-secret-key";

export interface AuthPayload {
  userId: number;
  isAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        isAdmin: boolean;
      };
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
    if (!user || user.isBlocked) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.user = { id: user.id, isAdmin: user.isAdmin };
    next();
  } catch (err) {
    logger.warn({ err }, "JWT verification failed");
    res.status(401).json({ error: "Unauthorized" });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}
