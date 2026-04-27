import { db } from "../db";
import { notifications } from "../db/schema";

export async function createNotification(params: {
  userId: string;
  title: string;
  body: string;
  type: string;
}): Promise<void> {
  await db.insert(notifications).values({
    userId: params.userId,
    title: params.title,
    body: params.body,
    type: params.type,
  });
}
