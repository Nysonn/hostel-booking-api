import { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

type UserRole = "admin" | "university" | "landlord" | "student";

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized: no valid session" });
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized: user not registered" });
      return;
    }

    req.auth = { clerkId: userId, role: user.role, user };
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole = (...roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: requires role ${roles.join(" or ")}`,
      });
      return;
    }
    next();
  };
};

export const requireNotSuspended: RequestHandler = (req, res, next) => {
  if (req.auth?.user.isSuspended) {
    res.status(403).json({
      success: false,
      message: "Forbidden: your account has been suspended",
    });
    return;
  }
  next();
};
