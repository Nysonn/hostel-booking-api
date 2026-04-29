import { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "../db";

type UserRole = "admin" | "university" | "landlord" | "student";

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized: no valid session" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized: user not registered" });
      return;
    }

    req.userContext = { clerkId: userId, role: user.role, user };
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole = (...roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.userContext || !roles.includes(req.userContext.role as UserRole)) {
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
  if (req.userContext?.user.isSuspended) {
    res.status(403).json({
      success: false,
      message: "Forbidden: your account has been suspended",
    });
    return;
  }
  next();
};
