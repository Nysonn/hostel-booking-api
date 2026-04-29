import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      userContext?: {
        clerkId: string;
        role: "admin" | "university" | "landlord" | "student";
        user: User;
      };
    }
  }
}

export {};
