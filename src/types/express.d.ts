import type { User } from "../db/schema/users";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        clerkId: string;
        role: "admin" | "university" | "landlord" | "student";
        user: User;
      };
    }
  }
}

export {};
